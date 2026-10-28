import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import type { z } from "zod";
import { selectOne } from "../db/query";
import { withTransaction } from "../db/transaction";
import { saveShippingAddress, type AddressUpdateOrder } from "../admin/order-address-updates";
import { orderShippingAddress, normalizedOrderAddress, type OrderAddressRow } from "../admin/order-address";
import { checkoutAddressSchema } from "./checkout-validation";
import { DeliveryReviewError, deliveryReviewRequired, type DeliveryReviewState, type deliveryReviewInputSchema } from "./delivery-review";

interface ReviewOrder extends RowDataPacket, AddressUpdateOrder { id: string }

async function paidReviewOrder(key: string, connection: PoolConnection): Promise<ReviewOrder> {
  const payment = await selectOne<RowDataPacket & { order_id: string }>("SELECT CAST(order_id AS CHAR) AS order_id FROM payments WHERE idempotency_key = ? AND provider = 'STRIPE'", [key], connection);
  if (!payment) throw new DeliveryReviewError("Order not found.", 404);
  const order = await selectOne<ReviewOrder>("SELECT *, CAST(id AS CHAR) AS id FROM orders WHERE id = ? FOR UPDATE", [payment.order_id], connection);
  const checkout = await selectOne<RowDataPacket & { inventory_state: string }>("SELECT inventory_state FROM stripe_checkouts WHERE order_id = ? FOR UPDATE", [payment.order_id], connection);
  if (!order || order.payment_status !== "PAID" || checkout?.inventory_state !== "COMMITTED") throw new DeliveryReviewError("Your payment must be confirmed before reviewing this delivery address.");
  return order;
}

async function shippingAddress(orderId: string, connection: PoolConnection) {
  const row = await selectOne<RowDataPacket & OrderAddressRow>("SELECT * FROM order_addresses WHERE order_id = ? AND address_type = 'SHIPPING' FOR UPDATE", [orderId], connection);
  if (!row) throw new DeliveryReviewError("No delivery address is recorded. Please contact us for help.");
  return checkoutAddressSchema.parse(orderShippingAddress(row));
}

export async function readDeliveryReview(key: string): Promise<DeliveryReviewState> {
  return withTransaction(async (connection) => {
    const order = await paidReviewOrder(key, connection);
    if (!deliveryReviewRequired(order)) return { required: false };
    return { required: true, revision: order.shipping_address_revision, address: await shippingAddress(order.id, connection) };
  });
}

export async function confirmDeliveryReview(input: z.infer<typeof deliveryReviewInputSchema>, ipAddress: string | null) {
  return withTransaction(async (connection) => {
    const order = await paidReviewOrder(input.key, connection);
    if (!order.delivery_address_review_required) {
      const current = await shippingAddress(order.id, connection);
      if (normalizedOrderAddress(current) === normalizedOrderAddress(input.address)) return { success: true, changed: false } as const;
      throw new DeliveryReviewError("The address has already been confirmed. Please contact us for any further changes.");
    }
    const result = await saveShippingAddress(order.id, order, { kind: "shipping-address", address: input.address, revision: input.revision, reason: "Customer confirmed delivery after wallet payment" }, null, ipAddress, connection);
    if (!result.success && result.message.includes("manager")) return { ...result, message: "This address needs a different delivery service or charge. Please contact us to arrange the change. Your payment has not changed." };
    return result;
  });
}

type ProductType = "STANDARD" | "BUNDLE" | "UNAVAILABLE";

export interface SoldProductItem {
  id: string;
  orderId: string;
  parentId: string | null;
  variantId: string | null;
  hour: string;
  productType: ProductType;
  quantity: number;
  itemValue: number;
  itemDiscounts: number;
  componentsPerBundle: number | string | null;
  untrackedPerBundle: number | string | null;
}

export interface ProductReservation {
  orderId: string;
  variantId: string;
  quantity: number;
}

type ProductSalesRow = {
  hour: string;
  label: ProductType;
  units: number;
  itemValue: number;
  itemDiscounts: number;
};

export function productSalesRows(
  items: readonly SoldProductItem[],
  reservations: readonly ProductReservation[],
): ProductSalesRow[] {
  const orders = new Map<string, SoldProductItem[]>();
  const reserved = new Map<string, Map<string, number>>();
  for (const item of items) {
    const order = orders.get(item.orderId) ?? [];
    order.push(item);
    orders.set(item.orderId, order);
  }
  for (const reservation of reservations) {
    const variants = reserved.get(reservation.orderId) ?? new Map<string, number>();
    variants.set(reservation.variantId, reservation.quantity);
    reserved.set(reservation.orderId, variants);
  }

  const result: ProductSalesRow[] = [];
  for (const [orderId, order] of orders) {
    const remaining = new Map(reserved.get(orderId));
    const children = new Map<string, SoldProductItem[]>();
    const rows = new Map<ProductType, ProductSalesRow>();
    for (const item of order) {
      if (item.parentId === null) continue;
      const siblings = children.get(item.parentId) ?? [];
      siblings.push(item);
      children.set(item.parentId, siblings);
    }
    const consume = (variantId: string | null, quantity: number) => {
      if (variantId !== null)
        remaining.set(variantId, Math.max(0, (remaining.get(variantId) ?? 0) - quantity));
    };
    let hasUnrecordedBundle = false;
    let configuredBundleUnits = 0;
    let untrackedBundleUnits = 0;
    for (const item of order) {
      if (item.parentId !== null) continue;
      const row = rows.get(item.productType) ?? {
        hour: item.hour, label: item.productType,
        units: 0, itemValue: 0, itemDiscounts: 0,
      };
      // Revenue belongs to the purchased line, never to its component records.
      row.itemValue += item.itemValue;
      row.itemDiscounts += item.itemDiscounts;
      if (item.productType === "BUNDLE" && item.variantId !== null)
        remaining.delete(item.variantId);

      const components = children.get(item.id);
      if (components?.length) {
        // Imported child quantities already include the purchased bundle quantity.
        for (const component of components) {
          row.units += component.quantity;
          consume(component.variantId, component.quantity);
        }
      } else if (item.productType === "BUNDLE") {
        hasUnrecordedBundle = true;
        configuredBundleUnits += item.quantity * Number(item.componentsPerBundle ?? 1);
        untrackedBundleUnits += item.quantity * Number(item.untrackedPerBundle ?? 0);
      } else {
        row.units += item.quantity;
        consume(item.variantId, item.quantity);
      }
      rows.set(item.productType, row);
    }

    const bundles = rows.get("BUNDLE");
    if (bundles && hasUnrecordedBundle) {
      // Reservations retain the quantities purchased even after a bundle is edited.
      // Remove standalone units and bundle parent variants before counting contents.
      const recordedUnits = [...remaining.values()].reduce((sum, quantity) => sum + quantity, 0);
      bundles.units += recordedUnits > 0
        ? recordedUnits + untrackedBundleUnits
        : configuredBundleUnits;
    }
    result.push(...rows.values());
  }
  return result;
}

import { royalMailTrackingUrl } from "../admin/order-status";
import type { EmailBrand } from "./layout";
import type { EmailCopyKey } from "./copy";
import { contactEmail, contactReceiptEmail, newsletterEmail, orderEmail, passwordResetEmail, smtpTestEmail, storeAlertEmail, type OrderEmailData } from "./templates";

export function emailPreviews(brand: EmailBrand, scenario = "default") {
  const order: OrderEmailData = { number: "N7-1001", name: "Alex Morgan", email: "preview@example.com", currency: "GBP", status: "NEW", paymentStatus: "UNPAID", fulfillmentStatus: "UNFULFILLED", paymentMethod: "BANK_TRANSFER", subtotal: 9800, discount: 1000, shipping: 450, tax: 0, total: 9250, address: "Alex Morgan\n12 Sample Street\nLondon\nSW1A 1AA\nGB", shippingMethod: "Standard delivery", bankInstructions: "Preview only: your saved bank transfer instructions appear here.", items: [{ name: "Devoir Elixer", imageUrl: "/imgs/products/1.png", variant: "100 ml", quantity: 1, unitPrice: 5800, total: 5800 }, { name: "Deja Vu", imageUrl: "/imgs/products/2.png", variant: "100 ml", quantity: 1, unitPrice: 4000, total: 4000 }] };
  const scenarios: Record<string, Partial<OrderEmailData>> = {
    confirmed: { status: "CONFIRMED" }, processing: { status: "PROCESSING", paymentStatus: "PAID" },
    delivered: { status: "DELIVERED", paymentStatus: "PAID", fulfillmentStatus: "FULFILLED" },
    cancelled: { status: "CANCELLED" }, refunded: { status: "REFUNDED", paymentStatus: "REFUNDED" },
    cash: { paymentMethod: "CASH_ON_DELIVERY" }, bankMissing: { bankInstructions: undefined },
    other: { status: "ON_HOLD", paymentMethod: "CARD", paymentStatus: "PENDING" },
  };
  const sample = { ...order, ...scenarios[scenario] };
  const dispatch = { ...order, status: "SHIPPED", paymentStatus: "PAID", fulfillmentStatus: "FULFILLED", postageService: "Tracked 48", trackingReference: "VU000000000GB", trackingUrl: royalMailTrackingUrl };
  return [
    { key: "order-confirmation", label: "Order confirmation", email: orderEmail(brand, scenario === "shipped" ? dispatch : sample, "confirmation") },
    { key: "order-status-update", label: "Order status / dispatch", email: orderEmail(brand, ["default", "shipped"].includes(scenario) ? dispatch : sample, "update") },
    { key: "new-order-team", label: "New order for the team", email: orderEmail(brand, scenario === "shipped" ? dispatch : sample, "team") },
    { key: "order-update-team", label: "Order update for the team", email: orderEmail(brand, scenario === "shipped" ? dispatch : sample, "team-update") },
    { key: "payment-failure-team", label: "Payment failure", email: storeAlertEmail(brand, "payment-failure-team", [["Order", order.number], ["Customer email", order.email]], "/admin/orders") },
    { key: "low-stock-team", label: "Low stock", email: storeAlertEmail(brand, "low-stock-team", [["Product", "Devoir Elixer"], ["Variant", "100 ml"], ["SKU", "N7-PREVIEW"], ["Available", "3"], ["Alert threshold", "5"]], "/admin/products") },
    { key: "storefront-contact", label: "Customer enquiry", email: contactEmail(brand, { name: "Alex Morgan", email: "preview@example.com", topic: "Fragrance advice", message: "I enjoy warm, woody fragrances. Could you help me choose between Devoir Elixer and Deja Vu?" }) },
    { key: "contact-receipt", label: "Enquiry receipt", email: contactReceiptEmail(brand, "Alex", "Fragrance advice", "N7-PREVIEW") },
    { key: "admin-password-reset", label: "Administrator password reset", email: passwordResetEmail(brand, "Alex", `${brand.appUrl}/admin/reset-password?token=preview`) },
    { key: "newsletter-confirmation", label: "Subscription confirmation", email: newsletterEmail(brand, "confirm", `${brand.appUrl}/newsletter/confirm?token=preview`) },
    { key: "newsletter-welcome", label: "Confirmed subscription", email: newsletterEmail(brand, "welcome", `${brand.appUrl}/newsletter/unsubscribe?token=preview`) },
    { key: "newsletter-checkout", label: "Checkout subscription", email: newsletterEmail(brand, "checkout", `${brand.appUrl}/newsletter/unsubscribe?token=preview`) },
    { key: "smtp-test", label: "SMTP delivery check", email: smtpTestEmail(brand, "preview@example.com") },
  ] satisfies Array<{ key: EmailCopyKey; label: string; email: ReturnType<typeof orderEmail> }>;
}

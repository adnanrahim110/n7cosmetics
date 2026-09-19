import type { EmailBrand } from "./layout";
import { contactEmail, contactReceiptEmail, newsletterEmail, orderEmail, passwordResetEmail, smtpTestEmail, type OrderEmailData } from "./templates";

export function emailPreviews(brand: EmailBrand) {
  const order: OrderEmailData = { number: "N7-PREVIEW-1042", name: "Alex Morgan", email: "preview@example.com", currency: "GBP", status: "NEW", paymentStatus: "UNPAID", fulfillmentStatus: "UNFULFILLED", paymentMethod: "BANK_TRANSFER", subtotal: 9800, discount: 1000, shipping: 450, tax: 0, total: 9250, address: "Alex Morgan\n12 Sample Street\nLondon\nSW1A 1AA\nGB", shippingMethod: "Standard delivery", bankInstructions: "Preview only: your saved bank transfer instructions appear here.", items: [{ name: "Devoir Elixer", variant: "100 ml", quantity: 1, unitPrice: 5800, total: 5800 }, { name: "Deja Vu", variant: "100 ml", quantity: 1, unitPrice: 4000, total: 4000 }] };
  return [
    { key: "order-confirmation", label: "Order confirmation", email: orderEmail(brand, order, "confirmation") },
    { key: "order-status-update", label: "Dispatch update", email: orderEmail(brand, { ...order, status: "SHIPPED", paymentStatus: "PAID", fulfillmentStatus: "FULFILLED", trackingReference: "PREVIEW-TRACKING", trackingUrl: `${brand.appUrl}/contact` }, "update") },
    { key: "new-order-team", label: "New order for the team", email: orderEmail(brand, order, "team") },
    { key: "storefront-contact", label: "Customer enquiry", email: contactEmail(brand, { name: "Alex Morgan", email: "preview@example.com", topic: "Fragrance advice", message: "I enjoy warm, woody fragrances. Could you help me choose between Devoir Elixer and Deja Vu?" }) },
    { key: "contact-receipt", label: "Enquiry receipt", email: contactReceiptEmail(brand, "Alex", "Fragrance advice", "N7-PREVIEW") },
    { key: "admin-password-reset", label: "Administrator password reset", email: passwordResetEmail(brand, "Alex", `${brand.appUrl}/admin/reset-password?token=preview`) },
    { key: "newsletter-confirmation", label: "Subscription confirmation", email: newsletterEmail(brand, "confirm", `${brand.appUrl}/newsletter/confirm?token=preview`) },
    { key: "newsletter-welcome", label: "Confirmed subscription", email: newsletterEmail(brand, "welcome", `${brand.appUrl}/newsletter/unsubscribe?token=preview`) },
    { key: "smtp-test", label: "SMTP delivery check", email: smtpTestEmail(brand, "preview@example.com") },
  ];
}

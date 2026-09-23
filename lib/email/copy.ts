// Only literal text is saved. Dynamic slots and their order always come from code.
export interface EmailCopyField { label: string; source: string; group: string; maxLength: number }
export type EmailCopyOverrides = Record<string, string[]>;
const field = (label: string, source: string, group = "Message", maxLength = 2000): EmailCopyField => ({ label, source, group, maxLength });
const title = (source: string, label = "Title") => field(label, source, "Header", 160);
const label = (source: string, name = source) => field(name, source, "Labels and links", 100);
const orderFields = {
  paymentCancelled: field("Cancelled or refunded order", "Do not make a new payment against this order. The recorded payment status is {{paymentStatus}}. Contact N7 with reference {{orderNumber}} if you need payment details clarified.", "Payment wording"),
  paymentPaid: field("Paid order", "Payment of {{total}} is recorded as paid.", "Payment wording"),
  paymentBank: field("Bank transfer instructions", "{{bankInstructions}}\nUse {{orderNumber}} as your payment reference.", "Payment wording"),
  paymentBankMissing: field("Bank transfer without saved instructions", "Bank transfer was selected for this order. Contact N7 with reference {{orderNumber}} to request the transfer details before making payment.", "Payment wording"),
  paymentCash: field("Cash on delivery", "{{total}} is payable on delivery.", "Payment wording"),
  paymentOther: field("Other payment statuses", "Payment status: {{paymentStatus}}.", "Payment wording"),
  orderReference: label("Order reference"), orderStatus: label("Order status"), payment: label("Payment"), fulfilment: label("Fulfilment"), deliveryService: label("Delivery service"),
  subtotal: label("Subtotal"), savings: label("Savings"), delivery: label("Delivery"), tax: label("Tax"), orderTotal: label("Order total"),
  fragrance: label("Fragrance"), amount: label("Amount"), destination: label("Destination"), postageService: label("Postage service"), trackingNumber: label("Tracking number"),
  trackRoyalMail: label("Track on Royal Mail"), trackDelivery: label("Track your delivery"), royalMailTracking: label("Royal Mail tracking"), deliveryTracking: label("Delivery tracking"),
  deliveryAddress: label("Delivery address"), paymentDetails: label("Payment details"), contact: label("Contact N7"),
};
const customerOrderFields = {
  ...orderFields, selection: label("YOUR SELECTION", "Selection heading"),
  helpReply: field("Help (reply available)", "For help with this order, reply to this email and quote {{orderNumber}}."),
  helpWebsite: field("Help (website contact)", "For help with this order, contact N7 through the website and quote {{orderNumber}}."),
};
const teamOrderFields = { ...orderFields, selection: label("ORDERED FRAGRANCES", "Selection heading"), openOrders: label("Open orders in admin") };
const welcomeFields = {
  title: title("Good fragrance. Worth a note."), explore: label("Explore the collections"),
  leave: field("Unsubscribe note", "You can leave the list at any time using the link below."),
  unsubscribe: label("Unsubscribe from N7 fragrance updates"),
};

export const emailCopyTemplates = {
  "order-confirmation": {
    title: title("Your order is with N7."),
    intro: field("Introduction", "{{customerName}}, we have received your selection. Keep order reference {{orderNumber}} for any questions about these fragrances.", "Header"),
    ...customerOrderFields,
  },
  "order-status-update": {
    titleNEW: title("Your order is with N7.", "New order title"), titleCONFIRMED: title("Your order is confirmed.", "Confirmed title"),
    titlePROCESSING: title("Your fragrances are being prepared.", "Processing title"), titleSHIPPED: title("Your order has been dispatched.", "Shipped title"),
    titleDELIVERED: title("Your order is marked delivered.", "Delivered title"), titleCANCELLED: title("Your order has been cancelled.", "Cancelled title"),
    titleOther: title("An update to your order.", "Other status title"),
    intro: field("Status update introduction", "{{customerName}}, the details for order {{orderNumber}} have been updated. Your current order, payment and fulfilment status are shown below.", "Header"),
    dispatched: field("Dispatch introduction", "{{customerName}}, your order {{orderNumber}} has been dispatched{{courier}}. Your delivery and tracking details are below.", "Header"),
    ...customerOrderFields,
  },
  "new-order-team": {
    title: title("A new N7 order."),
    intro: field("Introduction", "{{customerName}} has placed order {{orderNumber}}. Review the payment status and delivery details below before preparing the order.", "Header"),
    ...teamOrderFields,
  },
  "order-update-team": {
    title: title("An N7 order has changed."),
    intro: field("Introduction", "Order {{orderNumber}} for {{customerName}} has been updated. Review the current order, payment, fulfilment and tracking details below.", "Header"),
    ...teamOrderFields,
  },
  "payment-failure-team": {
    title: title("Payment failed"),
    intro: field("Introduction", "Stripe reported a failed payment for this checkout. The customer may try again. Review the current payment status before contacting the customer.", "Header"),
    order: label("Order"), customerEmail: label("Customer email"), review: label("Review in admin"),
  },
  "low-stock-team": {
    title: title("Stock needs attention"),
    intro: field("Introduction", "An active product has reached its low-stock threshold. Available stock includes reservations for pending checkouts. Review inventory before arranging replenishment.", "Header"),
    product: label("Product"), variant: label("Variant"), sku: label("SKU"), available: label("Available"), threshold: label("Alert threshold"), review: label("Review in admin"),
  },
  "storefront-contact": {
    title: title("A note for the N7 team."), intro: field("Introduction", "A customer has written to N7.", "Header"),
    name: label("Name"), email: label("Email"), phone: label("Phone"), topic: label("Topic"), notProvided: label("Not provided"),
    reply: field("Reply instructions", "Reply to this email to respond directly to the customer. The enquiry is also saved in your admin inbox."),
  },
  "contact-receipt": {
    title: title("Your note is with us."),
    intro: field("Introduction", "{{customerName}}, your message about {{topic}} is saved with N7 under enquiry {{reference}}. Our team can now review it. If you need to add anything, reply to this email and include that reference.", "Header"),
    reference: label("Enquiry reference"), regarding: label("Regarding"),
  },
  "admin-password-reset": {
    title: title("Restore your access."),
    intro: field("Introduction", "{{administratorName}}, a password reset was requested for your N7 administrator account. Use the link below to choose a new password.", "Header"),
    expiry: field("Link expiry and safety note", "This link can be used once and expires {{expiryMinutes}} minutes after the request. If you did not request it, leave your password unchanged and disregard this message."),
    reset: label("Choose a new password"),
  },
  "newsletter-confirmation": {
    title: title("A place on the N7 list."),
    intro: field("Introduction", "You asked to receive N7 fragrance updates. Confirm your address to hear about new fragrances, collection releases and N7 offers. This link expires in {{expiryHours}} hours. If you did not sign up, you can ignore this message; your address will stay off the mailing list.", "Header"),
    confirm: label("Confirm my subscription"),
  },
  "newsletter-welcome": {
    ...welcomeFields,
    intro: field("Introduction", "Your address is now confirmed for N7 fragrance updates. We’ll share new additions to the collection and selected offers. Explore Yusuf Bhai Originals, find a familiar inspiration in Recreations, or take a closer look at the N7 Collection.", "Header"),
  },
  "newsletter-checkout": {
    ...welcomeFields,
    intro: field("Introduction", "You’re receiving this email because you provided your address during checkout with N7 Cosmetics and did not opt out of marketing emails. We’ll share news about our fragrances, new launches and selected offers. You can unsubscribe at any time using the link below.", "Header"),
  },
  "smtp-test": {
    title: title("N7, in your inbox."),
    intro: field("Introduction", "This delivery check was requested from N7 admin settings for {{recipient}}. Receiving this message confirms delivery to this mailbox through the saved SMTP connection. Check the sender name, reply address and layout before using the same connection for customer emails.", "Header"),
    destination: label("Destination"), website: label("Website"),
  },
} satisfies Record<string, Record<string, EmailCopyField>>;

export type EmailCopyKey = keyof typeof emailCopyTemplates;
export type EmailCopySettings = Partial<Record<EmailCopyKey, EmailCopyOverrides>>;
export const isEmailCopyKey = (key: string): key is EmailCopyKey => Object.hasOwn(emailCopyTemplates, key);
export const emailCopyDefinition = (key: EmailCopyKey): Record<string, EmailCopyField> => emailCopyTemplates[key];

export function splitEmailCopy(source: string): { literals: string[]; tokens: string[] } {
  const pieces = source.split(/\{\{([A-Za-z]+)\}\}/g);
  return { literals: pieces.filter((_, index) => index % 2 === 0), tokens: pieces.filter((_, index) => index % 2 === 1) };
}

function validLiterals(field: EmailCopyField, input: unknown): input is string[] {
  return Array.isArray(input) && input.length === splitEmailCopy(field.source).literals.length
    && input.every((part) => typeof part === "string" && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]|\{\{|\}\}/.test(part))
    && input.join("").length <= field.maxLength && input.join("").trim().length > 0;
}

export function validateEmailCopy(key: EmailCopyKey, input: unknown): EmailCopyOverrides {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Check the email wording.");
  const definition = emailCopyDefinition(key);
  const overrides: EmailCopyOverrides = {};
  for (const [id, parts] of Object.entries(input)) {
    if (!Object.hasOwn(definition, id)) throw new Error("Dynamic email details cannot be changed here.");
    const spec = definition[id];
    if (!validLiterals(spec, parts)) throw new Error(`Check ${spec.label.toLowerCase()}: keep the locked details and use between 1 and ${spec.maxLength} characters of wording.`);
    if (JSON.stringify(parts) !== JSON.stringify(splitEmailCopy(spec.source).literals)) overrides[id] = parts;
  }
  return overrides;
}

export function readEmailCopy(key: EmailCopyKey, input: unknown): EmailCopyOverrides {
  try { return validateEmailCopy(key, input); } catch { return {}; }
}

export function emailCopy(brand: { emailCopy?: EmailCopySettings }, key: EmailCopyKey) {
  const definition = emailCopyDefinition(key);
  return (id: string, values: Record<string, string> = {}): string => {
    if (!Object.hasOwn(definition, id)) throw new Error(`Unknown email wording: ${key}.${id}`);
    const spec = definition[id];
    const { literals, tokens } = splitEmailCopy(spec.source);
    const saved = brand.emailCopy?.[key]?.[id];
    const text = validLiterals(spec, saved) ? saved : literals;
    return text.map((part, index) => {
      const token = tokens[index];
      if (token && !Object.hasOwn(values, token)) throw new Error(`Missing email detail: ${token}`);
      return part + (token ? values[token] : "");
    }).join("");
  };
}

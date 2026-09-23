import { z } from "zod";

export const emailAddressSchema = z.string().trim().toLowerCase().pipe(z.email().max(190));
export const smtpProviders = ["custom", "gmail", "hosted"] as const;
export const smtpSchema = z.object({
  provider: z.enum(smtpProviders),
  host: z.string().trim().toLowerCase().max(253).regex(/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/, "Enter the SMTP hostname, without a URL, path or port."),
  port: z.number().int().min(1).max(65535),
  security: z.enum(["tls", "starttls"]),
  user: z.string().trim().min(1).max(255).regex(/^[^\r\n]+$/),
  password: z.string().max(500),
  fromName: z.string().trim().min(1).max(120).regex(/^[^\r\n]+$/),
  fromEmail: emailAddressSchema,
}).superRefine((value, ctx) => {
  if ((value.port === 465 && value.security !== "tls") || (value.port === 587 && value.security !== "starttls")) {
    ctx.addIssue({ code: "custom", path: ["security"], message: "Use SSL/TLS for port 465 or STARTTLS for port 587." });
  }
});
export type SmtpInput = z.infer<typeof smtpSchema>;
export interface EmailSettingsFormState { error?: string }

export function smtpPasswordRequired(next: Pick<SmtpInput, "host" | "user">, saved: { host: string; user: string; hasPassword: boolean }): boolean {
  return !saved.hasPassword || next.host.toLowerCase() !== saved.host.toLowerCase() || next.user !== saved.user;
}
export function normalizeSmtpPassword(host: string, password: string): string {
  return host.toLowerCase() === "smtp.gmail.com" ? password.replace(/\s/g, "") : password;
}

export const notificationTypes = ["new_order", "order_update", "enquiry", "payment_failure", "low_stock"] as const;
export type NotificationType = typeof notificationTypes[number];
export const notificationLabels: Record<NotificationType, string> = {
  new_order: "New orders", order_update: "Order updates", enquiry: "Customer enquiries", payment_failure: "Payment failures", low_stock: "Low stock",
};
export const notificationDescriptions: Record<NotificationType, string> = {
  new_order: "Notify your team when a customer's payment is confirmed.",
  order_update: "Notify your team when an administrator changes order status, payment, fulfilment or tracking.",
  enquiry: "Receive messages submitted through the store's contact form.",
  payment_failure: "Notify your team once per checkout when Stripe reports a failed payment.",
  low_stock: "The email worker checks inventory and alerts once per low-stock period. Pending checkout reservations count against available stock.",
};
export const MAX_NOTIFICATION_RECIPIENTS = 10;
const recipientListSchema = z.array(emailAddressSchema).max(MAX_NOTIFICATION_RECIPIENTS).transform((values) => [...new Set(values)]);
const routeSchema = z.object({ enabled: z.boolean(), useDefault: z.boolean(), recipients: recipientListSchema });
export const notificationSettingsSchema = z.object({
  defaultRecipients: recipientListSchema,
  routes: z.object({ new_order: routeSchema, order_update: routeSchema, enquiry: routeSchema, payment_failure: routeSchema, low_stock: routeSchema }),
}).superRefine((value, ctx) => {
  for (const type of notificationTypes) {
    const route = value.routes[type];
    if (route.enabled && !(route.useDefault ? value.defaultRecipients : route.recipients).length) {
      ctx.addIssue({ code: "custom", path: ["routes", type], message: `${notificationLabels[type]} needs at least one recipient, or must be switched off.` });
    }
  }
});
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;

export function notificationRecipients(settings: NotificationSettings, type: NotificationType): string[] {
  const route = settings.routes[type];
  return route.enabled ? [...new Set(route.useDefault ? settings.defaultRecipients : route.recipients)] : [];
}

export function readSetting(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value) as unknown; } catch { return value; }
}

export function legacyNotificationSettings(contactEmail?: string, orderRecipient?: string): NotificationSettings {
  const validEmail = (value?: string) => { const result = emailAddressSchema.safeParse(value); return result.success ? [result.data] : []; };
  const defaultRecipients = validEmail(contactEmail);
  const orderRecipients = validEmail(orderRecipient);
  return {
    defaultRecipients,
    routes: {
      new_order: { enabled: Boolean(orderRecipients.length || defaultRecipients.length), useDefault: !orderRecipients.length, recipients: orderRecipients },
      enquiry: { enabled: Boolean(defaultRecipients.length), useDefault: true, recipients: [] },
      order_update: { enabled: false, useDefault: true, recipients: [] },
      payment_failure: { enabled: false, useDefault: true, recipients: [] },
      low_stock: { enabled: false, useDefault: true, recipients: [] },
    },
  };
}

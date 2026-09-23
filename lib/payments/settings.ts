import Stripe from "stripe";
import { createHash } from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { selectRows } from "../db/query";
import { decryptSecret } from "../security/encryption";

export interface StripeSettings {
  enabled: boolean;
  mode: "test" | "live";
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  revision: string;
}

export class PaymentUnavailableError extends Error {
  constructor() { super("Online payment is currently unavailable. Please try again later."); }
}

export async function getStripeSettings(connection?: PoolConnection): Promise<StripeSettings> {
  const rows = await selectRows<RowDataPacket & { setting_key: string; value_json: unknown }>("SELECT setting_key, value_json FROM site_settings WHERE setting_group = 'stripe' ORDER BY setting_key", [], connection);
  const values: Record<string, unknown> = {};
  for (const row of rows) {
    try { values[row.setting_key] = typeof row.value_json === "string" ? JSON.parse(row.value_json) : row.value_json; }
    catch { values[row.setting_key] = row.value_json; }
  }
  const decrypt = (key: string) => typeof values[key] === "string" && values[key] ? decryptSecret(String(values[key])) : "";
  return {
    enabled: values["stripe.enabled"] === true,
    mode: values["stripe.mode"] === "live" ? "live" : "test",
    publishableKey: String(values["stripe.publishable_key"] || ""),
    secretKey: decrypt("stripe.secret_key_encrypted"),
    // A broken webhook configuration must not disable direct API verification.
    webhookSecret: (() => { try { return decrypt("stripe.webhook_secret_encrypted"); } catch { return ""; } })(),
    revision: createHash("sha256").update(JSON.stringify(values)).digest("hex"),
  };
}

export function stripeKeysReady(settings: Pick<StripeSettings, "mode" | "publishableKey" | "secretKey">): boolean {
  return new RegExp(`^pk_${settings.mode}_[A-Za-z0-9]{16,}$`).test(settings.publishableKey)
    && new RegExp(`^sk_${settings.mode}_[A-Za-z0-9]{16,}$`).test(settings.secretKey);
}

export function stripeClient(settings: StripeSettings): Stripe {
  if (!stripeKeysReady(settings)) throw new PaymentUnavailableError();
  return new Stripe(settings.secretKey, { maxNetworkRetries: 2, timeout: 15_000 });
}

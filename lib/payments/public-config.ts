export interface PublicStripeConfig { enabled: boolean; publishableKey: string | null }
export const disabledStripeConfig: PublicStripeConfig = { enabled: false, publishableKey: null };

// Construct an explicit public allowlist: settings responses must never carry
// the server's secret key, webhook secret or encrypted configuration.
export function readPublicStripeConfig(value: unknown): PublicStripeConfig {
  if (!value || typeof value !== "object" || !("enabled" in value) || !("publishableKey" in value)) return disabledStripeConfig;
  const key = value.publishableKey;
  if (value.enabled !== true || typeof key !== "string" || key.length > 500 || !/^pk_(?:test|live)_[A-Za-z0-9]{16,}$/.test(key)) return disabledStripeConfig;
  return { enabled: true, publishableKey: key };
}

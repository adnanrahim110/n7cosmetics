export const CHECKOUT_ATTEMPT_KEY = "n7-stripe-attempt";

export interface CheckoutAttempt {
  key: string;
  fingerprint: string;
  preserveCart: boolean;
  returnPath: string;
}

export function readCheckoutAttempt(serialized: string | null): CheckoutAttempt | null {
  if (!serialized) return null;
  try {
    const value: unknown = JSON.parse(serialized);
    if (
      !value || typeof value !== "object" ||
      !("key" in value) || typeof value.key !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.key) ||
      !("fingerprint" in value) || typeof value.fingerprint !== "string" ||
      !/^[0-9a-f]{64}$/i.test(value.fingerprint)
    ) return null;

    const preserveCart = "preserveCart" in value && value.preserveCart === true;
    const returnPath = preserveCart &&
      "returnPath" in value && typeof value.returnPath === "string" &&
      value.returnPath.length <= 210 &&
      /^\/(?:products|bundles)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.returnPath)
      ? value.returnPath : "/checkout";
    return { key: value.key, fingerprint: value.fingerprint, preserveCart, returnPath };
  } catch {
    return null;
  }
}

export interface ShippingRule {
  method_type: string;
  price_pence: number;
  free_over_pence: number | null;
  threshold_basis?: "BEFORE_DISCOUNT" | "AFTER_DISCOUNT";
}
/** null means this method is unavailable for the current basket. */
export function shippingPrice(rule: ShippingRule, subtotalPence: number, discountedPence: number, freeShippingCoupon: boolean): number | null {
  const thresholdTotal = rule.threshold_basis === "BEFORE_DISCOUNT" ? subtotalPence : discountedPence;
  const qualifies = rule.free_over_pence !== null && thresholdTotal >= Number(rule.free_over_pence);
  if (rule.method_type === "LOCAL_PICKUP") return Number(rule.price_pence);
  if (rule.method_type === "FREE_SHIPPING") return rule.free_over_pence === null || qualifies || freeShippingCoupon ? 0 : null;
  return qualifies || freeShippingCoupon ? 0 : Number(rule.price_pence);
}

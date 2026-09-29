import { shippingOptions, type ShippingConfiguration, type ThresholdBasis } from "./shipping";

export interface FreeDeliveryProgress {
  methodId: string;
  methodName: string;
  currentPence: number;
  thresholdPence: number;
  remainingPence: number;
  basis: ThresholdBasis;
  estimated: boolean;
}

export function freeDeliveryProgress(config: ShippingConfiguration, countryCode: string, postalCode: string,
  subtotalPence: number, discountedPence: number, coupon: { id: string; name: string } | null = null): FreeDeliveryProgress | null {
  const estimated = !postalCode && config.zones.some(zone => zone.isActive && zone.countries.includes(countryCode) && zone.postcodes.length > 0);
  const options = shippingOptions(config, countryCode, postalCode, subtotalPence, discountedPence, coupon);
  const candidates: FreeDeliveryProgress[] = [];
  for (const option of options) {
    if (!config.methods.some(method => method.id === option.id && method.methodType === "DELIVERY")) continue;
    if (option.pricePence === 0) {
      const rule = option.adjustment?.source === "RULE" ? config.rules.find(rule => rule.id === option.adjustment?.id) : undefined;
      const basis = rule?.thresholdBasis ?? "BEFORE_DISCOUNT";
      candidates.push({ methodId: option.id, methodName: option.name, estimated, basis,
        currentPence: basis === "BEFORE_DISCOUNT" ? subtotalPence : discountedPence,
        thresholdPence: rule?.minimumSubtotalPence ?? 0, remainingPence: 0 });
      continue;
    }
    for (const rule of config.rules) {
      if (!rule.isActive || !rule.methodIds.includes(option.id) || (rule.zoneId !== null && rule.zoneId !== option.zoneId)) continue;
      const currentPence = rule.thresholdBasis === "BEFORE_DISCOUNT" ? subtotalPence : discountedPence;
      candidates.push({ methodId: option.id, methodName: option.name, estimated, basis: rule.thresholdBasis,
        currentPence, thresholdPence: rule.minimumSubtotalPence, remainingPence: Math.max(0, rule.minimumSubtotalPence - currentPence) });
    }
  }
  return candidates.sort((a, b) => a.remainingPence - b.remainingPence)[0] ?? null;
}

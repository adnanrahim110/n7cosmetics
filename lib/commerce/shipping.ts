export type ThresholdBasis = "BEFORE_DISCOUNT" | "AFTER_DISCOUNT";
export interface ShippingZone {
  id: string; name: string; countries: string[]; postcodes: string[]; isActive: boolean; sortOrder: number;
}
export interface ShippingMethod {
  id: string; name: string; methodType: "DELIVERY" | "LOCAL_PICKUP";
  pricingMode: "FLAT_RATE" | "ZONE_RATES"; pricePence: number;
  allowFreeShippingCoupon: boolean; estimatedDaysMin: number | null; estimatedDaysMax: number | null;
  isActive: boolean; sortOrder: number; rates: { zoneId: string; pricePence: number }[];
}
export interface ShippingRule {
  id: string; name: string; minimumSubtotalPence: number; thresholdBasis: ThresholdBasis;
  methodIds: string[]; zoneId: string | null; priority: number; isActive: boolean;
}
export interface ShippingConfiguration { zones: ShippingZone[]; methods: ShippingMethod[]; rules: ShippingRule[] }
export interface ShippingAdjustment { source: "RULE" | "COUPON"; id: string; name: string; amountPence: number }
export interface ShippingOption {
  id: string; name: string; zoneId: string; zoneName: string; basePricePence: number; pricePence: number;
  estimatedDaysMin: number | null; estimatedDaysMax: number | null; adjustment: ShippingAdjustment | null;
}

export function normalizePostcode(value: string) { return value.toUpperCase().replace(/\s/g, ""); }
export function postcodeMatches(postcode: string, pattern: string) {
  const value = normalizePostcode(postcode), match = normalizePostcode(pattern);
  return Boolean(value) && (match.endsWith("*") ? value.startsWith(match.slice(0, -1)) : value === match);
}
export function matchingShippingZone(zones: ShippingZone[], countryCode: string, postalCode = "") {
  return zones.filter(zone => zone.isActive && zone.countries.includes(countryCode)
    && (!zone.postcodes.length || zone.postcodes.some(pattern => postcodeMatches(postalCode, pattern))))
    .sort((a, b) => Number(Boolean(b.postcodes.length)) - Number(Boolean(a.postcodes.length))
      || a.sortOrder - b.sortOrder || Number(a.id) - Number(b.id))[0] ?? null;
}

export function priceShippingMethod(method: ShippingMethod, zone: ShippingZone, rules: ShippingRule[],
  subtotalPence: number, discountedPence: number, coupon: { id: string; name: string } | null = null): ShippingOption | null {
  const rate = method.rates.find(item => item.zoneId === zone.id);
  if (!method.isActive || !rate) return null;
  const basePricePence = method.pricingMode === "FLAT_RATE" ? method.pricePence : rate.pricePence;
  const rule = rules.filter(item => item.isActive && item.methodIds.includes(method.id)
    && (item.zoneId === null || item.zoneId === zone.id)
    && (item.thresholdBasis === "BEFORE_DISCOUNT" ? subtotalPence : discountedPence) >= item.minimumSubtotalPence)
    .sort((a, b) => b.priority - a.priority || Number(a.id) - Number(b.id))[0];
  // One adjustment per method; automatic rules win ties with free-shipping coupons.
  const adjustment: ShippingAdjustment | null = !basePricePence ? null : rule
    ? { source: "RULE", id: rule.id, name: rule.name, amountPence: basePricePence }
    : coupon && method.allowFreeShippingCoupon
      ? { source: "COUPON", ...coupon, amountPence: basePricePence } : null;
  return { id: method.id, name: method.name, zoneId: zone.id, zoneName: zone.name, basePricePence,
    pricePence: adjustment ? 0 : basePricePence, estimatedDaysMin: method.estimatedDaysMin,
    estimatedDaysMax: method.estimatedDaysMax, adjustment };
}

export function shippingOptions(config: ShippingConfiguration, countryCode: string, postalCode: string,
  subtotalPence: number, discountedPence: number, coupon: { id: string; name: string } | null = null) {
  const zone = matchingShippingZone(config.zones, countryCode, postalCode);
  if (!zone) return [];
  return [...config.methods].sort((a, b) => a.sortOrder - b.sortOrder || Number(a.id) - Number(b.id))
    .flatMap(method => {
      const option = priceShippingMethod(method, zone, config.rules, subtotalPence, discountedPence, coupon);
      return option ? [option] : [];
    });
}

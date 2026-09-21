import { hasDatabaseConfig } from "@/lib/env";
import { getShippingConfiguration } from "./shipping-data";
import type { ShippingRule } from "./shipping";

export interface PublicShippingMethod {
  id: string; name: string; zoneName: string; postcodes: string[]; pricePence: number;
  freeShippingRules: Pick<ShippingRule, "id" | "name" | "minimumSubtotalPence" | "thresholdBasis">[];
  estimatedDaysMin: number | null; estimatedDaysMax: number | null;
}
export async function getPublicShippingMethods(countryCode = "GB"): Promise<PublicShippingMethod[]> {
  if (!hasDatabaseConfig()) return [{ id: "source-policy", name: "Standard delivery", zoneName: "United Kingdom", postcodes: [], pricePence: 299,
    freeShippingRules: [{ id: "source-rule", name: "Free Standard delivery", minimumSubtotalPence: 9900, thresholdBasis: "BEFORE_DISCOUNT" }],
    estimatedDaysMin: 3, estimatedDaysMax: 5 }];
  const config = await getShippingConfiguration();
  return config.methods.filter(method => method.isActive).flatMap(method =>
    config.zones.filter(zone => zone.isActive && zone.countries.includes(countryCode)).flatMap(zone => {
      const rate = method.rates.find(item => item.zoneId === zone.id);
      if (!rate) return [];
      return [{ id: method.id + "-" + zone.id, name: method.name, zoneName: zone.name, postcodes: zone.postcodes,
        pricePence: method.pricingMode === "FLAT_RATE" ? method.pricePence : rate.pricePence,
        estimatedDaysMin: method.estimatedDaysMin, estimatedDaysMax: method.estimatedDaysMax,
        freeShippingRules: config.rules.filter(rule => rule.isActive && rule.methodIds.includes(method.id) && (rule.zoneId === null || rule.zoneId === zone.id)) }];
    }));
}

export function formatPolicyMoney(
  pence: number,
  currency = "GBP",
): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: pence % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(pence / 100);
}

export function formatDeliveryEstimate(
  minimum: number | null,
  maximum: number | null,
): string | null {
  if (minimum === null && maximum === null) return null;
  if (minimum !== null && maximum !== null) {
    if (minimum === maximum) {
      return `${minimum} working ${minimum === 1 ? "day" : "days"}`;
    }
    return `${minimum}–${maximum} working days`;
  }
  if (minimum !== null) {
    return `From ${minimum} working ${minimum === 1 ? "day" : "days"}`;
  }
  return `Within ${maximum} working ${maximum === 1 ? "day" : "days"}`;
}

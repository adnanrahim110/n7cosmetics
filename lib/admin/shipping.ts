import { z } from "zod";
import { formCheckbox, formString, formStringList, poundsToPence } from "./form";
import { normalizePostcode } from "../commerce/shipping";

const id = z.string().regex(/^[1-9]\d*$/);
const money = z.number().int().min(0).max(99999999);
const order = z.number().int().min(-100000).max(100000);
export const shippingZoneSchema = z.object({
  name: z.string().trim().min(2).max(150), countries: z.array(z.string().regex(/^[A-Z]{2}$/)).min(1).max(250),
  postcodes: z.array(z.string().regex(/^[A-Z0-9]{1,12}\*?$/)).max(100),
  isActive: z.boolean(), sortOrder: order,
});
export const shippingMethodSchema = z.object({
  name: z.string().trim().min(2).max(150), methodType: z.enum(["DELIVERY", "LOCAL_PICKUP"]),
  pricingMode: z.enum(["FLAT_RATE", "ZONE_RATES"]), pricePence: money,
  estimatedDaysMin: z.number().int().min(0).max(365).nullable(), estimatedDaysMax: z.number().int().min(0).max(365).nullable(),
  allowFreeShippingCoupon: z.boolean(), isActive: z.boolean(), sortOrder: order,
}).refine(item => item.estimatedDaysMin === null || item.estimatedDaysMax === null || item.estimatedDaysMax >= item.estimatedDaysMin);
export const shippingRuleSchema = z.object({
  name: z.string().trim().min(2).max(190), minimumSubtotalPence: money,
  thresholdBasis: z.enum(["BEFORE_DISCOUNT", "AFTER_DISCOUNT"]), methodIds: z.array(id).min(1).max(100),
  zoneId: id.nullable(), priority: order, isActive: z.boolean(),
});
export const shippingRatesSchema = z.array(z.object({ methodId: id, pricePence: money })).max(100);
const optionalNumber = (value: string) => value ? Number(value) : null;
const unique = (items: string[]) => [...new Set(items)];

export function parseShippingZone(form: FormData) {
  return shippingZoneSchema.safeParse({ name: formString(form, "name"),
    countries: unique(formString(form, "countries").split(",").map(value => value.trim().toUpperCase()).filter(Boolean)),
    postcodes: unique(formString(form, "postcodes").split(",").map(normalizePostcode).filter(Boolean)),
    isActive: formCheckbox(form, "isActive"), sortOrder: Number(formString(form, "sortOrder")) });
}
export function parseShippingMethod(form: FormData) {
  const pricingMode = formString(form, "pricingMode");
  return shippingMethodSchema.safeParse({ name: formString(form, "name"), methodType: formString(form, "methodType"), pricingMode,
    pricePence: pricingMode === "ZONE_RATES" ? 0 : poundsToPence(formString(form, "price")),
    estimatedDaysMin: optionalNumber(formString(form, "estimatedDaysMin")), estimatedDaysMax: optionalNumber(formString(form, "estimatedDaysMax")),
    allowFreeShippingCoupon: formCheckbox(form, "allowFreeShippingCoupon"), isActive: formCheckbox(form, "isActive"), sortOrder: Number(formString(form, "sortOrder")) });
}
export function parseShippingRule(form: FormData) {
  return shippingRuleSchema.safeParse({ name: formString(form, "name"), minimumSubtotalPence: poundsToPence(formString(form, "minimumSubtotal")),
    thresholdBasis: formString(form, "thresholdBasis"), methodIds: unique(formStringList(form, "methodIds")),
    zoneId: formString(form, "zoneId") === "all" ? null : formString(form, "zoneId") || null, priority: Number(formString(form, "priority")), isActive: formCheckbox(form, "isActive") });
}

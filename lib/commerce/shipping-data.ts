import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { selectRows } from "../db/query";
import type { ShippingConfiguration, ShippingMethod, ShippingRule } from "./shipping";

interface ZoneRow extends RowDataPacket { id: string; name: string; countries: string | null; is_active: number; sort_order: number }
interface PostcodeRow extends RowDataPacket { zone_id: string; pattern: string }
interface MethodRow extends RowDataPacket {
  id: string; name: string; method_type: ShippingMethod["methodType"]; pricing_mode: ShippingMethod["pricingMode"];
  price_pence: number; allow_free_shipping_coupon: number; estimated_days_min: number | null; estimated_days_max: number | null;
  is_active: number; sort_order: number;
}
interface RateRow extends RowDataPacket { method_id: string; zone_id: string; price_pence: number }
interface RuleRow extends RowDataPacket {
  id: string; name: string; minimum_subtotal_pence: number; threshold_basis: ShippingRule["thresholdBasis"];
  zone_id: string | null; priority: number; is_active: number;
}
interface RuleMethodRow extends RowDataPacket { rule_id: string; method_id: string }
const list = (value: string | null) => value ? value.split(",") : [];

export async function getShippingConfiguration(connection?: PoolConnection): Promise<ShippingConfiguration> {
  const zones = await selectRows<ZoneRow>(`SELECT CAST(z.id AS CHAR) AS id, z.name, z.is_active, z.sort_order,
    (SELECT GROUP_CONCAT(country_code ORDER BY country_code) FROM shipping_zone_countries WHERE zone_id=z.id) AS countries
    FROM shipping_zones z ORDER BY z.sort_order,z.id`, [], connection);
  const postcodes = await selectRows<PostcodeRow>("SELECT CAST(zone_id AS CHAR) AS zone_id,pattern FROM shipping_zone_postcodes ORDER BY pattern", [], connection);
  const methods = await selectRows<MethodRow>(`SELECT CAST(id AS CHAR) AS id,name,method_type,pricing_mode,price_pence,
    allow_free_shipping_coupon,estimated_days_min,estimated_days_max,is_active,sort_order FROM shipping_methods ORDER BY sort_order,id`, [], connection);
  const rates = await selectRows<RateRow>("SELECT CAST(method_id AS CHAR) AS method_id,CAST(zone_id AS CHAR) AS zone_id,price_pence FROM shipping_method_rates", [], connection);
  const rules = await selectRows<RuleRow>(`SELECT CAST(id AS CHAR) AS id,name,minimum_subtotal_pence,threshold_basis,
    CAST(zone_id AS CHAR) AS zone_id,priority,is_active FROM shipping_rules ORDER BY priority DESC,id`, [], connection);
  const targets = await selectRows<RuleMethodRow>("SELECT CAST(rule_id AS CHAR) AS rule_id,CAST(method_id AS CHAR) AS method_id FROM shipping_rule_methods", [], connection);
  return {
    zones: zones.map(row => ({ id: row.id, name: row.name, countries: list(row.countries), postcodes: postcodes.filter(item => item.zone_id === row.id).map(item => item.pattern), isActive: Boolean(row.is_active), sortOrder: row.sort_order })),
    methods: methods.map(row => ({ id: row.id, name: row.name, methodType: row.method_type, pricingMode: row.pricing_mode,
      pricePence: Number(row.price_pence), allowFreeShippingCoupon: Boolean(row.allow_free_shipping_coupon),
      estimatedDaysMin: row.estimated_days_min, estimatedDaysMax: row.estimated_days_max,
      isActive: Boolean(row.is_active), sortOrder: row.sort_order,
      rates: rates.filter(rate => rate.method_id === row.id).map(rate => ({ zoneId: rate.zone_id, pricePence: Number(rate.price_pence) })) })),
    rules: rules.map(row => ({ id: row.id, name: row.name, minimumSubtotalPence: Number(row.minimum_subtotal_pence),
      thresholdBasis: row.threshold_basis, zoneId: row.zone_id, priority: row.priority, isActive: Boolean(row.is_active),
      methodIds: targets.filter(target => target.rule_id === row.id).map(target => target.method_id) })),
  };
}

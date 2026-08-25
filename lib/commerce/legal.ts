import type { RowDataPacket } from "mysql2/promise";
import { selectRows } from "@/lib/db/query";
import { hasDatabaseConfig } from "@/lib/env";

export interface PublicShippingMethod {
  id: string;
  name: string;
  methodType: "FLAT_RATE" | "FREE_SHIPPING" | "LOCAL_PICKUP";
  pricePence: number;
  freeOverPence: number | null;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
}

interface ShippingMethodRow extends RowDataPacket {
  id: string;
  name: string;
  method_type: PublicShippingMethod["methodType"];
  price_pence: number;
  free_over_pence: number | null;
  estimated_days_min: number | null;
  estimated_days_max: number | null;
}

const sourcePolicyFallback: PublicShippingMethod[] = [
  {
    id: "source-policy",
    name: "Standard delivery",
    methodType: "FLAT_RATE",
    pricePence: 250,
    freeOverPence: 9900,
    estimatedDaysMin: 3,
    estimatedDaysMax: 5,
  },
];

export async function getPublicShippingMethods(
  countryCode = "GB",
): Promise<PublicShippingMethod[]> {
  if (!hasDatabaseConfig()) return sourcePolicyFallback;

  const rows = await selectRows<ShippingMethodRow>(
    `SELECT CAST(m.id AS CHAR) AS id,
            m.name,
            m.method_type,
            m.price_pence,
            m.free_over_pence,
            m.estimated_days_min,
            m.estimated_days_max
       FROM shipping_methods m
       INNER JOIN shipping_zones z ON z.id = m.zone_id AND z.is_active = 1
       INNER JOIN shipping_zone_countries c ON c.zone_id = z.id
      WHERE c.country_code = ? AND m.is_active = 1
      ORDER BY z.sort_order, m.sort_order, m.id`,
    [countryCode],
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    methodType: row.method_type,
    pricePence: Number(row.price_pence),
    freeOverPence:
      row.free_over_pence === null ? null : Number(row.free_over_pence),
    estimatedDaysMin:
      row.estimated_days_min === null
        ? null
        : Number(row.estimated_days_min),
    estimatedDaysMax:
      row.estimated_days_max === null
        ? null
        : Number(row.estimated_days_max),
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

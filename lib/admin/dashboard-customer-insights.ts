import { calendarDate, type DashboardRange } from "./dashboard-dates";
import { timingCutoff, timingPattern, timingWeekday } from "./dashboard-timing";

export type CustomerAreaKind = "cities" | "counties" | "postcodes";
export interface CustomerOrderCounts {
  customers: number;
  orders: number;
}
export interface CustomerAreaRow extends CustomerOrderCounts {
  label: string;
}
export interface CustomerAreaBreakdown {
  byCustomers: CustomerAreaRow[];
  byOrders: CustomerAreaRow[];
  missing: CustomerOrderCounts;
}
export interface CustomerInsightRow {
  buyer: string;
  hour: string;
  orders: number;
  country_code: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
}

const areaKinds: CustomerAreaKind[] = ["cities", "counties", "postcodes"];

function placeName(value: string | null): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}
function postcodeArea(value: string | null): string {
  const postcode = (value ?? "").replace(/\s/g, "").toUpperCase();
  return /^(?:[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}|GIR0AA)$/.test(postcode)
    ? (postcode.match(/^[A-Z]+/)?.[0] ?? "")
    : "";
}

export function customerInsights(range: DashboardRange, rows: readonly CustomerInsightRow[], now = new Date()) {
  type Bucket = { label: string; buyers: Set<string>; orders: number };
  const makeArea = () => ({ rows: new Map<string, Bucket>(), missing: { buyers: new Set<string>(), orders: 0 } });
  const areas = { cities: makeArea(), counties: makeArea(), postcodes: makeArea() };
  const timing = timingPattern(range, ["customers", "orders"], now);
  const timedBuyers = new Set<string>();
  const hourFormat = new Intl.DateTimeFormat("en-GB", { timeZone: timing.timeZone, hour: "2-digit", hourCycle: "h23" });
  const { today, currentHour } = timingCutoff(timing.timeZone, now);
  for (const row of rows) {
    const date = calendarDate(new Date(row.hour));
    if (date < range.start || date > range.end) continue;
    const orders = Number(row.orders);
    const hour = Number(hourFormat.format(new Date(row.hour)));
    if (date < today || (date === today && hour < currentHour)) {
      const cell = timing.cells[timingWeekday(date) * 24 + hour];
      cell.values.orders += orders;
      const buyerHour = `${row.buyer}:${row.hour}`;
      if (!timedBuyers.has(buyerHour)) {
        timedBuyers.add(buyerHour);
        cell.values.customers++;
      }
    }
    const country = placeName(row.country_code).toUpperCase();
    if (country && country !== "GB" && country !== "UK") continue;
    const labels = {
      cities: country ? placeName(row.city) : "",
      counties: country ? placeName(row.region) : "",
      postcodes: country ? postcodeArea(row.postal_code) : "",
    };
    for (const kind of areaKinds) {
      const label = labels[kind];
      if (!label) {
        areas[kind].missing.buyers.add(row.buyer);
        areas[kind].missing.orders += orders;
        continue;
      }
      const key = label.toLocaleLowerCase("en-GB");
      const bucket = areas[kind].rows.get(key) ?? { label, buyers: new Set<string>(), orders: 0 };
      bucket.buyers.add(row.buyer);
      bucket.orders += orders;
      areas[kind].rows.set(key, bucket);
    }
  }
  function breakdown(kind: CustomerAreaKind): CustomerAreaBreakdown {
    const rows = [...areas[kind].rows.values()].map(({ label, buyers, orders }) => ({ label, customers: buyers.size, orders }));
    return {
      byCustomers: [...rows].sort((a, b) => b.customers - a.customers || b.orders - a.orders || a.label.localeCompare(b.label, "en-GB")).slice(0, 10),
      byOrders: [...rows].sort((a, b) => b.orders - a.orders || b.customers - a.customers || a.label.localeCompare(b.label, "en-GB")).slice(0, 10),
      missing: { customers: areas[kind].missing.buyers.size, orders: areas[kind].missing.orders },
    };
  }
  return {
    areas: { cities: breakdown("cities"), counties: breakdown("counties"), postcodes: breakdown("postcodes") },
    timing,
  };
}

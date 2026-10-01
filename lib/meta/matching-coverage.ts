import { isIP } from "node:net";

export const metaMatchingFields = [
  { key: "em", label: "Email" }, { key: "ph", label: "Phone" },
  { key: "fn", label: "First name" }, { key: "ln", label: "Last name" },
  { key: "ct", label: "City" }, { key: "st", label: "Region" },
  { key: "zp", label: "Postcode" }, { key: "country", label: "Country" },
  { key: "external_id", label: "Visitor ID" }, { key: "client_ip_address", label: "IP address" },
  { key: "ipv6", label: "IPv6 address" }, { key: "client_user_agent", label: "User agent" },
  { key: "fbp", label: "Browser ID (_fbp)" }, { key: "fbc", label: "Ad click ID (_fbc)" },
] as const;
export type MetaMatchingKey = typeof metaMatchingFields[number]["key"];
export function metaMatchingCoverage(data: Record<string, string | string[]>): Record<MetaMatchingKey, boolean> {
  return Object.fromEntries(metaMatchingFields.map(({ key }) => [key,
    key === "ipv6" ? isIP(String(data.client_ip_address ?? "")) === 6 :
      Array.isArray(data[key]) ? data[key].some(value => Boolean(value)) : Boolean(data[key]),
  ])) as Record<MetaMatchingKey, boolean>;
}

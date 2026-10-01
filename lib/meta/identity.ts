import { createHash } from "node:crypto";
import { clientIpAddress } from "../http/client-ip";

export const hashMetaValue = (value: string) => createHash("sha256").update(value).digest("hex");
export function normalizeMetaPhone(phone: string): string | null {
  let value = phone.replace(/[^\d+]/g, "");
  if (value.startsWith("+")) value = value.slice(1);
  else if (value.startsWith("00")) value = value.slice(2);
  else if (value.startsWith("0")) value = `44${value.slice(1)}`; // N7 checkout currently serves GB only.
  if (/^440\d{10}$/.test(value)) value = `44${value.slice(3)}`;
  return /^[1-9]\d{7,14}$/.test(value) ? value : null;
}
export interface MetaCustomerProfile { fullName?: string; city?: string; region?: string; postalCode?: string; countryCode?: string }
export function metaExternalId(consent: string): string {
  return hashMetaValue(`n7:visitor:${consent}`);
}
const normalizeText = (value: string) => value.trim().toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}]/gu, "");
export function metaMatchData(email: string, phone: string, profile: MetaCustomerProfile = {}): Record<string, string[]> {
  const normalizedPhone = normalizeMetaPhone(phone);
  const data: Record<string, string[]> = {};
  if (email.trim()) data.em = [hashMetaValue(email.trim().toLowerCase())];
  if (normalizedPhone) data.ph = [hashMetaValue(normalizedPhone)];
  const names = profile.fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  const values = { fn: names[0] ?? "", ln: names.length > 1 ? names.slice(1).join(" ") : "", ct: profile.city ?? "", st: profile.region ?? "", zp: profile.postalCode ?? "" };
  for (const [key, value] of Object.entries(values)) {
    const normalized = normalizeText(value);
    if (normalized) data[key] = [hashMetaValue(normalized)];
  }
  const country = profile.countryCode?.trim().toLowerCase();
  if (country && /^[a-z]{2}$/.test(country)) data.country = [hashMetaValue(country)];
  return data;
}
export function readCookie(request: Request, name: string): string {
  const entry = request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(`${name}=`));
  return entry?.slice(name.length + 1) ?? "";
}
export function requestUserData(request: Request): Record<string, string> {
  const ip = clientIpAddress(request.headers);
  const ua = request.headers.get("user-agent")?.slice(0, 1000);
  const data: Record<string, string> = {};
  if (ip) data.client_ip_address = ip;
  if (ua) data.client_user_agent = ua;
  for (const key of ["fbp", "fbc"]) {
    const cookie = readCookie(request, `_${key}`);
    if (/^fb\.\d\.\d{13}\.[A-Za-z0-9_-]{1,500}$/.test(cookie)) data[key] = cookie;
  }
  return data;
}

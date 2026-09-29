import { createHash } from "node:crypto";
import { isIP } from "node:net";

export const hashMetaValue = (value: string) => createHash("sha256").update(value).digest("hex");
export function normalizeMetaPhone(phone: string): string | null {
  let value = phone.replace(/[^\d+]/g, "");
  if (value.startsWith("+")) value = value.slice(1);
  else if (value.startsWith("00")) value = value.slice(2);
  else if (value.startsWith("0")) value = `44${value.slice(1)}`; // N7 checkout currently serves GB only.
  if (/^440\d{10}$/.test(value)) value = `44${value.slice(3)}`;
  return /^[1-9]\d{7,14}$/.test(value) ? value : null;
}
export function metaMatchData(email: string, phone: string): Record<string, string[]> {
  const normalizedPhone = normalizeMetaPhone(phone);
  return { em: [hashMetaValue(email.trim().toLowerCase())], ...(normalizedPhone ? { ph: [hashMetaValue(normalizedPhone)] } : {}) };
}
export function readCookie(request: Request, name: string): string {
  const entry = request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(`${name}=`));
  return entry?.slice(name.length + 1) ?? "";
}
export function requestUserData(request: Request): Record<string, string> {
  const ip = (request.headers.get("x-forwarded-for")?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "").trim();
  const ua = request.headers.get("user-agent")?.slice(0, 1000);
  const data: Record<string, string> = {};
  if (isIP(ip)) data.client_ip_address = ip;
  if (ua) data.client_user_agent = ua;
  for (const key of ["fbp", "fbc"]) {
    const cookie = readCookie(request, `_${key}`);
    if (/^fb\.\d\.\d{13}\.[A-Za-z0-9_-]{1,500}$/.test(cookie)) data[key] = cookie;
  }
  return data;
}

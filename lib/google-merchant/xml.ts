import type { MerchantItem } from "./product";

export function xmlEscape(value: string | number): string {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function merchantFeedXml(items: readonly MerchantItem[], origin: string): string {
  const ids = new Set<string>();
  const tag = (name: string, value: string | number) => `<g:${name}>${xmlEscape(value)}</g:${name}>`;
  const entries = items.map(item => {
    if (ids.has(item.id)) throw new Error("Duplicate Google catalogue ID.");
    ids.add(item.id);
    return `<item>${Object.entries(item).flatMap(([name, value]) =>
      (Array.isArray(value) ? value : [value]).map(value => tag(name, value)),
    ).join("")}</item>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>N7 Cosmetics products</title><link>${xmlEscape(origin)}</link><description>N7 Cosmetics product catalogue</description>${entries.join("\n")}</channel></rss>`;
}

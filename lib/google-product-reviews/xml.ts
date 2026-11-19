import { xmlEscape } from "../google-merchant/xml";

export interface ProductReviewFeedItem {
  id: string; reviewer: string; timestamp: string; title?: string; content: string; rating: number;
  verifiedPurchase: boolean; incentivized?: boolean;
  product: { name: string; url: string; skus: string[]; gtin?: string; mpn?: string; brand?: string };
}

export function validReviewXmlText(value: string): boolean {
  return Array.from(value).every(character => {
    const code = character.codePointAt(0) ?? 0;
    return code === 9 || code === 10 || code === 13 || (code >= 0x20 && code <= 0xd7ff)
      || (code >= 0xe000 && code <= 0xfffd) || (code >= 0x10000 && code <= 0x10ffff);
  });
}

export function productReviewFeedXml(items: readonly ProductReviewFeedItem[]): string {
  const seen = new Set<string>();
  const tag = (name: string, value: string | number | boolean) => `<${name}>${xmlEscape(String(value))}</${name}>`;
  const reviews = items.map(item => {
    if (seen.has(item.id)) throw new Error("Duplicate review ID");
    seen.add(item.id);
    if (!item.id || !item.content.trim() || !Number.isInteger(item.rating) || item.rating < 1 || item.rating > 5
      || !Number.isFinite(Date.parse(item.timestamp))) throw new Error("Invalid review fields");
    const values = [item.id, item.reviewer, item.title ?? "", item.content, item.product.name, item.product.url,
      ...item.product.skus, item.product.gtin ?? "", item.product.mpn ?? "", item.product.brand ?? ""];
    if (!values.every(validReviewXmlText)) throw new Error("Review contains unsupported XML characters");
    const identifiers = [
      item.product.gtin ? `<gtins>${tag("gtin", item.product.gtin)}</gtins>` : "",
      item.product.mpn && item.product.brand ? `<mpns>${tag("mpn", item.product.mpn)}</mpns>` : "",
      item.product.skus.length ? `<skus>${[...new Set(item.product.skus)].map(sku => tag("sku", sku)).join("")}</skus>` : "",
      item.product.brand ? `<brands>${tag("brand", item.product.brand)}</brands>` : "",
    ].join("");
    const author = item.reviewer.trim() ? tag("name", item.reviewer) : '<name is_anonymous="true">Anonymous</name>';
    return `<review>${tag("review_id", item.id)}<reviewer>${author}</reviewer>${tag("review_timestamp", item.timestamp)}${item.title?.trim() ? tag("title", item.title) : ""}${tag("content", item.content)}<review_url type="group">${xmlEscape(`${item.product.url}#reviews`)}</review_url><ratings><overall min="1" max="5">${item.rating}</overall></ratings><products><product>${identifiers ? `<product_ids>${identifiers}</product_ids>` : ""}${tag("product_name", item.product.name)}${tag("product_url", item.product.url)}</product></products>${tag("is_verified_purchase", item.verifiedPurchase)}${item.incentivized === undefined ? "" : tag("is_incentivized_review", item.incentivized)}</review>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="https://www.google.com/shopping/reviews/schema/product/2.4/product_reviews.xsd"><version>2.4</version><publisher><name>N7 Cosmetics</name></publisher>${reviews.length ? `<reviews>${reviews.join("\n")}</reviews>` : ""}</feed>`;
}

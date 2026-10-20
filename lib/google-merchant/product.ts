import type { CatalogExportProduct } from "../commerce/catalog-export";
import { defaultMetadataForProduct, merchantMetadataSchema, merchantMpn, validMpn, type MerchantMetadata } from "./metadata";

export function merchantText(value: string): string {
  const plain = value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]*>/g, " ")
    .replace(/&(?:nbsp|#160);/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/&#(x[\da-f]+|\d+);/gi, (original, number: string) => {
      const code = number[0].toLowerCase() === "x" ? parseInt(number.slice(1), 16) : Number(number);
      return Number.isSafeInteger(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : original;
    });
  return Array.from(plain).filter(character => {
    const code = character.codePointAt(0) ?? 0;
    return code === 9 || code === 10 || code === 13 || (code >= 0x20 && code <= 0xd7ff) || (code >= 0xe000 && code <= 0xfffd) || code >= 0x10000;
  }).join("").replace(/\s+/g, " ").trim();
}

function truncate(value: string, maximum: number): string { return Array.from(value).slice(0, maximum).join(""); }

export function merchantDescription(product: Pick<CatalogExportProduct, "shortDescription" | "description">): string {
  return merchantText(product.shortDescription ?? "") || merchantText(product.description ?? "");
}

export function merchantPublicUrl(value: string, origin: string): string | null {
  try {
    const url = new URL(value, origin);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.username || url.password || url.href.length > 2000 || !hostname.includes(".") ||
      /^[\d.]+$/.test(hostname) || hostname.includes(":") || /(?:^|\.)(?:localhost|local|internal|invalid|test)$/.test(hostname)) return null;
    return url.href;
  } catch { return null; }
}

export function merchantSiteOrigin(value: string): string {
  const valid = merchantPublicUrl(value, value);
  if (!valid) throw new Error("Set APP_URL to the public HTTPS website origin before connecting Google Merchant Center.");
  const url = new URL(valid);
  if (url.pathname !== "/" || url.search || url.hash) throw new Error("APP_URL must contain only the public HTTPS website origin.");
  return url.origin;
}

export interface MerchantItem {
  id: string; title: string; description: string; link: string; image_link: string;
  additional_image_link: string[]; price: string; availability: "in_stock" | "out_of_stock";
  condition: "new"; brand: string; identifier_exists: "yes" | "no";
  gtin?: string; mpn?: string; google_product_category?: string;
  is_bundle?: "yes"; multipack?: number; unit_pricing_measure?: string; unit_pricing_base_measure?: string;
}
export interface MerchantEntry {
  product: CatalogExportProduct;
  item?: MerchantItem;
  issues: string[];
  warnings: string[];
  excluded: boolean;
}
export type MerchantIdentityProduct = Pick<CatalogExportProduct, "variantId" | "productType" | "brand" | "productCode" | "isRecreation">;

export function buildMerchantEntry(product: CatalogExportProduct, origin: string, metadata: ReadonlyMap<string, MerchantMetadata>, products: ReadonlyMap<string, MerchantIdentityProduct>): MerchantEntry {
  const result: MerchantEntry = { product, issues: [], warnings: [], excluded: false };
  const saved = metadata.get(product.variantId) ?? defaultMetadataForProduct(product.isRecreation);
  const parsed = merchantMetadataSchema.safeParse(saved);
  if (!parsed.success) { result.issues.push("Correct the Google product identifiers and settings."); return result; }
  const settings = parsed.data;
  if (!settings.included) { result.excluded = true; return result; }

  let identityProduct: MerchantIdentityProduct = product;
  let identity = settings;
  let bundle: "yes" | undefined;
  let multipack: number | undefined;
  if (product.productType === "BUNDLE") {
    if (settings.bundleKind === "UNREVIEWED") result.issues.push("Review whether this is a gift set, main-product bundle, manufacturer pack or multipack.");
    if (settings.bundleKind === "MAIN_PRODUCT" || settings.bundleKind === "MULTIPACK") {
      const component = settings.bundleKind === "MULTIPACK" ? product.components[0] : product.components.find(component => component.variantId === settings.mainVariantId);
      if (settings.bundleKind === "MULTIPACK" && (product.components.length !== 1 || !component || component.quantity < 2)) {
        result.issues.push("A multipack must contain at least two units of one identical product.");
      }
      const main = component ? products.get(component.variantId) : undefined;
      const mainSettings = main ? merchantMetadataSchema.safeParse(metadata.get(main.variantId) ?? defaultMetadataForProduct(main.isRecreation)) : null;
      if (!main || main.productType !== "STANDARD" || !mainSettings?.success) result.issues.push("Choose an included component with valid manufacturer identifiers as the main product.");
      else { identityProduct = main; identity = mainSettings.data; }
      if (settings.bundleKind === "MAIN_PRODUCT") bundle = "yes";
      else multipack = component?.quantity;
    }
    if (!product.componentsVisible) result.issues.push("A bundle component is missing the product image required by its storefront page.");
  }

  const brand = merchantText(identityProduct.brand ?? "");
  const mpn = merchantMpn(identity, identityProduct.productCode, identityProduct.isRecreation);
  const title = merchantText(`${product.productCode?.trim() ? `${product.productCode.trim()} — ` : ""}${product.name}`);
  const description = merchantDescription(product);
  const productPath = `/${product.productType === "BUNDLE" ? "bundles" : "products"}/${encodeURIComponent(product.slug)}`;
  const link = merchantPublicUrl(productPath, origin);
  const image = product.imageUrl ? merchantPublicUrl(product.imageUrl, origin) : null;
  if (!/^[1-9]\d*$/.test(product.variantId)) result.issues.push("The product has an invalid variant ID.");
  if (!title) result.issues.push("Add a product name.");
  if (!description) result.issues.push("Add a product description.");
  if (!brand || Array.from(brand).length > 70) result.issues.push("Set the actual product brand (up to 70 characters).");
  if (!link || !product.slug || new URL(link).origin !== origin || new URL(link).pathname !== productPath) result.issues.push("The product needs a valid storefront URL on the website domain.");
  if (!image) result.issues.push("Add a primary image with a public HTTPS URL.");
  if (!Number.isSafeInteger(product.pricePence) || product.pricePence <= 0) result.issues.push("Set a selling price above £0.");
  if (identity.mpnSource === "PRODUCT_CODE" && (!identityProduct.isRecreation || !validMpn(mpn))) result.issues.push("Set a valid official N7 recreation product code (up to 70 characters), or enter the manufacturer's MPN manually.");
  if (identityProduct.isRecreation && identityProduct.productCode?.trim() && identity.identifierPolicy === "NONE") result.issues.push("This recreation has an official N7 part number and cannot be marked as having no assigned identifiers.");
  if (identity.identifierPolicy === "AUTO" && !identity.gtin && !mpn) result.issues.push("Add the manufacturer's GTIN or MPN, or confirm that neither was assigned.");
  if (!identity.gtin && mpn) result.warnings.push("Supply the manufacturer GTIN too if one exists; an MPN does not replace an assigned GTIN.");
  if (Array.from(title).length > 150) result.warnings.push("Google's title is shortened to 150 characters.");

  const additional = [...new Set(product.images.slice(1).map(url => merchantPublicUrl(url, origin)).filter((url): url is string => Boolean(url) && url !== image))].slice(0, 10);
  if (product.images.slice(1).some(url => !merchantPublicUrl(url, origin))) result.warnings.push("An invalid gallery image URL is omitted.");
  if (result.issues.length || !link || !image) return result;
  result.item = {
    id: `n7_variant_${product.variantId}`, title: truncate(title, 150), description: truncate(description, 5000),
    link, image_link: image, additional_image_link: additional,
    price: `${(product.pricePence / 100).toFixed(2)} GBP`, availability: product.soldOut ? "out_of_stock" : "in_stock",
    condition: "new", brand, identifier_exists: identity.identifierPolicy === "NONE" ? "no" : "yes",
    ...(identity.gtin ? { gtin: identity.gtin } : {}), ...(mpn ? { mpn } : {}),
    ...(settings.googleCategoryId ? { google_product_category: settings.googleCategoryId } : {}),
    ...(bundle ? { is_bundle: bundle } : {}), ...(multipack ? { multipack } : {}),
  };
  // Only unambiguous bottle volumes already displayed on the product page.
  // Gift sets are not assigned an invented combined volume or apparel size.
  const volume = product.productType === "STANDARD" ? product.size?.trim().match(/^(\d+(?:\.\d+)?)\s*(ml|l)$/i) : null;
  if (volume && Number(volume[1]) > 0) {
    const millilitres = Number(volume[1]) * (volume[2].toLowerCase() === "l" ? 1000 : 1);
    const normalized = Number(millilitres.toFixed(6));
    if (Number.isFinite(normalized) && normalized > 0 && /^\d+(?:\.\d+)?$/.test(String(normalized))) {
      result.item.unit_pricing_measure = `${normalized} ml`;
      result.item.unit_pricing_base_measure = "100 ml";
    }
  }
  return result;
}

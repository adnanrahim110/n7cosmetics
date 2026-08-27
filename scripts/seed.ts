import "./load-env";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { collectionPages } from "../content/collections";
import { automatedProductSku } from "../lib/admin/product-identifiers";
import { getPool } from "../lib/db/pool";
import { executeMutation, selectOne, selectRows } from "../lib/db/query";
import { withTransaction } from "../lib/db/transaction";

const STORE_API = "https://n7cosmetics.co.uk/wp-json/wc/store/v1";
const SOURCE_SITE = "https://n7cosmetics.co.uk";
const REQUEST_HEADERS = { "User-Agent": "N7-Catalog-Importer/1.0" };
const RECREATION_IMAGE = path.resolve(process.cwd(), "public", "imgs", "products", "5.png");
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

interface StoreCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
}

interface StoreTaxonomyTerm {
  id: number;
  name: string;
  slug: string;
}

interface StoreImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

interface StoreAttribute {
  name: string;
  terms: Array<{ name: string; slug: string }>;
}

interface StoreProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  permalink: string;
  short_description: string;
  description: string;
  on_sale: boolean;
  prices: {
    price: string;
    regular_price: string;
    sale_price: string;
  };
  images: StoreImage[];
  categories: StoreTaxonomyTerm[];
  tags: StoreTaxonomyTerm[];
  attributes: StoreAttribute[];
  is_in_stock: boolean;
  weight: string;
}

interface ProductPageDetails {
  notes: { top: string[]; heart: string[]; base: string[] };
  sizeLabel: string | null;
}

interface PreparedProduct extends StoreProduct {
  cleanName: string;
  cleanShortDescription: string;
  cleanDescription: string;
  collectionSlugs: string[];
  details: ProductPageDetails;
  audience: "MEN" | "WOMEN" | "UNISEX" | "UNSPECIFIED";
  inspiredBy: string | null;
  isRecreation: boolean;
}

interface PreparedMedia {
  source: string;
  storageKey: string;
  publicUrl: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  altText: string;
  absolutePath: string;
}

interface ExistingMediaRow extends RowDataPacket {
  public_url: string;
  storage_key: string;
}

interface SettingRow extends RowDataPacket {
  value_json: unknown;
}

interface ReferenceCountRow extends RowDataPacket {
  reference_count: number | string;
}

const collectionDefinitions = [
  { slug: "n7", name: "N7 Collection", content: collectionPages.n7 },
  { slug: "yusuf-bhai-originals", name: "Yusuf Bhai Originals", content: collectionPages.originals },
  { slug: "premium-collection", name: "Premium Collection", content: collectionPages.premium },
  { slug: "recreations", name: "Recreations", content: collectionPages.recreations },
  { slug: "sale", name: "Sale", content: collectionPages.sale },
] as const;

const namedEntities: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  hellip: "…",
  laquo: "«",
  ldquo: "“",
  lsquo: "‘",
  lt: "<",
  mdash: "—",
  nbsp: " ",
  ndash: "–",
  pound: "£",
  quot: '"',
  raquo: "»",
  rdquo: "”",
  rsquo: "’",
};

function decodeHtml(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith("#x")) return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    if (code.startsWith("#")) return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    return namedEntities[code.toLowerCase()] ?? entity;
  });
}

function normalizeText(value: string): string {
  return decodeHtml(value)
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function stripHtml(value: string): string {
  return normalizeText(
    value
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
      .replace(/<li[^>]*>/gi, "- ")
      .replace(/<[^>]+>/g, " "),
  );
}

function truncate(value: string, maximum: number): string {
  if (value.length <= maximum) return value;
  const shortened = value.slice(0, maximum - 1);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > maximum * 0.7 ? lastSpace : shortened.length).trim()}…`;
}

async function fetchWithRetry(url: string, attempt = 1): Promise<Response> {
  try {
    const response = await fetch(url, { headers: REQUEST_HEADERS, signal: AbortSignal.timeout(45_000) });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response;
  } catch (error) {
    if (attempt >= 3) throw new Error(`Unable to fetch ${url}: ${error instanceof Error ? error.message : error}`);
    return fetchWithRetry(url, attempt + 1);
  }
}

async function fetchAllPages<T>(endpoint: string): Promise<T[]> {
  const records: T[] = [];
  for (let page = 1; ; page += 1) {
    const response = await fetchWithRetry(`${STORE_API}/${endpoint}?per_page=100&page=${page}`);
    const batch = await response.json() as T[];
    records.push(...batch);
    if (batch.length < 100) return records;
  }
}

async function mapConcurrent<T, R>(items: readonly T[], concurrency: number, worker: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  async function run(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }
  const outcomes = await Promise.allSettled(Array.from({ length: Math.min(concurrency, items.length) }, () => run()));
  const failure = outcomes.find((outcome): outcome is PromiseRejectedResult => outcome.status === "rejected");
  if (failure) throw failure.reason;
  return results;
}

function noteList(value: string): string[] {
  return value
    .replace(/^[-–—\s]+/, "")
    .split(/,|\n/)
    .map((note) => note.replace(/^[-–—\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 20);
}

function extractNotes(html: string): ProductPageDetails["notes"] {
  const marker = html.search(/FRAGRANCE\s+NOTES/i);
  if (marker < 0) return { top: [], heart: [], base: [] };
  const nearby = html.slice(marker, marker + 15_000);
  const content = nearby.match(/<div[^>]*class=["'][^"']*accordion-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1];
  if (!content) return { top: [], heart: [], base: [] };
  const text = stripHtml(content);
  const top = text.match(/Top\s+Notes?\s*:?\s*([\s\S]*?)(?=(?:Middle|Heart|Base)\s+Notes?\s*:|$)/i)?.[1] ?? "";
  const heart = text.match(/(?:Middle|Heart)\s+Notes?\s*:?\s*([\s\S]*?)(?=Base\s+Notes?\s*:|$)/i)?.[1] ?? "";
  const base = text.match(/Base\s+Notes?\s*:?\s*([\s\S]*?)$/i)?.[1] ?? "";
  return { top: noteList(top), heart: noteList(heart), base: noteList(base) };
}

function extractSizeLabel(product: StoreProduct, html: string): string | null {
  const volume = product.attributes.find((attribute) => /volume|size/i.test(attribute.name))?.terms[0]?.name;
  if (volume) return normalizeText(volume);
  const titleIndex = html.search(/class=["'][^"']*product_title[^"']*["']/i);
  if (titleIndex >= 0) {
    const nearby = html.slice(titleIndex, titleIndex + 5_000);
    const headings = [...nearby.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((match) => stripHtml(match[1]));
    const size = headings.find((heading) => /\b\d+(?:\.\d+)?\s*(?:ml|cl|l|oz)\b/i.test(heading));
    if (size) return truncate(size, 150);
  }
  return null;
}

function categoryAncestors(categoryId: number, byId: ReadonlyMap<number, StoreCategory>): StoreCategory[] {
  const ancestors: StoreCategory[] = [];
  const visited = new Set<number>();
  let current = byId.get(categoryId);
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    ancestors.unshift(current);
    current = current.parent ? byId.get(current.parent) : undefined;
  }
  return ancestors;
}

function belongsToCategory(product: StoreProduct, categorySlug: string, byId: ReadonlyMap<number, StoreCategory>): boolean {
  return product.categories.some((term) => categoryAncestors(term.id, byId).some((category) => category.slug === categorySlug));
}

function productCollectionSlugs(product: StoreProduct, byId: ReadonlyMap<number, StoreCategory>): string[] {
  const tags = new Set(product.tags.map((tag) => tag.slug));
  const slugs: string[] = [];
  if (belongsToCategory(product, "n7", byId) || tags.has("n7")) slugs.push("n7");
  if (product.type === "yith_bundle" || belongsToCategory(product, "bundles", byId)) slugs.push("bundles");
  if (belongsToCategory(product, "premium-collection", byId)) slugs.push("premium-collection");
  if (belongsToCategory(product, "recreations", byId) || tags.has("recreations")) slugs.push("recreations");
  if (belongsToCategory(product, "yusuf-bhai-originals", byId)) slugs.push("yusuf-bhai-originals");
  if (product.on_sale && Number(product.prices.regular_price) > Number(product.prices.price)) slugs.push("sale");
  return [...new Set(slugs)];
}

function productAudience(product: StoreProduct): PreparedProduct["audience"] {
  const slugs = new Set([...product.categories, ...product.tags].map((term) => term.slug));
  const hasMale = slugs.has("male") || slugs.has("men");
  const hasFemale = slugs.has("female") || slugs.has("women");
  if (slugs.has("unisex") || (hasMale && hasFemale)) return "UNISEX";
  if (hasFemale) return "WOMEN";
  if (hasMale) return "MEN";
  return "UNSPECIFIED";
}

function productInspiredBy(product: StoreProduct, byId: ReadonlyMap<number, StoreCategory>, isRecreation: boolean): string | null {
  if (!isRecreation) return null;
  const structural = new Set(["recreations", "yusuf-bhai-inspired-by", "male", "female", "unisex", "bundles", "premium-collection"]);
  const assignedIds = new Set(product.categories.map((category) => category.id));
  const leaves = product.categories.filter((term) => {
    if (structural.has(term.slug)) return false;
    return !product.categories.some((candidate) => candidate.id !== term.id && categoryAncestors(candidate.id, byId).some((ancestor) => ancestor.id === term.id));
  });
  const selected = leaves.sort((left, right) => categoryAncestors(right.id, byId).length - categoryAncestors(left.id, byId).length)[0];
  if (!selected) return null;
  const names = categoryAncestors(selected.id, byId)
    .filter((category) => !structural.has(category.slug) && (assignedIds.has(category.id) || category.id === selected.id))
    .map((category) => decodeHtml(category.name));
  return truncate(names.join(" / ") || decodeHtml(selected.name), 190);
}

function defaultDescription(product: StoreProduct, collections: readonly string[], inspiredBy: string | null): string {
  const name = decodeHtml(product.name);
  if (collections.includes("bundles")) return `A curated N7 Cosmetics fragrance bundle featuring ${name}.`;
  if (collections.includes("recreations")) return inspiredBy
    ? `${name} is a Yusuf Bhai fragrance recreation inspired by ${inspiredBy}.`
    : `${name} is part of the Yusuf Bhai fragrance recreation collection.`;
  if (collections.includes("premium-collection")) return `${name} is part of the premium Yusuf Bhai fragrance collection.`;
  return `${name} is an original Yusuf Bhai fragrance available from N7 Cosmetics.`;
}

async function prepareProducts(products: StoreProduct[], categories: StoreCategory[]): Promise<PreparedProduct[]> {
  const byId = new Map(categories.map((category) => [category.id, category]));
  let completed = 0;
  return mapConcurrent(products, 6, async (product) => {
    const html = await (await fetchWithRetry(product.permalink || `${SOURCE_SITE}/product/${product.slug}/`)).text();
    completed += 1;
    if (completed % 10 === 0 || completed === products.length) process.stdout.write(`Read ${completed}/${products.length} product detail pages.\n`);
    const collectionSlugs = productCollectionSlugs(product, byId);
    const isRecreation = collectionSlugs.includes("recreations");
    const inspiredBy = productInspiredBy(product, byId, isRecreation);
    const websiteShort = stripHtml(product.short_description);
    const websiteDescription = stripHtml(product.description);
    const fallback = defaultDescription(product, collectionSlugs, inspiredBy);
    return {
      ...product,
      cleanName: truncate(decodeHtml(product.name), 190),
      cleanShortDescription: truncate(websiteShort || websiteDescription || fallback, 500),
      cleanDescription: truncate(websiteDescription || websiteShort || fallback, 30_000),
      collectionSlugs,
      details: { notes: extractNotes(html), sizeLabel: extractSizeLabel(product, html) },
      audience: productAudience(product),
      inspiredBy,
      isRecreation,
    };
  });
}

function getMediaRoot(): string {
  const configured = process.env.MEDIA_STORAGE_DIR?.trim();
  if (!configured || configured.includes("\0")) throw new Error("MEDIA_STORAGE_DIR is missing or invalid.");
  return path.isAbsolute(configured) ? path.resolve(configured) : path.resolve(process.cwd(), configured);
}

function safeMediaPath(storageKey: string): string {
  const root = getMediaRoot();
  const resolved = path.resolve(root, ...storageKey.split("/"));
  const relative = path.relative(root, resolved);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Invalid media storage key.");
  return resolved;
}

function detectImage(buffer: Buffer): { extension: string; mimeType: string } {
  if (buffer.length > MAX_IMAGE_BYTES) throw new Error("A catalog image exceeds the 10 MB limit.");
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { extension: "jpg", mimeType: "image/jpeg" };
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { extension: "png", mimeType: "image/png" };
  if (["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"))) return { extension: "gif", mimeType: "image/gif" };
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return { extension: "webp", mimeType: "image/webp" };
  if (buffer.subarray(4, 8).toString("ascii") === "ftyp" && ["avif", "avis"].includes(buffer.subarray(8, 12).toString("ascii"))) return { extension: "avif", mimeType: "image/avif" };
  throw new Error("A catalog image has an unsupported or invalid format.");
}

function imageSources(products: PreparedProduct[]): Array<{ source: string; altText: string }> {
  const sources = new Map<string, string>();
  for (const product of products) {
    if (product.isRecreation) {
      sources.set("local:recreation-product-5", `${product.cleanName} product image`);
      continue;
    }
    if (!product.images.length) throw new Error(`${product.cleanName} has no source image.`);
    for (const image of product.images.slice(0, 13)) {
      sources.set(image.src, decodeHtml(image.alt || image.name || `${product.cleanName} product image`));
    }
  }
  return [...sources].map(([source, altText]) => ({ source, altText }));
}

async function prepareMedia(products: PreparedProduct[]): Promise<Map<string, PreparedMedia>> {
  const sources = imageSources(products);
  const now = new Date();
  const segment = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  await mkdir(path.resolve(getMediaRoot(), "products", "images", segment), { recursive: true });
  let completed = 0;
  const writtenPaths: string[] = [];
  try {
    const media = await mapConcurrent(sources, 5, async ({ source, altText }) => {
      const isLocal = source.startsWith("local:");
      const buffer = isLocal ? await readFile(RECREATION_IMAGE) : Buffer.from(await (await fetchWithRetry(source)).arrayBuffer());
      const format = detectImage(buffer);
      const filename = `${randomUUID()}.${format.extension}`;
      const storageKey = `products/images/${segment}/${filename}`;
      const absolutePath = safeMediaPath(storageKey);
      await writeFile(absolutePath, buffer, { flag: "wx" });
      writtenPaths.push(absolutePath);
      completed += 1;
      if (completed % 10 === 0 || completed === sources.length) process.stdout.write(`Stored ${completed}/${sources.length} private catalog images.\n`);
      let originalName = "5.png";
      if (!isLocal) {
        try { originalName = decodeURIComponent(new URL(source).pathname.split("/").pop() || filename); } catch { originalName = filename; }
      }
      return {
        source,
        storageKey,
        publicUrl: `/media/${randomUUID()}`,
        originalName: truncate(originalName, 255),
        mimeType: format.mimeType,
        sizeBytes: buffer.length,
        altText: truncate(altText, 255),
        absolutePath,
      };
    });
    return new Map(media.map((asset) => [asset.source, asset]));
  } catch (error) {
    await Promise.all(writtenPaths.map((absolutePath) => unlink(absolutePath).catch(() => undefined)));
    throw error;
  }
}

function categoryDepth(category: StoreCategory, byId: ReadonlyMap<number, StoreCategory>): number {
  return categoryAncestors(category.id, byId).length;
}

function categoryDescription(category: StoreCategory, byId: ReadonlyMap<number, StoreCategory>): string {
  const ancestors = categoryAncestors(category.id, byId).map((item) => item.slug);
  if (category.slug === "n7") return collectionPages.n7.intro;
  if (category.slug === "recreations") return collectionPages.recreations.intro;
  if (category.slug === "yusuf-bhai-originals") return collectionPages.originals.intro;
  if (category.slug === "premium-collection") return collectionPages.premium.intro;
  if (category.slug === "bundles") return collectionPages.bundles.intro;
  if (ancestors.includes("recreations")) return `${decodeHtml(category.name)} fragrances in the Yusuf Bhai recreation collection.`;
  if (ancestors.includes("yusuf-bhai-originals")) return `${decodeHtml(category.name)} fragrances from the Yusuf Bhai Originals collection.`;
  return `${decodeHtml(category.name)} fragrances available from N7 Cosmetics.`;
}

function globalLowStockThreshold(value: unknown): number {
  const parsed = typeof value === "string" ? Number(value) : Number(value ?? Number.NaN);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 1_000_000 ? parsed : DEFAULT_LOW_STOCK_THRESHOLD;
}

async function oldCatalogMedia(): Promise<ExistingMediaRow[]> {
  return selectRows<ExistingMediaRow>(
    `SELECT DISTINCT ma.public_url, ma.storage_key
     FROM media_assets ma
     WHERE ma.public_url IN (
       SELECT url FROM product_images
       UNION SELECT url FROM product_videos
       UNION SELECT image_url FROM categories WHERE image_url IS NOT NULL
       UNION SELECT image_url FROM collections WHERE image_url IS NOT NULL
     )`,
  );
}

async function insertCatalog(
  connection: PoolConnection,
  categories: StoreCategory[],
  products: PreparedProduct[],
  media: ReadonlyMap<string, PreparedMedia>,
  lowStockThreshold: number,
): Promise<void> {
  await executeMutation("DELETE FROM bundle_items", [], connection);
  await executeMutation("DELETE FROM product_videos", [], connection);
  await executeMutation("DELETE FROM product_images", [], connection);
  await executeMutation("DELETE FROM product_collections", [], connection);
  await executeMutation("DELETE FROM product_categories", [], connection);
  await executeMutation("DELETE FROM product_variants", [], connection);
  await executeMutation("DELETE FROM products", [], connection);
  await executeMutation("DELETE FROM collections", [], connection);
  await executeMutation("DELETE FROM categories", [], connection);

  for (const asset of media.values()) {
    await executeMutation(
      `INSERT INTO media_assets (storage_key, public_url, original_name, mime_type, size_bytes, alt_text, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, NULL)`,
      [asset.storageKey, asset.publicUrl, asset.originalName, asset.mimeType, asset.sizeBytes, asset.altText],
      connection,
    );
  }

  const categoryByExternalId = new Map(categories.map((category) => [category.id, category]));
  const localCategoryIds = new Map<number, string>();
  const orderedCategories = categories.filter((category) => category.slug !== "bundles").sort((left, right) => categoryDepth(left, categoryByExternalId) - categoryDepth(right, categoryByExternalId) || left.name.localeCompare(right.name));
  for (const [index, category] of orderedCategories.entries()) {
    const parentId = category.parent ? localCategoryIds.get(category.parent) : null;
    if (category.parent && !parentId) throw new Error(`Missing parent category for ${category.name}.`);
    const inserted = await executeMutation(
      `INSERT INTO categories (parent_id, name, slug, description, status, sort_order)
       VALUES (?, ?, ?, ?, 'ACTIVE', ?)`,
      [parentId ?? null, truncate(decodeHtml(category.name), 150), category.slug, categoryDescription(category, categoryByExternalId), index],
      connection,
    );
    localCategoryIds.set(category.id, String(inserted.insertId));
  }

  const localCollectionIds = new Map<string, string>();
  for (const [index, collection] of collectionDefinitions.entries()) {
    const inserted = await executeMutation(
      `INSERT INTO collections (name, slug, description, status, sort_order, seo_title, seo_description)
       VALUES (?, ?, ?, 'ACTIVE', ?, ?, ?)`,
      [collection.name, collection.slug, collection.content.intro, index, `${collection.name} | N7 Cosmetics`, truncate(collection.content.intro, 160)],
      connection,
    );
    localCollectionIds.set(collection.slug, String(inserted.insertId));
  }

  const collectionSortOrders = new Map<string, number>(collectionDefinitions.map((collection) => [collection.slug, 0]));
  for (const product of products) {
    const pricePence = Number(product.prices.price);
    const regularPricePence = Number(product.prices.regular_price);
    if (!Number.isInteger(pricePence) || pricePence <= 0) throw new Error(`${product.cleanName} has an invalid price.`);
    const compareAtPricePence = regularPricePence > pricePence ? regularPricePence : null;
    const productType = product.type === "yith_bundle" ? "BUNDLE" : "STANDARD";
    const brand = productType === "BUNDLE" ? "N7 Cosmetics" : "Yusuf Bhai";
    const inserted = await executeMutation(
      `INSERT INTO products
         (name, slug, product_type, status, short_description, description, brand, inspired_by, audience,
          fragrance_notes_json, featured, track_inventory, seo_title, seo_description, published_at)
       VALUES (?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?, ?, 0, 1, ?, ?, CURRENT_TIMESTAMP(3))`,
      [product.cleanName, product.slug, productType, product.cleanShortDescription, product.cleanDescription, brand,
       product.inspiredBy, product.audience, JSON.stringify(product.details.notes), truncate(`${product.cleanName} | N7 Cosmetics`, 70),
       truncate(product.cleanShortDescription, 160)],
      connection,
    );
    const productId = String(inserted.insertId);
    const sizeLabel = productType === "BUNDLE" ? "3 × 100 ml" : product.details.sizeLabel ?? "100 ml";
    const weight = /^\d+(?:\.\d+)?$/.test(product.weight) ? Math.max(1, Math.round(Number(product.weight) * 1000)) : null;
    await executeMutation(
      `INSERT INTO product_variants
         (product_id, title, sku, price_pence, compare_at_price_pence, stock_on_hand, low_stock_threshold,
          weight_grams, option_values_json, is_default, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'ACTIVE')`,
      [productId, sizeLabel, automatedProductSku(productId), pricePence, compareAtPricePence,
       product.is_in_stock ? 20 : 0, lowStockThreshold, weight, JSON.stringify({ size: sizeLabel })],
      connection,
    );

    const productImages = product.isRecreation
      ? [{ source: "local:recreation-product-5", alt: `${product.cleanName} product image` }]
      : product.images.slice(0, 13).map((image, imageIndex) => ({ source: image.src, alt: decodeHtml(image.alt || `${product.cleanName} product image ${imageIndex + 1}`) }));
    for (const [imageIndex, image] of productImages.entries()) {
      const asset = media.get(image.source);
      if (!asset) throw new Error(`Missing prepared media for ${product.cleanName}.`);
      await executeMutation(
        "INSERT INTO product_images (product_id, url, alt_text, sort_order) VALUES (?, ?, ?, ?)",
        [productId, asset.publicUrl, truncate(image.alt, 255), imageIndex],
        connection,
      );
    }

    for (const category of product.categories) {
      if (category.slug === "bundles") continue;
      const categoryId = localCategoryIds.get(category.id);
      if (!categoryId) throw new Error(`Missing category ${category.name} for ${product.cleanName}.`);
      await executeMutation("INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)", [productId, categoryId], connection);
    }
    for (const collectionSlug of product.collectionSlugs) {
      if (collectionSlug === "bundles") continue;
      const collectionId = localCollectionIds.get(collectionSlug);
      if (!collectionId) throw new Error(`Missing collection ${collectionSlug}.`);
      const sortOrder = collectionSortOrders.get(collectionSlug) ?? 0;
      await executeMutation(
        "INSERT INTO product_collections (product_id, collection_id, sort_order) VALUES (?, ?, ?)",
        [productId, collectionId, sortOrder],
        connection,
      );
      collectionSortOrders.set(collectionSlug, sortOrder + 1);
    }
  }

  await executeMutation(
    `UPDATE categories c SET c.image_url = (
       SELECT pi.url FROM product_categories pc
       INNER JOIN product_images pi ON pi.product_id = pc.product_id
       WHERE pc.category_id = c.id ORDER BY pi.sort_order, pi.id LIMIT 1
     )`,
    [], connection,
  );
  await executeMutation(
    `UPDATE collections c SET c.image_url = (
       SELECT pi.url FROM product_collections pc
       INNER JOIN product_images pi ON pi.product_id = pc.product_id
       WHERE pc.collection_id = c.id ORDER BY pc.sort_order, pi.sort_order, pi.id LIMIT 1
     )`,
    [], connection,
  );
}

async function cleanupOldMedia(rows: ExistingMediaRow[]): Promise<void> {
  for (const row of rows) {
    const references = await selectOne<ReferenceCountRow>(
      `SELECT
         (SELECT COUNT(*) FROM product_images WHERE url = ?) +
         (SELECT COUNT(*) FROM product_videos WHERE url = ?) +
         (SELECT COUNT(*) FROM categories WHERE image_url = ?) +
         (SELECT COUNT(*) FROM collections WHERE image_url = ?) +
         (SELECT COUNT(*) FROM page_sections WHERE JSON_SEARCH(content_json, 'one', ?) IS NOT NULL) +
         (SELECT COUNT(*) FROM site_settings WHERE JSON_SEARCH(value_json, 'one', ?) IS NOT NULL)
         AS reference_count`,
      [row.public_url, row.public_url, row.public_url, row.public_url, row.public_url, row.public_url],
    );
    if (Number(references?.reference_count ?? 0) > 0) continue;
    await unlink(safeMediaPath(row.storage_key)).catch(() => undefined);
    await executeMutation("DELETE FROM media_assets WHERE public_url = ?", [row.public_url]);
  }
}

async function seedCatalog(): Promise<void> {
  process.stdout.write("Reading the live N7 Cosmetics catalog.\n");
  const [categories, sourceProducts, previousMedia, thresholdSetting] = await Promise.all([
    fetchAllPages<StoreCategory>("products/categories"),
    fetchAllPages<StoreProduct>("products"),
    oldCatalogMedia(),
    selectOne<SettingRow>("SELECT value_json FROM site_settings WHERE setting_key = 'inventory.low_stock_threshold' LIMIT 1"),
  ]);
  if (!sourceProducts.length) throw new Error("The live catalog returned no products; the database was not changed.");
  process.stdout.write(`Found ${sourceProducts.length} products and ${categories.length} categories.\n`);
  const products = await prepareProducts(sourceProducts, categories);
  const media = await prepareMedia(products);
  try {
    await withTransaction((connection) => insertCatalog(connection, categories, products, media, globalLowStockThreshold(thresholdSetting?.value_json)));
  } catch (error) {
    await Promise.all([...media.values()].map((asset) => unlink(asset.absolutePath).catch(() => undefined)));
    throw error;
  }
  await cleanupOldMedia(previousMedia);
  const soldOut = products.filter((product) => !product.is_in_stock).length;
  const recreationCount = products.filter((product) => product.isRecreation).length;
  process.stdout.write(`Seeded ${products.length} products (${soldOut} out of stock, ${products.length - soldOut} with stock 20).\n`);
  process.stdout.write(`Seeded ${categories.filter((category) => category.slug !== "bundles").length} categories and ${collectionDefinitions.length} collections; ${recreationCount} recreation products use the shared private 5.png asset.\n`);
}

seedCatalog().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(async () => {
  await getPool().end().catch(() => undefined);
});

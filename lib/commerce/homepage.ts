import type { RowDataPacket } from "mysql2/promise";
import { productsContent } from "@/content/products";
import { homeContent } from "@/content/home";
import { hasDatabaseConfig } from "@/lib/env";
import { selectRows } from "@/lib/db/query";
import { defaultFooterContent, defaultHeaderContent, defaultHomepageConfiguration } from "@/lib/homepage/defaults";
import { applyHeroProductPresentations, normalizeHeroProductPresentations } from "@/lib/homepage/hero";
import type { FooterContent, HeaderContent, HomepageConfiguration, HomepageProduct, HomepageStorefrontContent } from "@/lib/homepage/types";

interface SectionRow extends RowDataPacket { page_key: string; section_key: string; content_json: unknown }
interface ProductRow extends RowDataPacket { id: string; slug: string; name: string; product_type: string; short_description: string | null; description: string | null; brand: string | null; inspired_by: string | null; fragrance_notes_json: unknown; price_pence: number; variant_title: string | null; image_url: string | null; average_rating: number | string }
interface ProductIdRow extends RowDataPacket { id: string }

function object(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string") { try { return object(JSON.parse(value)); } catch { return null; } }
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function merge<T extends object>(fallback: T, value: unknown): T { return { ...fallback, ...(object(value) ?? {}) }; }
function notes(value: unknown): string[] { if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string"); if (typeof value === "string") { try { return notes(JSON.parse(value)); } catch { return []; } } return []; }
function money(value: number): string { return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 }).format(value / 100); }

async function sectionRows(pageKey: "home" | "global"): Promise<Map<string, unknown>> {
  if (!hasDatabaseConfig()) return new Map();
  const rows = await selectRows<SectionRow>("SELECT page_key, section_key, content_json FROM page_sections WHERE page_key = ?", [pageKey]);
  return new Map(rows.map((row) => [row.section_key, row.content_json]));
}

export async function getGlobalStorefrontContent(): Promise<{ header: HeaderContent; footer: FooterContent }> {
  const rows = await sectionRows("global");
  const header = merge(defaultHeaderContent, rows.get("header"));
  const footer = merge(defaultFooterContent, rows.get("footer"));
  header.navigation = Array.isArray(header.navigation) ? header.navigation : defaultHeaderContent.navigation;
  footer.legalLinks = Array.isArray(footer.legalLinks) ? footer.legalLinks : defaultFooterContent.legalLinks;
  return { header, footer };
}

export async function getHomepageConfiguration(): Promise<HomepageConfiguration> {
  const rows = await sectionRows("home");
  const config: HomepageConfiguration = {
    hero: merge(defaultHomepageConfiguration.hero, rows.get("hero")),
    signature: merge(defaultHomepageConfiguration.signature, rows.get("signature-fragrances")),
    brandFilm: merge(defaultHomepageConfiguration.brandFilm, rows.get("brand-film")),
    recreations: merge(defaultHomepageConfiguration.recreations, rows.get("recreations")),
    weekly: merge(defaultHomepageConfiguration.weekly, rows.get("fragrance-week")),
    scentStory: merge(defaultHomepageConfiguration.scentStory, rows.get("scent-story")),
    audience: merge(defaultHomepageConfiguration.audience, rows.get("audience-collections")),
    reviews: merge(defaultHomepageConfiguration.reviews, rows.get("reviews")),
  };
  config.hero.productIds = Array.isArray(config.hero.productIds)
    ? [...new Set(config.hero.productIds.filter((id): id is string => typeof id === "string" && /^[1-9]\d*$/.test(id)))]
    : [];
  const selectedHeroIds = new Set(config.hero.productIds);
  config.hero.products = normalizeHeroProductPresentations(config.hero.products).filter((item) => selectedHeroIds.has(item.productId));
  config.audience.cards = Array.isArray(config.audience.cards) ? config.audience.cards : defaultHomepageConfiguration.audience.cards;
  config.reviews.reviews = Array.isArray(config.reviews.reviews) ? config.reviews.reviews : defaultHomepageConfiguration.reviews.reviews;
  if (hasDatabaseConfig() && (!config.hero.productIds.length || !config.signature.productIds.length || !config.recreations.productIds.length || !config.weekly.productId)) {
    const [originals, recreations, weekly] = await Promise.all([
      selectRows<ProductIdRow>("SELECT CAST(p.id AS CHAR) AS id FROM products p INNER JOIN product_collections pc ON pc.product_id = p.id INNER JOIN collections c ON c.id = pc.collection_id WHERE c.slug = 'yusuf-bhai-originals' AND p.status = 'ACTIVE' ORDER BY p.id LIMIT 8"),
      selectRows<ProductIdRow>("SELECT CAST(p.id AS CHAR) AS id FROM products p INNER JOIN product_collections pc ON pc.product_id = p.id INNER JOIN collections c ON c.id = pc.collection_id WHERE c.slug = 'recreations' AND p.status = 'ACTIVE' ORDER BY p.id LIMIT 10"),
      selectRows<ProductIdRow>("SELECT CAST(id AS CHAR) AS id FROM products WHERE status = 'ACTIVE' ORDER BY (name LIKE 'Devoir%') DESC, id LIMIT 1"),
    ]);
    if (!config.hero.productIds.length) config.hero.productIds = originals.slice(0, 5).map((row) => row.id);
    if (!config.signature.productIds.length) config.signature.productIds = originals.map((row) => row.id);
    if (!config.recreations.productIds.length) config.recreations.productIds = recreations.map((row) => row.id);
    if (!config.weekly.productId) config.weekly.productId = weekly[0]?.id ?? "";
  }
  return config;
}

async function productsByIds(ids: string[]): Promise<HomepageProduct[]> {
  if (!ids.length || !hasDatabaseConfig()) return [];
  const unique = [...new Set(ids.filter((id) => /^[1-9]\d*$/.test(id)))];
  if (!unique.length) return [];
  const placeholders = unique.map(() => "?").join(",");
  const rows = await selectRows<ProductRow>(`SELECT CAST(p.id AS CHAR) AS id, p.slug, p.name, p.product_type, p.short_description, p.description, p.brand, p.inspired_by, p.fragrance_notes_json, v.price_pence, v.title AS variant_title, i.url AS image_url, COALESCE((SELECT AVG(pr.rating) FROM product_reviews pr WHERE pr.product_id = p.id AND pr.status = 'PUBLISHED'), 0) AS average_rating FROM products p INNER JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1 LEFT JOIN product_images i ON i.id = (SELECT pi.id FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) WHERE p.id IN (${placeholders}) AND p.status = 'ACTIVE'`, unique);
  const mapped = new Map(rows.map((row) => [row.id, { id: row.id, slug: row.slug, name: row.name, type: row.brand || (row.product_type === "BUNDLE" ? "Bundle" : "Perfume"), price: money(row.price_pence), pricePence: row.price_pence, rating: Number(row.average_rating) || 0, image: row.image_url || "/imgs/products/5.png", description: row.description || row.short_description || "A distinctive N7 fragrance composed to leave a memorable signature.", tagline: row.inspired_by ? `Inspired by ${row.inspired_by}` : row.brand || "N7 Cosmetics", notes: notes(row.fragrance_notes_json), size: row.variant_title && row.variant_title !== "Default" ? row.variant_title : "100 ml" } satisfies HomepageProduct]));
  return ids.map((id) => mapped.get(id)).filter((product): product is HomepageProduct => Boolean(product));
}

function fallbackProducts(source: typeof productsContent.signature): HomepageProduct[] { return source.map((product, index) => ({ id: String(product.id), slug: product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name: product.name, type: product.type, price: product.price, pricePence: Math.round(Number(product.price.replace(/[^0-9.]/g, "")) * 100), rating: 0, image: `/imgs/products/${(index % 8) + 1}.png`, description: "A meticulously crafted masterpiece inspired by the world's most iconic aromas, elevated with our signature touch.", tagline: "Essence of elegance", notes: [], size: "100 ml" })); }

export async function getHomepageStorefrontContent(): Promise<HomepageStorefrontContent> {
  const configuration = await getHomepageConfiguration();
  const [heroProducts, signatureProducts, recreationProducts, weeklyProducts] = await Promise.all([productsByIds(configuration.hero.productIds), productsByIds(configuration.signature.productIds), productsByIds(configuration.recreations.productIds), productsByIds(configuration.weekly.productId ? [configuration.weekly.productId] : [])]);
  return {
    configuration,
    heroProducts: heroProducts.length ? applyHeroProductPresentations(heroProducts, configuration.hero.products) : homeContent.hero.products.map((product, index) => ({ id: `hero-${index}`, slug: product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name: product.name, type: "Perfume", price: "£0", pricePence: 0, rating: 0, image: product.image, description: product.description, tagline: product.tagline, notes: [], size: "100 ml" })),
    signatureProducts: signatureProducts.length ? signatureProducts : fallbackProducts(productsContent.signature),
    recreationProducts: recreationProducts.length ? recreationProducts : fallbackProducts(productsContent.recreations),
    weeklyProduct: weeklyProducts[0] ?? null,
  };
}

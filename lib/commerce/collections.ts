import type { RowDataPacket } from "mysql2/promise";
import type { CollectionProduct, CollectionSlug } from "@/content/collections";
import { selectRows } from "@/lib/db/query";
import { hasDatabaseConfig } from "@/lib/env";
import { getAvailableCategoryLinks, getCategoryBySlug } from "./categories";
import { isCategoryCollectionSlug } from "./category-config";
import {
  defaultCategoryPageConfiguration,
  emptyStorefrontPageConfiguration,
  isEditableStorefrontPageSlug,
  normalizeStorefrontPageDetail,
  normalizeStorefrontPageHero,
  storefrontPageDatabaseKey,
  storefrontCategoryDatabaseKey,
  type EditableStorefrontPageSlug,
  type StorefrontCollectionPageContent,
  type StorefrontPageConfiguration,
} from "@/lib/storefront-pages/config";

export type CollectionPageKey = "n7" | "originals" | "premium" | "recreations" | "sale" | "bundles";

const collectionSlugs: Record<CollectionPageKey, CollectionSlug> = {
  n7: "n7",
  originals: "yusuf-bhai-originals",
  premium: "premium-collection",
  recreations: "recreations",
  sale: "sale",
  bundles: "bundles",
};

const salePageConfiguration: StorefrontPageConfiguration = {
  hero: {
    eyebrow: "Limited prices / While available",
    title: { lead: "The Seasonal", accent: "Edit" },
    intro: "A changing selection of fragrances and sets offered at a considered price for a limited time. Availability is intentionally finite, and the edit changes as pieces sell through.",
    statement: "Exceptional fragrance. A rare opportunity.",
    highlights: ["Limited-time pricing", "While stocks last", "Secure UK delivery"],
    productIds: [],
  },
  detail: {
    eyebrow: "Complete collection",
    title: "The seasonal edit",
    description: "Exceptional fragrance. A rare opportunity.",
    credit: "A limited edit by N7 Cosmetics",
    comingSoon: {
      enabled: false,
      eyebrow: "",
      title: "",
      description: "",
      image: "",
    },
  },
};

interface CollectionProductRow extends RowDataPacket {
  id: string;
  product_type: "STANDARD" | "BUNDLE";
  slug: string;
  name: string;
  inspired_by: string | null;
  product_code: string | null;
  audience: string;
  category: string | null;
  price_pence: number;
  compare_at_price_pence?: number | null;
  image_url: string;
  average_rating: number | string;
}

interface PageSectionRow extends RowDataPacket {
  section_key: "hero" | "detail";
  content_json: unknown;
}

function parseContentJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function mapCollectionProduct(row: CollectionProductRow): CollectionProduct {
  return {
    id: row.id,
    slug: row.slug,
    productType: row.product_type,
    name: row.name,
    category: row.category ?? "Fragrance",
    price: row.price_pence / 100,
    compareAtPrice: row.compare_at_price_pence
      ? row.compare_at_price_pence / 100
      : undefined,
    rating: Number(row.average_rating) || 0,
    inspiredBy: row.inspired_by,
    productCode: row.product_code,
    audience: row.audience,
    image: row.image_url,
  };
}

export async function getStorefrontPageConfiguration(
  slug: EditableStorefrontPageSlug,
): Promise<StorefrontPageConfiguration> {
  if (!hasDatabaseConfig()) return emptyStorefrontPageConfiguration();

  const rows = await selectRows<PageSectionRow>(
    `SELECT section_key, content_json
     FROM page_sections
     WHERE page_key = ? AND section_key IN ('hero', 'detail') AND is_enabled = 1`,
    [storefrontPageDatabaseKey(slug)],
  );

  const sections = new Map(rows.map((row) => [row.section_key, parseContentJson(row.content_json)]));
  return {
    hero: normalizeStorefrontPageHero(sections.get("hero")),
    detail: normalizeStorefrontPageDetail(sections.get("detail")),
  };
}

export async function getStorefrontPageConfigurationByKey(
  pageKey: string,
  fallback: StorefrontPageConfiguration,
): Promise<StorefrontPageConfiguration> {
  if (!hasDatabaseConfig()) return fallback;
  const rows = await selectRows<PageSectionRow>(
    `SELECT section_key, content_json
     FROM page_sections
     WHERE page_key = ? AND section_key IN ('hero', 'detail') AND is_enabled = 1`,
    [pageKey],
  );
  const sections = new Map(rows.map((row) => [row.section_key, parseContentJson(row.content_json)]));
  return {
    hero: sections.has("hero") ? normalizeStorefrontPageHero(sections.get("hero")) : fallback.hero,
    detail: sections.has("detail") ? normalizeStorefrontPageDetail(sections.get("detail")) : fallback.detail,
  };
}

async function getProductsByIds(productIds: string[]): Promise<CollectionProduct[]> {
  if (!productIds.length) return [];
  const placeholders = productIds.map(() => "?").join(", ");
  const rows = await selectRows<CollectionProductRow>(
    `SELECT CAST(p.id AS CHAR) AS id, p.product_type, p.slug, p.name, p.inspired_by, p.product_code, p.audience,
       (SELECT c.name FROM product_categories pc INNER JOIN categories c ON c.id = pc.category_id WHERE pc.product_id = p.id ORDER BY c.sort_order, c.name LIMIT 1) AS category,
       v.price_pence, v.compare_at_price_pence,
       (SELECT i.url FROM product_images i WHERE i.product_id = p.id ORDER BY i.sort_order, i.id LIMIT 1) AS image_url,
       COALESCE((SELECT AVG(pr.rating) FROM product_reviews pr WHERE pr.product_id = p.id AND pr.status = 'PUBLISHED'), 0) AS average_rating
     FROM products p
     INNER JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1 AND v.status = 'ACTIVE'
     WHERE p.status = 'ACTIVE'
       AND EXISTS (SELECT 1 FROM product_images required_image WHERE required_image.product_id = p.id)
       AND p.id IN (${placeholders})`,
    productIds,
  );
  const byId = new Map(rows.map((row) => [row.id, mapCollectionProduct(row)]));
  return productIds.flatMap((id) => {
    const product = byId.get(id);
    return product ? [product] : [];
  });
}

async function getCollectionProducts(slug: CollectionSlug, categoryId?: string): Promise<CollectionProduct[]> {
  const rows = slug === "bundles"
    ? await selectRows<CollectionProductRow>(
        `SELECT CAST(p.id AS CHAR) AS id, p.product_type, p.slug, p.name, p.inspired_by, p.product_code, p.audience,
          'Bundle' AS category,
          v.price_pence, v.compare_at_price_pence,
          (SELECT i.url FROM product_images i WHERE i.product_id = p.id ORDER BY i.sort_order, i.id LIMIT 1) AS image_url,
          COALESCE((SELECT AVG(pr.rating) FROM product_reviews pr WHERE pr.product_id = p.id AND pr.status = 'PUBLISHED'), 0) AS average_rating
        FROM products p
        INNER JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1 AND v.status = 'ACTIVE'
        WHERE p.status = 'ACTIVE'
          AND p.product_type = 'BUNDLE'
          AND EXISTS (SELECT 1 FROM bundle_items required_component WHERE required_component.bundle_product_id = p.id)
          AND NOT EXISTS (
            SELECT 1
            FROM bundle_items invalid_component
            INNER JOIN product_variants component_variant ON component_variant.id = invalid_component.component_variant_id
            INNER JOIN products component_product ON component_product.id = component_variant.product_id
            WHERE invalid_component.bundle_product_id = p.id
              AND (component_variant.status != 'ACTIVE' OR component_product.status != 'ACTIVE' OR component_product.product_type != 'STANDARD')
          )
          AND EXISTS (SELECT 1 FROM product_images required_image WHERE required_image.product_id = p.id)
        ORDER BY p.featured DESC, p.published_at DESC, p.name`,
      )
    : slug === "sale"
    ? await selectRows<CollectionProductRow>(
        `SELECT CAST(p.id AS CHAR) AS id, p.product_type, p.slug, p.name, p.inspired_by, p.product_code, p.audience,
          COALESCE((SELECT c.name FROM product_categories pc INNER JOIN categories c ON c.id = pc.category_id WHERE pc.product_id = p.id ORDER BY c.sort_order, c.name LIMIT 1), 'Sale') AS category,
          v.price_pence, v.compare_at_price_pence,
          (SELECT i.url FROM product_images i WHERE i.product_id = p.id ORDER BY i.sort_order, i.id LIMIT 1) AS image_url,
          COALESCE((SELECT AVG(pr.rating) FROM product_reviews pr WHERE pr.product_id = p.id AND pr.status = 'PUBLISHED'), 0) AS average_rating
        FROM products p
        INNER JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1 AND v.status = 'ACTIVE'
        WHERE p.status = 'ACTIVE'
          AND p.product_type = 'STANDARD'
          AND EXISTS (SELECT 1 FROM product_images required_image WHERE required_image.product_id = p.id)
          AND v.compare_at_price_pence IS NOT NULL
          AND v.compare_at_price_pence > v.price_pence
        ORDER BY (v.compare_at_price_pence - v.price_pence) DESC, p.name`,
      )
    : await selectRows<CollectionProductRow>(
        `SELECT CAST(p.id AS CHAR) AS id, p.product_type, p.slug, p.name, p.inspired_by, p.product_code, p.audience,
          NULL AS category,
          v.price_pence, v.compare_at_price_pence,
          (SELECT i.url FROM product_images i WHERE i.product_id = p.id ORDER BY i.sort_order, i.id LIMIT 1) AS image_url,
          COALESCE((SELECT AVG(pr.rating) FROM product_reviews pr WHERE pr.product_id = p.id AND pr.status = 'PUBLISHED'), 0) AS average_rating
        FROM product_collections pcl
        INNER JOIN collections col ON col.id = pcl.collection_id AND col.status = 'ACTIVE'
        INNER JOIN products p ON p.id = pcl.product_id AND p.status = 'ACTIVE' AND p.product_type = 'STANDARD'
        INNER JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1 AND v.status = 'ACTIVE'
        WHERE col.slug = ?
          ${categoryId ? "AND EXISTS (SELECT 1 FROM product_categories pc INNER JOIN categories c ON c.id = pc.category_id WHERE pc.product_id = p.id AND c.id = ? AND c.collection_id = col.id AND c.status = 'ACTIVE')" : ""}
          AND EXISTS (SELECT 1 FROM product_images required_image WHERE required_image.product_id = p.id)
        ORDER BY pcl.sort_order, p.name`,
        categoryId ? [slug, categoryId] : [slug],
      );
  const products = rows.map(mapCollectionProduct);
  if (!isCategoryCollectionSlug(slug) || !products.length) return products;
  const assignments = await selectRows<RowDataPacket & { product_id: string; name: string }>(
    `SELECT CAST(pc.product_id AS CHAR) AS product_id, c.name
     FROM categories c INNER JOIN collections col ON col.id = c.collection_id
     INNER JOIN product_categories pc ON pc.category_id = c.id
     INNER JOIN product_collections pcl ON pcl.product_id = pc.product_id AND pcl.collection_id = c.collection_id
     WHERE col.slug = ? AND c.status = 'ACTIVE' ORDER BY c.sort_order, c.name`, [slug],
  );
  const categoryNames = new Map<string, string[]>();
  for (const assignment of assignments) {
    const names = categoryNames.get(assignment.product_id) ?? [];
    names.push(assignment.name);
    categoryNames.set(assignment.product_id, names);
  }
  return products.map((product) => {
    const names = categoryNames.get(product.id ?? "") ?? [];
    return { ...product, category: names[0] ?? "Fragrance", categoryNames: names };
  });
}

export async function getCollectionPage(key: CollectionPageKey): Promise<StorefrontCollectionPageContent> {
  const slug = collectionSlugs[key];
  const editableSlug = isEditableStorefrontPageSlug(slug) ? slug : null;
  const configurationPromise = editableSlug
    ? getStorefrontPageConfiguration(editableSlug)
    : Promise.resolve(salePageConfiguration);
  const productsPromise = hasDatabaseConfig() ? getCollectionProducts(slug) : Promise.resolve([]);
  const [products, pageConfiguration, categories] = await Promise.all([productsPromise, configurationPromise, getAvailableCategoryLinks(slug)]);
  const heroProducts = hasDatabaseConfig()
    ? await getProductsByIds(pageConfiguration.hero.productIds)
    : [];

  return {
    slug,
    eyebrow: pageConfiguration.hero.eyebrow,
    title: pageConfiguration.hero.title,
    intro: pageConfiguration.hero.intro,
    statement: pageConfiguration.hero.statement,
    credit: pageConfiguration.detail.credit,
    highlights: pageConfiguration.hero.highlights,
    products,
    pageConfiguration,
    heroProducts,
    categories,
  };
}

export async function getCategoryPage(collectionSlug: string, categorySlug: string) {
  if (!isCategoryCollectionSlug(collectionSlug)) return null;
  const category = await getCategoryBySlug(collectionSlug, categorySlug);
  if (!category) return null;
  const [products, pageConfiguration] = await Promise.all([
    getCollectionProducts(collectionSlug, category.id),
    getStorefrontPageConfigurationByKey(
      storefrontCategoryDatabaseKey(category.id),
      defaultCategoryPageConfiguration(category.name, category.collection_name, category.description),
    ),
  ]);
  const byId = new Map(products.map((product) => [product.id, product]));
  const collection: StorefrontCollectionPageContent = {
    slug: collectionSlug, categoryId: category.id,
    eyebrow: pageConfiguration.hero.eyebrow,
    title: pageConfiguration.hero.title,
    intro: pageConfiguration.hero.intro,
    statement: pageConfiguration.hero.statement,
    highlights: pageConfiguration.hero.highlights,
    credit: pageConfiguration.detail.credit,
    products: products.map((product) => ({ ...product, category: category.name, categoryNames: [category.name] })),
    pageConfiguration,
    heroProducts: pageConfiguration.hero.productIds.flatMap((id) => {
      const product = byId.get(id);
      return product ? [product] : [];
    }),
  };
  return { category, collection };
}

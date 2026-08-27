import type { CollectionPageContent, CollectionSlug } from "../../content/collections";

export const editableStorefrontPageSlugs = [
  "n7",
  "recreations",
  "yusuf-bhai-originals",
  "premium-collection",
  "bundles",
] as const;

export type EditableStorefrontPageSlug = (typeof editableStorefrontPageSlugs)[number];

export interface StorefrontPageHeroContent {
  eyebrow: string;
  title: { lead: string; accent: string };
  intro: string;
  statement: string;
  highlights: string[];
  productIds: string[];
}

export interface StorefrontPageDetailContent {
  eyebrow: string;
  title: string;
  description: string;
  credit: string;
  comingSoon: StorefrontPageComingSoonContent;
}

export interface StorefrontPageComingSoonContent {
  enabled: boolean;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
}

export interface StorefrontPageConfiguration {
  hero: StorefrontPageHeroContent;
  detail: StorefrontPageDetailContent;
}

interface StorefrontPageDefinition {
  name: string;
  shortName: string;
  description: string;
  path: `/${EditableStorefrontPageSlug}`;
}

export const storefrontPageDefinitions: Record<EditableStorefrontPageSlug, StorefrontPageDefinition> = {
  n7: {
    name: "N7 Collection",
    shortName: "N7",
    description: "The signature N7 Cosmetics edit, curated around presence, individuality, and lasting character.",
    path: "/n7",
  },
  recreations: {
    name: "Recreations",
    shortName: "Recreations",
    description: "The complete library of independent interpretations and familiar scent profiles.",
    path: "/recreations",
  },
  "yusuf-bhai-originals": {
    name: "Yusuf Bhai Originals",
    shortName: "Originals",
    description: "Original Yusuf Bhai compositions across the house’s signature fragrance families.",
    path: "/yusuf-bhai-originals",
  },
  "premium-collection": {
    name: "Premium Collection",
    shortName: "Premium",
    description: "A private edit of elevated fragrance profiles curated by N7 Cosmetics.",
    path: "/premium-collection",
  },
  bundles: {
    name: "Bundles",
    shortName: "Bundles",
    description: "Curated fragrance trios composed for different moments, moods, and occasions.",
    path: "/bundles",
  },
};

export function isEditableStorefrontPageSlug(value: string): value is EditableStorefrontPageSlug {
  return (editableStorefrontPageSlugs as readonly string[]).includes(value);
}

export function storefrontPageDatabaseKey(slug: EditableStorefrontPageSlug): string {
  return `collection-page:${slug}`;
}

export function storefrontSaleDatabaseKey(saleId: string): string {
  return `sale:${saleId}`;
}

export function defaultSalePageConfiguration(
  saleName: string,
  buyQuantity: number,
  freeQuantity: number,
): StorefrontPageConfiguration {
  return {
    hero: {
      eyebrow: "Limited offer / Selected fragrances",
      title: { lead: saleName, accent: "Sale" },
      intro: `Choose ${buyQuantity} fragrances from this limited edit and enjoy ${freeQuantity} on us.`,
      statement: "A considered selection. An exceptional opportunity.",
      highlights: [
        `${buyQuantity} qualifying products`,
        `${freeQuantity} included free`,
        "While availability lasts",
      ],
      productIds: [],
    },
    detail: {
      eyebrow: "Build your selection",
      title: saleName,
      description: "Choose from the fragrances included in this offer.",
      credit: "A limited offer by N7 Cosmetics",
      comingSoon: {
        enabled: false,
        eyebrow: "",
        title: "",
        description: "",
        image: "",
      },
    },
  };
}

export function emptyStorefrontPageConfiguration(): StorefrontPageConfiguration {
  return {
    hero: {
      eyebrow: "",
      title: { lead: "", accent: "" },
      intro: "",
      statement: "",
      highlights: ["", "", ""],
      productIds: [],
    },
    detail: {
      eyebrow: "",
      title: "",
      description: "",
      credit: "",
      comingSoon: {
        enabled: false,
        eyebrow: "",
        title: "",
        description: "",
        image: "",
      },
    },
  };
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function localMediaUrl(value: unknown): string {
  const url = text(value, 1000);
  return /^\/(?!\/)[^\s]+$/.test(url) ? url : "";
}

function productIds(value: unknown, maximum: number): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && /^[1-9]\d*$/.test(item)))].slice(0, maximum);
}

export function normalizeStorefrontPageHero(value: unknown): StorefrontPageHeroContent {
  const candidate = object(value);
  const candidateTitle = object(candidate.title);
  const highlights = Array.isArray(candidate.highlights)
    ? candidate.highlights
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().slice(0, 160))
        .slice(0, 3)
    : [];
  while (highlights.length < 3) highlights.push("");
  return {
    eyebrow: text(candidate.eyebrow, 160),
    title: {
      lead: text(candidateTitle.lead, 160),
      accent: text(candidateTitle.accent, 160),
    },
    intro: text(candidate.intro, 1600),
    statement: text(candidate.statement, 500),
    highlights,
    productIds: productIds(candidate.productIds, 3),
  };
}

export function normalizeStorefrontPageDetail(value: unknown): StorefrontPageDetailContent {
  const candidate = object(value);
  const comingSoon = object(candidate.comingSoon);
  return {
    eyebrow: text(candidate.eyebrow, 160),
    title: text(candidate.title, 190),
    description: text(candidate.description, 1000),
    credit: text(candidate.credit, 190),
    comingSoon: {
      enabled: comingSoon.enabled === true || candidate.showComingSoon === true,
      eyebrow: text(comingSoon.eyebrow, 160),
      title: text(comingSoon.title, 190),
      description: text(comingSoon.description, 1000),
      image: localMediaUrl(comingSoon.image),
    },
  };
}

export interface StorefrontCollectionPageContent extends CollectionPageContent {
  slug: CollectionSlug;
  pageConfiguration: StorefrontPageConfiguration;
  heroProducts?: CollectionPageContent["products"];
}

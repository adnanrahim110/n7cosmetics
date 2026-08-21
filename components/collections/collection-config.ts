import type { CollectionSlug } from "../../content/collections";

export const collectionEase = [0.22, 1, 0.36, 1] as const;
export const productBatchSize = 12;

export interface CollectionDesign {
  accent: string;
  code: string;
  ghost: string;
  heroBase: string;
  heroSurface: string;
  heroInk: string;
  heroProductIndexes: [number, number, number];
  indexTitle: string;
  nextHref: string;
  nextLabel: string;
}

export type SortOption =
  | "featured"
  | "rating"
  | "price-low"
  | "price-high"
  | "name";

export type PriceBand = "under-35" | "35-to-40" | "over-40";

export const priceBandLabels: Record<PriceBand, string> = {
  "under-35": "Under £35",
  "35-to-40": "£35 — £40",
  "over-40": "Above £40",
};

export const productMatchesPriceBand = (
  price: number,
  priceBand: PriceBand,
) => {
  if (priceBand === "under-35") return price < 35;
  if (priceBand === "35-to-40") return price >= 35 && price <= 40;
  return price > 40;
};

export const collectionDesigns: Record<CollectionSlug, CollectionDesign> = {
  "yusuf-bhai-originals": {
    accent: "#b88755",
    code: "01 / ORIGINALS",
    ghost: "ORIGINAL",
    heroBase: "#1b120c",
    heroSurface: "#aa8a64",
    heroInk: "#21160f",
    heroProductIndexes: [1, 14, 15],
    indexTitle: "House signatures",
    nextHref: "/recreations",
    nextLabel: "The art of recreation",
  },
  recreations: {
    accent: "#809fa6",
    code: "02 / RECREATIONS",
    ghost: "RECREATE",
    heroBase: "#0d191c",
    heroSurface: "#678285",
    heroInk: "#122327",
    heroProductIndexes: [0, 4, 5],
    indexTitle: "The scent index",
    nextHref: "/bundles",
    nextLabel: "Curated fragrance trios",
  },
  bundles: {
    accent: "#a9725f",
    code: "03 / BUNDLES",
    ghost: "THREE",
    heroBase: "#211310",
    heroSurface: "#916655",
    heroInk: "#2b1712",
    heroProductIndexes: [0, 1, 2],
    indexTitle: "The complete wardrobe",
    nextHref: "/yusuf-bhai-originals",
    nextLabel: "Return to the originals",
  },
};

export const formatCollectionPrice = (price: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
  }).format(price);

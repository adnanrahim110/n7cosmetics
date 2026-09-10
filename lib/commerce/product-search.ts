export const MAX_SEARCH_QUERY_LENGTH = 80;
export const MIN_SEARCH_QUERY_LENGTH = 2;

export interface SearchableProduct {
  id: string;
  name: string;
  slug: string;
  brand?: string | null;
  inspiredBy?: string | null;
  productCode?: string | null;
  sku?: string | null;
  categories?: string | null;
  collections?: string | null;
  audience?: string | null;
  notes?: unknown;
  shortDescription?: string | null;
  description?: string | null;
  productType?: string;
  featured?: boolean;
}

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "for", "by", "with", "from", "of", "in",
  "to", "is", "it", "i", "me", "my", "please", "show", "find", "want",
  "looking", "something", "like", "inspired", "inspiration",
]);
const GENERIC_WORDS = new Set(["perfume", "perfumes", "fragrance", "fragrances", "scent", "scents"]);

export function normalizeSearchQuery(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, MAX_SEARCH_QUERY_LENGTH);
}

function normalizeText(value: string): string {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/&(?:amp;)?/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}

// Resolve common house abbreviations and existing catalog spelling variants
// without changing the product information displayed to shoppers.
const BRAND_ALIASES: [RegExp, string][] = [
  [/\b(?:ysl|yves saint laurent)\b/g, "yves saint laurent"],
  [/\b(?:lv|louis vuittion|louis vuitton)\b/g, "louis vuitton"],
  [/\b(?:mfk|maison francis(?: kurkdjian)?)\b/g, "maison francis kurkdjian"],
  [/\b(?:pdm|(?:parfums|perfumes) de marly)\b/g, "parfums de marly"],
  [/\b(?:pacco rabanna|paco rabanne)\b/g, "paco rabanne"],
  [/\b(?:bulgari|bvlgari)\b/g, "bvlgari"],
  [/\b(?:d and g|dolce (?:and )?gabbana)\b/g, "dolce and gabbana"],
];

function canonicalText(value: string): string {
  let normalized = normalizeText(value);
  for (const [pattern, replacement] of BRAND_ALIASES) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized.replace(/\b(?:mens|man|male)\b/g, "men")
    .replace(/\b(?:womens|woman|female|ladies)\b/g, "women");
}

function noteText(value: unknown): string {
  if (typeof value === "string") {
    try { return noteText(JSON.parse(value)); } catch { return value; }
  }
  if (Array.isArray(value)) return value.filter((note) => typeof note === "string").join(" ");
  if (value && typeof value === "object") {
    const groups = value as Record<string, unknown>;
    return [groups.top, groups.heart, groups.base].map(noteText).join(" ");
  }
  return "";
}

interface SearchField {
  text: string;
  words: string[];
  weight: number;
  identifier: boolean;
}

function searchFields(product: SearchableProduct): SearchField[] {
  const fields: [string | null | undefined, number, boolean?][] = [
    // Prefer the standalone fragrance over a longer bundle title mentioning it.
    [product.name, 100 + 10 / normalizeText(product.name).split(" ").length],
    [product.productCode, 110, true],
    [product.sku, 105, true],
    [product.inspiredBy, 90],
    [product.brand, 85],
    [product.slug, 70],
    [product.categories, 55],
    [product.collections, 50],
    [product.audience === "UNSPECIFIED" ? "" : product.audience, 55],
    [noteText(product.notes), 55],
    [product.shortDescription, 25],
    [product.description?.replace(/<[^>]*>/g, " "), 15],
    [product.productType === "BUNDLE" ? "bundle bundles fragrance perfume scent" : "fragrance perfume scent", 20],
  ];
  return fields.flatMap(([value, weight, identifier = false]) => {
    if (!value) return [];
    const text = identifier ? normalizeText(value) : canonicalText(value);
    return [{ text, words: text.split(" "), weight, identifier }];
  });
}

// Bounded edit distance also accepts adjacent swapped letters (e.g. "sauvgae").
function isCloseWord(query: string, word: string): boolean {
  if (query.length < 4 || /\d/.test(query) || /\d/.test(word)) return false;
  const maxEdits = query.length >= 7 ? 2 : 1;
  if (Math.abs(query.length - word.length) > maxEdits) return false;
  let previousPrevious: number[] = [];
  let previous = Array.from({ length: word.length + 1 }, (_, index) => index);
  for (let row = 1; row <= query.length; row++) {
    const current = [row];
    for (let column = 1; column <= word.length; column++) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (query[row - 1] === word[column - 1] ? 0 : 1),
      );
      if (row > 1 && column > 1 && query[row - 1] === word[column - 2] && query[row - 2] === word[column - 1]) {
        current[column] = Math.min(current[column], previousPrevious[column - 2] + 1);
      }
    }
    if (Math.min(...current) > maxEdits) return false;
    previousPrevious = previous;
    previous = current;
  }
  return previous[word.length] <= maxEdits;
}

function wordQuality(term: string, word: string, identifier: boolean): number {
  if (word === term) return 1;
  if (term === "men" || term === "women" || term === "unisex") return 0;
  // Product numbers must not silently match a different code or a nearby number.
  if (/^\d+$/.test(term)) return 0;
  if (word.startsWith(term)) return 0.85;
  if (term.length >= 3 && word.includes(term)) return 0.7;
  return !identifier && isCloseWord(term, word) ? 0.45 : 0;
}

export function rankProductSearchResults<T extends SearchableProduct>(
  products: readonly T[],
  rawQuery: string,
  limit = 8,
): T[] {
  const query = canonicalText(normalizeSearchQuery(rawQuery));
  if (query.length < MIN_SEARCH_QUERY_LENGTH || limit <= 0) return [];
  const meaningfulTerms = [...new Set(query.split(" "))].filter((term) => !STOP_WORDS.has(term));
  const specificTerms = meaningfulTerms.filter((term) => !GENERIC_WORDS.has(term));
  const terms = specificTerms.length ? specificTerms : meaningfulTerms.map(() => "fragrance");
  if (!terms.length) return [];

  const phrase = terms.join(" ");
  const ranked = products.flatMap((product) => {
    const fields = searchFields(product);
    let score = 0;
    let fuzzyTerms = 0;
    for (const term of terms) {
      let bestScore = 0;
      let hasDirectMatch = false;
      for (const field of fields) {
        const words = field.identifier ? [...field.words, field.text.replaceAll(" ", "")] : field.words;
        for (const word of words) {
          const quality = wordQuality(term, word, field.identifier);
          if (quality >= 0.7) hasDirectMatch = true;
          bestScore = Math.max(bestScore, quality * field.weight);
        }
      }
      if (!bestScore) return [];
      if (!hasDirectMatch) fuzzyTerms++;
      score += bestScore;
    }
    // Whole names/codes and contiguous phrases beat scattered descriptive words.
    let phraseBonus = 0;
    for (const field of fields) {
      const compactMatch = field.identifier && field.text.replaceAll(" ", "") === normalizeText(rawQuery).replaceAll(" ", "");
      if (field.text === query || field.text === phrase || compactMatch) {
        phraseBonus = Math.max(phraseBonus, field.weight * 4);
      } else if (field.text.startsWith(`${phrase} `)) {
        phraseBonus = Math.max(phraseBonus, field.weight * 2);
      }
    }
    return [{ product, score: score / terms.length + phraseBonus, fuzzyTerms }];
  });

  return ranked.sort((a, b) => a.fuzzyTerms - b.fuzzyTerms || b.score - a.score
    || Number(Boolean(b.product.featured)) - Number(Boolean(a.product.featured))
    || a.product.name.localeCompare(b.product.name) || a.product.id.localeCompare(b.product.id))
    .slice(0, limit).map(({ product }) => product);
}

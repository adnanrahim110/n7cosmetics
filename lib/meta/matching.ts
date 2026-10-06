export const metaMatchingKeys = ["em", "ph", "fn", "ln", "ct", "st", "zp", "country"] as const;
export type MetaAdvancedMatching = Partial<Record<typeof metaMatchingKeys[number], string>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

// Pixel accepts scalar matching values; CAPI uses arrays. Only known, already
// hashed customer fields may cross this boundary, never raw addresses or cookies.
export function metaAdvancedMatching(value: unknown): MetaAdvancedMatching {
  const matching: MetaAdvancedMatching = {};
  if (!isRecord(value)) return matching;
  for (const key of metaMatchingKeys) {
    const field = value[key];
    const hash: unknown = Array.isArray(field) && field.length === 1 ? field[0] : field;
    if (typeof hash === "string" && /^[a-f0-9]{64}$/.test(hash)) matching[key] = hash;
  }
  return matching;
}

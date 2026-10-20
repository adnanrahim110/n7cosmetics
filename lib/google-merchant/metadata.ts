import { z } from "zod";

export function validGtin(value: string): boolean {
  if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(value) || /^0+$/.test(value)) return false;
  const prefix = value.length === 8 ? value : value.padStart(14, "0").slice(1);
  if (/^(?:2|02|04|05|98|99)/.test(prefix)) return false;
  let sum = 0;
  for (let index = value.length - 2, position = 0; index >= 0; index--, position++) {
    sum += Number(value[index]) * (position % 2 === 0 ? 3 : 1);
  }
  return (10 - sum % 10) % 10 === Number(value.at(-1));
}

export function validMpn(value: string): boolean { return value.length > 0 && value.length <= 70 && !/[\p{Cc}\p{Cf}<>]/u.test(value); }

export const merchantMetadataSchema = z.object({
  included: z.boolean(),
  gtin: z.string().trim().refine(value => !value || validGtin(value), "Enter a valid manufacturer GTIN (8, 12, 13 or 14 digits, including its check digit)."),
  mpn: z.string().trim().max(70).refine(value => !/[\p{Cc}\p{Cf}<>]/u.test(value), "Use the manufacturer's plain-text MPN."),
  mpnSource: z.enum(["MANUAL", "PRODUCT_CODE"]),
  identifierPolicy: z.enum(["AUTO", "NONE"]),
  googleCategoryId: z.string().trim().regex(/^(?:[1-9]\d{0,9})?$/, "Enter a numeric Google category ID or leave it blank for automatic classification."),
  bundleKind: z.enum(["UNREVIEWED", "SET", "MAIN_PRODUCT", "MULTIPACK", "MANUFACTURER"]),
  mainVariantId: z.string().regex(/^(?:[1-9]\d*)?$/),
}).superRefine((data, context) => {
  if (data.identifierPolicy === "NONE" && (data.gtin || data.mpn || data.mpnSource === "PRODUCT_CODE")) {
    context.addIssue({ code: "custom", path: ["identifierPolicy"], message: "Assigned identifiers cannot be combined with 'none assigned'." });
  }
  if (data.bundleKind === "MAIN_PRODUCT" && !data.mainVariantId) {
    context.addIssue({ code: "custom", path: ["mainVariantId"], message: "Choose the main product included in this bundle." });
  }
});

export type MerchantMetadata = z.infer<typeof merchantMetadataSchema>;
export const defaultMerchantMetadata: MerchantMetadata = {
  included: true, gtin: "", mpn: "", mpnSource: "MANUAL", identifierPolicy: "AUTO", googleCategoryId: "", bundleKind: "UNREVIEWED", mainVariantId: "",
};

// The owner confirmed that recreation product codes are official N7 MPNs.
// This default is deliberately limited to the recreations collection.
export function defaultMetadataForProduct(isRecreation: boolean): MerchantMetadata {
  return { ...defaultMerchantMetadata, mpnSource: isRecreation ? "PRODUCT_CODE" : "MANUAL" };
}

export function merchantMpn(metadata: Pick<MerchantMetadata, "mpn" | "mpnSource">, productCode: string | null, isRecreation: boolean): string {
  return metadata.mpnSource === "PRODUCT_CODE" ? (isRecreation ? productCode?.trim() ?? "" : "") : metadata.mpn;
}

export function merchantMetadataInput(form: FormData): unknown {
  const value = (name: string) => { const field = form.get(name); return typeof field === "string" ? field.trim() : ""; };
  return {
    included: form.get("included") === "on", gtin: value("gtin"), mpn: value("mpn"), mpnSource: value("mpnSource"),
    identifierPolicy: value("identifierPolicy"), googleCategoryId: value("googleCategoryId"),
    bundleKind: value("bundleKind"), mainVariantId: value("mainVariantId"),
  };
}

interface ProductImageContext {
  name: string;
  brand?: string | null;
  productCode?: string | null;
  productType?: "STANDARD" | "BUNDLE";
}

export function productImageAlt(product: ProductImageContext, savedAlt?: string | null): string {
  const name = product.name.trim();
  const alt = savedAlt?.trim();
  const genericAlt = alt?.toLowerCase().replace(/ product image(?: \d+)?$/, "");

  // Keep descriptive alternatives supplied by admin; enrich name-only defaults.
  if (alt && genericAlt !== name.toLowerCase()) return alt;

  const brand = product.brand?.trim();
  const label = brand && !name.toLowerCase().includes(brand.toLowerCase())
    ? `${brand} ${name}`
    : name;
  const subject = product.productType === "BUNDLE" ? "fragrance bundle" : "fragrance bottle";
  const code = product.productCode?.trim();
  return `${label} ${subject}${code ? `, product code ${code}` : ""}`;
}

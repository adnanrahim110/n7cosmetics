export function productIdentifier(productCode?: string | null, sku?: string | null): string | null {
  return productCode?.trim() || sku?.trim() || null;
}

export function productNameWithCode(name: string, productCode?: string | null, sku?: string | null): string {
  const code = productIdentifier(productCode, sku);
  return code ? `${code} - ${name}` : name;
}

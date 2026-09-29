export function productIdentifier(productCode?: string | null): string | null {
  return productCode?.trim() || null;
}

export function productNameWithCode(name: string, productCode?: string | null): string {
  const code = productIdentifier(productCode);
  return code ? `${code} - ${name}` : name;
}

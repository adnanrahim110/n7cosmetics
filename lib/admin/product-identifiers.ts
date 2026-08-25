export function automatedProductSku(productId: string): string {
  if (!/^[1-9]\d*$/.test(productId)) throw new Error("Cannot generate a SKU without a valid product identifier.");
  return `N7-P-${productId.padStart(8, "0")}`;
}

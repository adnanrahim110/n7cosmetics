export interface SalePricingLine {
  key: string;
  quantity: number;
  unitPricePence: number;
}

export interface SalePricingResult {
  amountPence: number;
  allocations: Map<string, number>;
  freeUnits: Map<string, number>;
  qualifyingQuantity: number;
  freeQuantity: number;
}

export function getSaleProgress(quantity: number, buyQuantity: number, freePerGroup: number) {
  const groupQuantity = Math.max(1, Math.floor(buyQuantity)) + Math.max(1, Math.floor(freePerGroup));
  const qualifyingQuantity = Math.max(0, Math.floor(quantity));
  const remainder = qualifyingQuantity % groupQuantity;
  return {
    groupQuantity,
    qualifyingQuantity,
    freeQuantity: Math.floor(qualifyingQuantity / groupQuantity) * Math.max(1, Math.floor(freePerGroup)),
    remainingQuantity: groupQuantity - remainder,
    progressQuantity: qualifyingQuantity > 0 && remainder === 0 ? groupQuantity : remainder,
  };
}

export function calculateBuyXGetYPricing(
  lines: readonly SalePricingLine[],
  buyQuantity: number,
  freePerGroup: number,
): SalePricingResult {
  const qualifyingQuantity = lines.reduce(
    (total, line) => total + Math.max(0, Math.floor(line.quantity)),
    0,
  );
  // "Buy X" counts paid bottles; every complete X + Y group earns Y free.
  const { freeQuantity } = getSaleProgress(qualifyingQuantity, buyQuantity, freePerGroup);
  const allocations = new Map<string, number>();
  const freeUnits = new Map<string, number>();

  let remainingFreeUnits = freeQuantity;
  let amountPence = 0;
  const ordered = [...lines].sort(
    (left, right) =>
      left.unitPricePence - right.unitPricePence || left.key.localeCompare(right.key),
  );

  for (const line of ordered) {
    if (remainingFreeUnits <= 0) break;
    const discountedUnits = Math.min(
      Math.max(0, Math.floor(line.quantity)),
      remainingFreeUnits,
    );
    if (!discountedUnits) continue;
    const allocation = discountedUnits * Math.max(0, Math.floor(line.unitPricePence));
    allocations.set(line.key, allocation);
    freeUnits.set(line.key, discountedUnits);
    amountPence += allocation;
    remainingFreeUnits -= discountedUnits;
  }

  return { amountPence, allocations, freeUnits, qualifyingQuantity, freeQuantity };
}

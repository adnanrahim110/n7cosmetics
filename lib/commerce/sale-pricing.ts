export interface SalePricingLine {
  key: string;
  quantity: number;
  unitPricePence: number;
}

export interface SalePricingResult {
  amountPence: number;
  allocations: Map<string, number>;
  qualifyingQuantity: number;
  freeQuantity: number;
}

export function calculateBuyXGetYPricing(
  lines: readonly SalePricingLine[],
  groupQuantity: number,
  freePerGroup: number,
): SalePricingResult {
  const qualifyingQuantity = lines.reduce(
    (total, line) => total + Math.max(0, Math.floor(line.quantity)),
    0,
  );
  const safeGroupQuantity = Math.max(2, Math.floor(groupQuantity));
  const safeFreePerGroup = Math.min(
    safeGroupQuantity - 1,
    Math.max(1, Math.floor(freePerGroup)),
  );
  const freeQuantity =
    Math.floor(qualifyingQuantity / safeGroupQuantity) * safeFreePerGroup;
  const allocations = new Map<string, number>();

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
    amountPence += allocation;
    remainingFreeUnits -= discountedUnits;
  }

  return { amountPence, allocations, qualifyingQuantity, freeQuantity };
}

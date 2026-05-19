export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function partsCost(
  usages: { quantity: number; unitCostSnapshot: number }[]
): number {
  return usages.reduce(
    (sum, u) => sum + toNumber(u.quantity) * toNumber(u.unitCostSnapshot),
    0
  );
}

export function repairTotalCost(
  acquisitionCost: number,
  usages: { quantity: number; unitCostSnapshot: number }[]
): number {
  return toNumber(acquisitionCost) + partsCost(usages);
}

export function profit(salePrice: number, totalCost: number): number {
  return toNumber(salePrice) - totalCost;
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(n);
}

import { partsCost, repairTotalCost, profit, toNumber } from "@/lib/calculations";
import { parseFailures } from "@/lib/failures";
import type { Part } from "@/models/Part";
import type { Repair } from "@/models/Repair";
import type { RepairPartUsage } from "@/models/RepairPartUsage";
import type { Sale } from "@/models/Sale";
import {
  canStockExpenseToInventory,
  isRepairLinkedExpense,
} from "@/lib/expenseInventory";
import type { Expense } from "@/models/Expense";

type UsageWithPart = RepairPartUsage & { part?: Part };

export function serializePart(p: Part) {
  return {
    id: p.id,
    name: p.name,
    platform: p.platform,
    category: p.category,
    unitCost: toNumber(p.unitCost),
    stockQuantity: p.stockQuantity,
  };
}

export function serializeUsages(usages: UsageWithPart[]) {
  return usages.map((u) => ({
    id: u.id,
    partId: u.partId,
    quantity: u.quantity,
    unitCostSnapshot: toNumber(u.unitCostSnapshot),
    part: u.part ? serializePart(u.part) : undefined,
  }));
}

export function serializeRepair(r: Repair, usages: UsageWithPart[] = []) {
  const serializedUsages = serializeUsages(usages);
  const totalCost = repairTotalCost(
    toNumber(r.acquisitionCost),
    serializedUsages
  );
  return {
    id: r.id,
    label: r.label,
    platform: r.platform,
    failures: parseFailures(r.failures),
    isCleaned: r.isCleaned,
    status: r.status,
    acquisitionCost: toNumber(r.acquisitionCost),
    color: r.color,
    isSpecialEdition: r.isSpecialEdition,
    notes: r.notes,
    partUsages: serializedUsages,
    totalCost,
  };
}

export function serializeSale(
  s: Sale,
  repair: Repair,
  usages: UsageWithPart[]
) {
  const repairData = serializeRepair(repair, usages);
  const totalCost = repairData.totalCost ?? 0;
  return {
    id: s.id,
    repairId: s.repairId,
    salePrice: toNumber(s.salePrice),
    soldAt: s.soldAt.toISOString(),
    notes: s.notes,
    repair: repairData,
    totalCost,
    profit: profit(toNumber(s.salePrice), totalCost),
  };
}

export function serializeExpense(e: Expense) {
  return {
    id: e.id,
    description: e.description,
    amount: toNumber(e.amount),
    expenseDate: String(e.expenseDate),
    notes: e.notes,
    isTool: e.isTool ?? false,
    inventoryApplied: e.inventoryApplied ?? false,
    canStockToInventory: canStockExpenseToInventory(e),
    isRepairLinked: isRepairLinkedExpense(e),
    partId: e.partId ?? null,
    inventoryPayload: e.inventoryPayload ?? null,
  };
}

export function usageCosts(usages: UsageWithPart[]) {
  return partsCost(
    usages.map((u) => ({
      quantity: u.quantity,
      unitCostSnapshot: toNumber(u.unitCostSnapshot),
    }))
  );
}

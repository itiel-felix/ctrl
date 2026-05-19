import { toNumber } from "@/lib/calculations";
import { getPlatformLabel } from "@/lib/enums";
import type { Repair } from "@/models/Repair";

export function repairExpenseNotes(repairId: number): string {
  return `Reparación #${repairId}`;
}

export function buildRepairAcquisitionDescription(repair: Repair): string {
  const platform = getPlatformLabel(repair.platform);
  const color = repair.color ? ` · ${repair.color}` : "";
  const label = repair.label ? ` (${repair.label})` : "";
  return `Compra control — ${platform}${color}${label}`;
}

export function buildRepairAcquisitionExpensePayloads(
  repairs: Repair[],
  acquisitionCost: number
): Array<{
  description: string;
  amount: number;
  expenseDate: string;
  notes: string;
}> {
  const amount = toNumber(acquisitionCost);
  if (amount <= 0) return [];

  const expenseDate = new Date().toISOString().slice(0, 10);

  return repairs.map((repair) => ({
    description: buildRepairAcquisitionDescription(repair),
    amount,
    expenseDate,
    notes: repairExpenseNotes(repair.id),
  }));
}

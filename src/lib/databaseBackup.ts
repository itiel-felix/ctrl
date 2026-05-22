import { parseInventoryPayload } from "@/lib/expenseInventory";
import { toNumber } from "@/lib/calculations";
import {
  CONSOLE_PLATFORMS,
  PART_CATEGORIES,
  REPAIR_STATUSES,
  type ConsolePlatform,
  type PartCategory,
  type RepairStatus,
} from "@/lib/enums";
import { parseFailures } from "@/lib/failures";
import type { Expense } from "@/models/Expense";
import type { Part } from "@/models/Part";
import type { Repair } from "@/models/Repair";
import type { RepairPartUsage } from "@/models/RepairPartUsage";
import type { Sale } from "@/models/Sale";

export const BACKUP_VERSION = 2;

export interface BackupPartRecord {
  id: number;
  name: string;
  platform: ConsolePlatform;
  category: PartCategory;
  unitCost: number;
  stockQuantity: number;
}

export interface BackupRepairRecord {
  id: number;
  label: string | null;
  platform: ConsolePlatform;
  failures: string[];
  isCleaned: boolean;
  status: RepairStatus;
  acquisitionCost: number;
  color: string | null;
  isSpecialEdition: boolean;
  notes: string | null;
}

export interface BackupUsageRecord {
  id: number;
  repairId: number;
  partId: number;
  quantity: number;
  unitCostSnapshot: number;
}

export interface BackupSaleRecord {
  id: number;
  repairId: number;
  salePrice: number;
  soldAt: string;
  notes: string | null;
}

export interface BackupExpenseRecord {
  id: number;
  description: string;
  amount: number;
  expenseDate: string;
  notes: string | null;
  isTool: boolean;
  inventoryApplied: boolean;
  inventoryPayload: unknown;
  partId: number | null;
}

export interface DatabaseBackupFile {
  version: number;
  exportedAt: string;
  app: "ctrl";
  counts: {
    parts: number;
    repairs: number;
    repairPartUsages: number;
    sales: number;
    expenses: number;
  };
  data: {
    parts: BackupPartRecord[];
    repairs: BackupRepairRecord[];
    repairPartUsages: BackupUsageRecord[];
    sales: BackupSaleRecord[];
    expenses: BackupExpenseRecord[];
  };
}

export interface DatabaseImportResult {
  mode: "replace" | "expenses-only";
  imported: {
    parts: number;
    repairs: number;
    repairPartUsages: number;
    sales: number;
    expenses: number;
  };
  errors: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function exportPart(p: Part): BackupPartRecord {
  return {
    id: p.id,
    name: p.name,
    platform: p.platform,
    category: p.category,
    unitCost: toNumber(p.unitCost),
    stockQuantity: p.stockQuantity,
  };
}

export function exportRepair(r: Repair): BackupRepairRecord {
  return {
    id: r.id,
    label: r.label,
    platform: r.platform,
    failures: parseFailures(r.failures),
    isCleaned: r.isCleaned ?? false,
    status: r.status,
    acquisitionCost: toNumber(r.acquisitionCost),
    color: r.color,
    isSpecialEdition: r.isSpecialEdition ?? false,
    notes: r.notes,
  };
}

export function exportUsage(u: RepairPartUsage): BackupUsageRecord {
  return {
    id: u.id,
    repairId: u.repairId,
    partId: u.partId,
    quantity: u.quantity,
    unitCostSnapshot: toNumber(u.unitCostSnapshot),
  };
}

export function exportSale(s: Sale): BackupSaleRecord {
  return {
    id: s.id,
    repairId: s.repairId,
    salePrice: toNumber(s.salePrice),
    soldAt: s.soldAt.toISOString(),
    notes: s.notes,
  };
}

export function exportExpense(e: Expense): BackupExpenseRecord {
  return {
    id: e.id,
    description: e.description,
    amount: toNumber(e.amount),
    expenseDate: String(e.expenseDate),
    notes: e.notes,
    isTool: e.isTool ?? false,
    inventoryApplied: e.inventoryApplied ?? false,
    inventoryPayload: e.inventoryPayload,
    partId: e.partId ?? null,
  };
}

export function buildDatabaseBackupFile(data: {
  parts: Part[];
  repairs: Repair[];
  repairPartUsages: RepairPartUsage[];
  sales: Sale[];
  expenses: Expense[];
}): DatabaseBackupFile {
  const parts = data.parts.map(exportPart);
  const repairs = data.repairs.map(exportRepair);
  const repairPartUsages = data.repairPartUsages.map(exportUsage);
  const sales = data.sales.map(exportSale);
  const expenses = data.expenses.map(exportExpense);

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: "ctrl",
    counts: {
      parts: parts.length,
      repairs: repairs.length,
      repairPartUsages: repairPartUsages.length,
      sales: sales.length,
      expenses: expenses.length,
    },
    data: { parts, repairs, repairPartUsages, sales, expenses },
  };
}

function parsePlatform(value: unknown): ConsolePlatform | null {
  return typeof value === "string" &&
    (CONSOLE_PLATFORMS as readonly string[]).includes(value)
    ? (value as ConsolePlatform)
    : null;
}

function parseCategory(value: unknown): PartCategory | null {
  return typeof value === "string" &&
    (PART_CATEGORIES as readonly string[]).includes(value)
    ? (value as PartCategory)
    : null;
}

function parseStatus(value: unknown): RepairStatus | null {
  return typeof value === "string" &&
    (REPAIR_STATUSES as readonly string[]).includes(value)
    ? (value as RepairStatus)
    : null;
}

function parsePositiveInt(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1 || !Number.isInteger(n)) return null;
  return n;
}

function parseNonNegativeInt(value: unknown, fallback = 0): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

export function parseDatabaseBackup(raw: unknown): {
  backup: DatabaseBackupFile | null;
  expensesOnly: BackupExpenseRecord[] | null;
  error?: string;
} {
  if (!isRecord(raw)) {
    return { backup: null, expensesOnly: null, error: "JSON inválido" };
  }

  if (raw.version === BACKUP_VERSION && isRecord(raw.data)) {
    const data = raw.data;
    const parts = Array.isArray(data.parts) ? data.parts : [];
    const repairs = Array.isArray(data.repairs) ? data.repairs : [];
    const repairPartUsages = Array.isArray(data.repairPartUsages)
      ? data.repairPartUsages
      : [];
    const sales = Array.isArray(data.sales) ? data.sales : [];
    const expenses = Array.isArray(data.expenses) ? data.expenses : [];

    const errors: string[] = [];

    const parsedParts: BackupPartRecord[] = [];
    parts.forEach((item, i) => {
      if (!isRecord(item)) {
        errors.push(`parts[${i}]: inválido`);
        return;
      }
      const id = parsePositiveInt(item.id);
      const platform = parsePlatform(item.platform);
      const category = parseCategory(item.category);
      const name = typeof item.name === "string" ? item.name.trim() : "";
      if (id == null || !platform || !category || !name) {
        errors.push(`parts[${i}]: datos incompletos`);
        return;
      }
      parsedParts.push({
        id,
        name,
        platform,
        category,
        unitCost: toNumber(item.unitCost),
        stockQuantity: parseNonNegativeInt(item.stockQuantity),
      });
    });

    const parsedRepairs: BackupRepairRecord[] = [];
    repairs.forEach((item, i) => {
      if (!isRecord(item)) {
        errors.push(`repairs[${i}]: inválido`);
        return;
      }
      const id = parsePositiveInt(item.id);
      const platform = parsePlatform(item.platform);
      const status = parseStatus(item.status);
      if (id == null || !platform || !status) {
        errors.push(`repairs[${i}]: datos incompletos`);
        return;
      }
      parsedRepairs.push({
        id,
        label:
          item.label == null || item.label === ""
            ? null
            : String(item.label).trim(),
        platform,
        failures: parseFailures(item.failures),
        isCleaned: item.isCleaned === true,
        status,
        acquisitionCost: toNumber(item.acquisitionCost),
        color:
          item.color == null || item.color === ""
            ? null
            : String(item.color).trim(),
        isSpecialEdition: item.isSpecialEdition === true,
        notes:
          item.notes == null || item.notes === ""
            ? null
            : String(item.notes).trim(),
      });
    });

    const repairIds = new Set(parsedRepairs.map((r) => r.id));
    const partIds = new Set(parsedParts.map((p) => p.id));

    const parsedUsages: BackupUsageRecord[] = [];
    repairPartUsages.forEach((item, i) => {
      if (!isRecord(item)) {
        errors.push(`repairPartUsages[${i}]: inválido`);
        return;
      }
      const id = parsePositiveInt(item.id);
      const repairId = parsePositiveInt(item.repairId);
      const partId = parsePositiveInt(item.partId);
      if (id == null || repairId == null || partId == null) {
        errors.push(`repairPartUsages[${i}]: ids inválidos`);
        return;
      }
      if (!repairIds.has(repairId) || !partIds.has(partId)) {
        errors.push(`repairPartUsages[${i}]: referencia huérfana`);
        return;
      }
      parsedUsages.push({
        id,
        repairId,
        partId,
        quantity: Math.max(1, parseNonNegativeInt(item.quantity, 1)),
        unitCostSnapshot: toNumber(item.unitCostSnapshot),
      });
    });

    const parsedSales: BackupSaleRecord[] = [];
    sales.forEach((item, i) => {
      if (!isRecord(item)) {
        errors.push(`sales[${i}]: inválido`);
        return;
      }
      const id = parsePositiveInt(item.id);
      const repairId = parsePositiveInt(item.repairId);
      if (id == null || repairId == null) {
        errors.push(`sales[${i}]: ids inválidos`);
        return;
      }
      if (!repairIds.has(repairId)) {
        errors.push(`sales[${i}]: reparación no existe`);
        return;
      }
      const soldAt =
        typeof item.soldAt === "string"
          ? item.soldAt
          : new Date().toISOString();
      parsedSales.push({
        id,
        repairId,
        salePrice: toNumber(item.salePrice),
        soldAt,
        notes:
          item.notes == null || item.notes === ""
            ? null
            : String(item.notes).trim(),
      });
    });

    const parsedExpenses: BackupExpenseRecord[] = [];
    expenses.forEach((item, i) => {
      if (!isRecord(item)) {
        errors.push(`expenses[${i}]: inválido`);
        return;
      }
      const id = parsePositiveInt(item.id);
      const description =
        typeof item.description === "string" ? item.description.trim() : "";
      const amount = toNumber(item.amount);
      const expenseDate = String(item.expenseDate ?? "").trim();
      if (id == null || !description || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
        errors.push(`expenses[${i}]: datos inválidos`);
        return;
      }
      const partId =
        item.partId == null ? null : parsePositiveInt(item.partId);
      if (partId != null && !partIds.has(partId)) {
        errors.push(`expenses[${i}]: partId huérfano`);
        return;
      }
      parsedExpenses.push({
        id,
        description,
        amount,
        expenseDate,
        notes:
          item.notes == null || item.notes === ""
            ? null
            : String(item.notes).trim(),
        isTool: item.isTool === true,
        inventoryApplied: item.inventoryApplied === true,
        inventoryPayload: item.inventoryPayload ?? null,
        partId,
      });
    });

    if (
      parsedParts.length === 0 &&
      parsedRepairs.length === 0 &&
      parsedUsages.length === 0 &&
      parsedSales.length === 0 &&
      parsedExpenses.length === 0
    ) {
      return {
        backup: null,
        expensesOnly: null,
        error: "El respaldo no contiene datos",
      };
    }

    if (errors.length > 0) {
      return {
        backup: null,
        expensesOnly: null,
        error: errors.slice(0, 5).join("; "),
      };
    }

    return {
      backup: {
        version: BACKUP_VERSION,
        exportedAt:
          typeof raw.exportedAt === "string"
            ? raw.exportedAt
            : new Date().toISOString(),
        app: "ctrl",
        counts: {
          parts: parsedParts.length,
          repairs: parsedRepairs.length,
          repairPartUsages: parsedUsages.length,
          sales: parsedSales.length,
          expenses: parsedExpenses.length,
        },
        data: {
          parts: parsedParts,
          repairs: parsedRepairs,
          repairPartUsages: parsedUsages,
          sales: parsedSales,
          expenses: parsedExpenses,
        },
      },
      expensesOnly: null,
    };
  }

  const expenseList = Array.isArray(raw)
    ? raw
    : Array.isArray(raw.expenses)
      ? raw.expenses
      : null;

  if (expenseList) {
    const parsed: BackupExpenseRecord[] = [];
    expenseList.forEach((item, i) => {
      if (!isRecord(item)) return;
      const description =
        typeof item.description === "string" ? item.description.trim() : "";
      const amount = toNumber(item.amount);
      const expenseDate = String(item.expenseDate ?? "").slice(0, 10);
      if (!description || amount <= 0) return;
      parsed.push({
        id: parsePositiveInt(item.id) ?? i + 1,
        description,
        amount,
        expenseDate: /^\d{4}-\d{2}-\d{2}$/.test(expenseDate)
          ? expenseDate
          : new Date().toISOString().slice(0, 10),
        notes:
          item.notes == null || item.notes === ""
            ? null
            : String(item.notes).trim(),
        isTool: item.isTool === true,
        inventoryApplied: false,
        inventoryPayload: item.inventoryPayload ?? null,
        partId: null,
      });
    });
    if (parsed.length > 0) {
      return { backup: null, expensesOnly: parsed };
    }
  }

  return {
    backup: null,
    expensesOnly: null,
    error: 'Respaldo no reconocido. Usa un export v2 con "data" o un archivo de gastos.',
  };
}

export async function resetAutoIncrement(
  table: string,
  maxId: number,
  sequelize: { query: (sql: string) => Promise<unknown> }
) {
  await sequelize.query(
    `ALTER TABLE \`${table}\` AUTO_INCREMENT = ${Math.max(1, maxId + 1)}`
  );
}

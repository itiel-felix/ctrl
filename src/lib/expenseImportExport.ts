import {
  parseInventoryPayload,
  type ExpenseInventoryPayload,
} from "@/lib/expenseInventory";
import type { ExpenseDto, ExpenseInventoryPayloadDto } from "@/types";

export const EXPENSE_EXPORT_VERSION = 1;

export interface ExpenseExportRecord {
  description: string;
  amount: number;
  expenseDate: string;
  notes: string | null;
  isTool: boolean;
  inventoryPayload: ExpenseInventoryPayloadDto | null;
  /** Solo referencia al exportar; se ignora al importar */
  id?: number;
  inventoryApplied?: boolean;
  isRepairLinked?: boolean;
}

export interface ExpenseExportFile {
  version: number;
  exportedAt: string;
  app: "ctrl";
  count: number;
  expenses: ExpenseExportRecord[];
}

export interface ExpenseImportRow {
  description: string;
  amount: number;
  expenseDate: string;
  notes: string | null;
  isTool: boolean;
  inventoryPayload: ExpenseInventoryPayload | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseAmount(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

function parseDate(value: unknown): string | null {
  if (value == null || value === "") {
    return new Date().toISOString().slice(0, 10);
  }
  const s = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

export function expenseToExportRecord(e: ExpenseDto): ExpenseExportRecord {
  return {
    id: e.id,
    description: e.description,
    amount: e.amount,
    expenseDate: e.expenseDate,
    notes: e.notes,
    isTool: e.isTool,
    inventoryPayload: e.inventoryPayload,
    inventoryApplied: e.inventoryApplied,
    isRepairLinked: e.isRepairLinked,
  };
}

export function buildExpenseExportFile(expenses: ExpenseDto[]): ExpenseExportFile {
  const records = expenses.map(expenseToExportRecord);
  return {
    version: EXPENSE_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    app: "ctrl",
    count: records.length,
    expenses: records,
  };
}

export function parseExpenseImportPayload(
  raw: unknown
): { rows: ExpenseImportRow[]; error?: string } {
  if (!isRecord(raw)) {
    return { rows: [], error: "JSON inválido: se esperaba un objeto" };
  }

  let list: unknown[] = [];

  if (Array.isArray(raw)) {
    list = raw;
  } else if (Array.isArray(raw.expenses)) {
    list = raw.expenses;
  } else {
    return {
      rows: [],
      error: 'JSON inválido: usa un arreglo "expenses" o un arreglo de gastos',
    };
  }

  const rows: ExpenseImportRow[] = [];
  const errors: string[] = [];

  list.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`Fila ${index + 1}: no es un objeto`);
      return;
    }

    const description =
      typeof item.description === "string" ? item.description.trim() : "";
    const amount = parseAmount(item.amount);
    const expenseDate = parseDate(item.expenseDate);

    if (!description) {
      errors.push(`Fila ${index + 1}: falta description`);
      return;
    }
    if (amount == null) {
      errors.push(`Fila ${index + 1}: amount inválido`);
      return;
    }
    if (!expenseDate) {
      errors.push(`Fila ${index + 1}: expenseDate debe ser YYYY-MM-DD`);
      return;
    }

    const notes =
      item.notes == null || item.notes === ""
        ? null
        : String(item.notes).trim();

    const isTool = item.isTool === true;

    const inventoryPayload = item.inventoryPayload
      ? parseInventoryPayload(item.inventoryPayload)
      : null;

    rows.push({
      description,
      amount,
      expenseDate,
      notes,
      isTool,
      inventoryPayload,
    });
  });

  if (rows.length === 0 && errors.length > 0) {
    return { rows: [], error: errors.slice(0, 5).join("; ") };
  }

  return { rows, error: errors.length > 0 ? errors.slice(0, 3).join("; ") : undefined };
}

export function expenseImportDedupeKey(row: ExpenseImportRow): string {
  return `${row.expenseDate}|${row.description}|${row.amount}`;
}

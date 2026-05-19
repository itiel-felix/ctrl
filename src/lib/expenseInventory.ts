import type { ParsedExpenseConcept } from "@/lib/ai/parseExpenseConcept";
import { toNumber } from "@/lib/calculations";
import type { ConsolePlatform, PartCategory } from "@/lib/enums";
import type { Expense } from "@/models/Expense";
import { Part } from "@/models/Part";
import type { Transaction } from "sequelize";

export type ExpenseInventoryPayload = {
  item: string;
  platform: ConsolePlatform | null;
  category: PartCategory | null;
  quantity: number;
};

const TOOL_KEYWORDS = [
  "herramienta",
  "herramientas",
  "soldador",
  "soldadura",
  "estacion",
  "estaño",
  "estano",
  "flux",
  "destornillador",
  "pinzas",
  "multimetro",
  "multímetro",
  "crimpadora",
  "crimp",
  "tweezer",
  "pinza",
  "broca",
  "taladro",
  "mat",
  "tapete",
  "limpiador",
  "alcohol",
  "breath",
  "aire",
  "compresor",
  "lupa",
  "microscopio",
  "hot air",
  "pistola de calor",
];

export function detectIsTool(text: string): boolean {
  const lower = text.toLowerCase();
  return TOOL_KEYWORDS.some((k) => lower.includes(k));
}

export function isRepairLinkedExpense(expense: Expense): boolean {
  const notes = expense.notes ?? "";
  return /Reparación #\d+/.test(notes);
}

export function canStockExpenseToInventory(expense: Expense): boolean {
  if (expense.isTool) return false;
  if (expense.inventoryApplied) return false;
  if (isRepairLinkedExpense(expense)) return false;
  return true;
}

export function inventoryPayloadFromParsed(
  parsed: ParsedExpenseConcept
): ExpenseInventoryPayload | null {
  if (parsed.isTool || !parsed.platform) return null;
  return {
    item: parsed.item,
    platform: parsed.platform,
    category: parsed.category,
    quantity: parsed.quantity ?? 1,
  };
}

export function parseInventoryPayload(
  raw: unknown
): ExpenseInventoryPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const item = typeof data.item === "string" ? data.item.trim() : "";
  if (!item) return null;

  const platform =
    typeof data.platform === "string" &&
    ["PS4", "PS5", "XBOX_ONE", "XBOX_SERIES", "SWITCH"].includes(data.platform)
      ? (data.platform as ConsolePlatform)
      : null;

  const category =
    typeof data.category === "string" &&
    ["STICK", "MICRO_SWITCH", "OTRO"].includes(data.category)
      ? (data.category as PartCategory)
      : null;

  const quantity =
    data.quantity != null && Number.isFinite(Number(data.quantity))
      ? Math.max(1, Math.floor(Number(data.quantity)))
      : 1;

  return { item, platform, category, quantity };
}

export async function applyExpenseToInventory(
  expense: Expense,
  payload: ExpenseInventoryPayload,
  transaction?: Transaction
): Promise<Part> {
  if (!payload.platform) {
    throw new Error(
      "Indica la plataforma en el concepto (ej. PS4, Xbox) para registrar en inventario"
    );
  }

  const quantity = payload.quantity;
  const totalAmount = toNumber(expense.amount);
  const unitCost =
    quantity > 0 ? Math.round((totalAmount / quantity) * 100) / 100 : totalAmount;

  const category = payload.category ?? "OTRO";
  const partName = payload.item.trim();

  let part = await Part.findOne({
    where: {
      name: partName,
      platform: payload.platform,
      category,
    },
    transaction,
  });

  if (part) {
    part.stockQuantity += quantity;
    if (unitCost > 0) part.unitCost = unitCost;
    await part.save({ transaction });
  } else {
    part = await Part.create(
      {
        name: partName,
        platform: payload.platform,
        category,
        unitCost,
        stockQuantity: quantity,
      },
      { transaction }
    );
  }

  expense.inventoryApplied = true;
  expense.partId = part.id;
  expense.inventoryPayload = payload;
  await expense.save({ transaction });

  return part;
}

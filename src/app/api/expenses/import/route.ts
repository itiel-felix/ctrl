import { NextResponse } from "next/server";
import {
  applyExpenseToInventory,
  isRepairLinkedExpense,
} from "@/lib/expenseInventory";
import {
  expenseImportDedupeKey,
  parseExpenseImportPayload,
  type ExpenseImportRow,
} from "@/lib/expenseImportExport";
import { sequelize } from "@/lib/db";
import { ensureDb } from "@/lib/ensureDb";
import { Expense } from "@/models/index";

export async function POST(request: Request) {
  try {
    await ensureDb();
    const body = await request.json();
    const applyInventory = body.applyInventory === true;
    const skipDuplicates = body.skipDuplicates !== false;

    const { rows, error: parseError } = parseExpenseImportPayload(body);

    if (parseError && rows.length === 0) {
      return NextResponse.json({ error: parseError }, { status: 400 });
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No hay gastos válidos para importar" },
        { status: 400 }
      );
    }

    let existingKeys = new Set<string>();
    if (skipDuplicates) {
      const existing = await Expense.findAll({
        attributes: ["description", "amount", "expenseDate"],
      });
      existingKeys = new Set(
        existing.map((e) =>
          expenseImportDedupeKey({
            description: e.description,
            amount: Number(e.amount),
            expenseDate: String(e.expenseDate),
            notes: e.notes,
            isTool: e.isTool ?? false,
            inventoryPayload: null,
          })
        )
      );
    }

    let imported = 0;
    let skipped = 0;
    const errors: { index: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const key = expenseImportDedupeKey(row);

      if (skipDuplicates && existingKeys.has(key)) {
        skipped++;
        continue;
      }

      try {
        await importOneExpense(row, applyInventory);
        imported++;
        existingKeys.add(key);
      } catch (e) {
        errors.push({
          index: i,
          message: e instanceof Error ? e.message : "Error al importar",
        });
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      errors,
      parseWarning: parseError ?? undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[POST /api/expenses/import]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function importOneExpense(
  row: ExpenseImportRow,
  applyInventory: boolean
): Promise<void> {
  await sequelize.transaction(async (t) => {
    const expense = await Expense.create(
      {
        description: row.description,
        amount: row.amount,
        expenseDate: row.expenseDate,
        notes: row.notes,
        isTool: row.isTool,
        inventoryApplied: false,
        inventoryPayload: row.inventoryPayload,
        partId: null,
      },
      { transaction: t }
    );

    if (isRepairLinkedExpense(expense)) {
      return;
    }

    if (applyInventory && !row.isTool && row.inventoryPayload?.platform) {
      await applyExpenseToInventory(expense, row.inventoryPayload, t);
    }
  });
}

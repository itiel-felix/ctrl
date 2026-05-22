import { NextResponse } from "next/server";
import { reverseExpenseFromInventory } from "@/lib/expenseInventory";
import { sequelize } from "@/lib/db";
import { ensureDb } from "@/lib/ensureDb";
import { Expense } from "@/models/index";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await ensureDb();
    const { id } = await params;
    const expenseId = Number(id);

    const expense = await Expense.findByPk(expenseId);
    if (!expense) {
      return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });
    }

    await sequelize.transaction(async (t) => {
      await reverseExpenseFromInventory(expense, t);
      await expense.destroy({ transaction: t });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[DELETE /api/expenses/[id]]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

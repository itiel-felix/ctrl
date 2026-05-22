import { NextResponse } from "next/server";
import { buildExpenseExportFile } from "@/lib/expenseImportExport";
import { ensureDb } from "@/lib/ensureDb";
import { serializeExpense } from "@/lib/serialize";
import { Expense } from "@/models/index";

export async function GET() {
  try {
    await ensureDb();

    const expenses = await Expense.findAll({
      order: [["expenseDate", "DESC"]],
    });

    const payload = buildExpenseExportFile(expenses.map(serializeExpense));

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="ctrl-gastos-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[GET /api/expenses/export]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

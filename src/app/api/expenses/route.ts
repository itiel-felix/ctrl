import { NextResponse } from "next/server";
import {
  applyExpenseToInventory,
  inventoryPayloadFromParsed,
  isRepairLinkedExpense,
} from "@/lib/expenseInventory";
import type { ParsedExpenseConcept } from "@/lib/ai/parseExpenseConcept";
import { sequelize } from "@/lib/db";
import { ensureDb } from "@/lib/ensureDb";
import { toNumber } from "@/lib/calculations";
import { serializeExpense, serializePart, serializeSale } from "@/lib/serialize";
import { Expense, Part, Repair, RepairPartUsage, Sale } from "@/models/index";

export async function GET() {
  try {
    await ensureDb();

    const [sales, expenses] = await Promise.all([
      Sale.findAll({ order: [["soldAt", "DESC"]] }),
      Expense.findAll({ order: [["expenseDate", "DESC"]] }),
    ]);

    const serializedSales = await Promise.all(
      sales.map(async (s) => {
        const repair = await Repair.findByPk(s.repairId);
        if (!repair) return null;
        const usages = await RepairPartUsage.findAll({
          where: { repairId: repair.id },
          include: [{ model: Part, as: "part" }],
        });
        return serializeSale(s, repair, usages);
      })
    );

    const validSales = serializedSales.filter(
      (s): s is NonNullable<typeof s> => s !== null
    );

    const totalRevenue = validSales.reduce((sum, s) => sum + s.salePrice, 0);
    const totalProfit = validSales.reduce((sum, s) => sum + (s.profit ?? 0), 0);
    const totalExpenses = expenses.reduce(
      (sum, e) => sum + toNumber(e.amount),
      0
    );

    // Balance neto = efectivo entrado por ventas − todo lo gastado.
    // Así un saldo ≥ 0 significa que ya recuperaste lo invertido (en conjunto).
    // La ganancia bruta sigue siendo margen por control vendido (venta − costo del control).
    const netBalance = totalRevenue - totalExpenses;

    return NextResponse.json({
      sales: validSales,
      expenses: expenses.map(serializeExpense),
      summary: {
        totalSales: validSales.length,
        totalRevenue,
        totalProfit,
        totalExpenses,
        netBalance,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[GET /api/expenses]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDb();
    const body = await request.json();
    const { description, amount, expenseDate, notes, parsed: rawParsed } = body;

    if (!description || amount === undefined) {
      return NextResponse.json(
        { error: "description y amount son requeridos" },
        { status: 400 }
      );
    }

    const parsed = rawParsed as ParsedExpenseConcept | undefined;
    const isTool = parsed?.isTool === true;
    const inventoryPayload = parsed
      ? inventoryPayloadFromParsed(parsed)
      : null;

    const { expense, part } = await sequelize.transaction(async (t) => {
      const created = await Expense.create(
        {
          description,
          amount,
          expenseDate: expenseDate ?? new Date().toISOString().slice(0, 10),
          notes: notes ?? null,
          isTool,
          inventoryApplied: false,
          inventoryPayload,
          partId: null,
        },
        { transaction: t }
      );

      if (isRepairLinkedExpense(created)) {
        return { expense: created, part: null };
      }

      if (!isTool && inventoryPayload) {
        const stockedPart = await applyExpenseToInventory(
          created,
          inventoryPayload,
          t
        );
        return { expense: created, part: stockedPart };
      }

      return { expense: created, part: null };
    });

    return NextResponse.json(
      {
        expense: serializeExpense(expense),
        part: part ? serializePart(part) : null,
      },
      { status: 201 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[POST /api/expenses]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

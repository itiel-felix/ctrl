import { NextResponse } from "next/server";
import { parseExpenseConcept } from "@/lib/ai/parseExpenseConcept";
import {
  applyExpenseToInventory,
  canStockExpenseToInventory,
  inventoryPayloadFromParsed,
  parseInventoryPayload,
} from "@/lib/expenseInventory";
import { sequelize } from "@/lib/db";
import { ensureDb } from "@/lib/ensureDb";
import { serializeExpense, serializePart } from "@/lib/serialize";
import { Expense } from "@/models/index";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    await ensureDb();
    const { id } = await params;
    const expense = await Expense.findByPk(Number(id));

    if (!expense) {
      return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });
    }

    if (!canStockExpenseToInventory(expense)) {
      if (expense.isTool) {
        return NextResponse.json(
          { error: "Las herramientas no se registran en inventario de repuestos" },
          { status: 400 }
        );
      }
      if (expense.inventoryApplied) {
        return NextResponse.json(
          { error: "Este gasto ya está en inventario" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Este gasto no puede registrarse en inventario" },
        { status: 400 }
      );
    }

    let payload = parseInventoryPayload(expense.inventoryPayload);

    if (!payload) {
      const parsed = await parseExpenseConcept(
        `${expense.description}\n${expense.notes ?? ""}`
      );
      if (parsed.isTool) {
        expense.isTool = true;
        await expense.save();
        return NextResponse.json(
          { error: "Detectado como herramienta; no aplica inventario" },
          { status: 400 }
        );
      }
      payload = inventoryPayloadFromParsed(parsed);
    }

    if (!payload) {
      return NextResponse.json(
        {
          error:
            "No se pudo determinar plataforma o repuesto. Registra el gasto de nuevo con un concepto como «5 joystick PS4».",
        },
        { status: 400 }
      );
    }

    const part = await sequelize.transaction((t) =>
      applyExpenseToInventory(expense, payload!, t)
    );

    await expense.reload();

    return NextResponse.json({
      expense: serializeExpense(expense),
      part: serializePart(part),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[POST /api/expenses/[id]/stock]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

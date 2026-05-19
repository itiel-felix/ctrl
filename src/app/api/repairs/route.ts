import { NextResponse } from "next/server";
import { toNumber } from "@/lib/calculations";
import { sequelize } from "@/lib/db";
import { ensureDb } from "@/lib/ensureDb";
import { buildRepairAcquisitionExpensePayloads } from "@/lib/repairExpenses";
import { serializeExpense, serializeRepair } from "@/lib/serialize";
import { Expense, Part, Repair, RepairPartUsage } from "@/models/index";
import type { RepairStatus } from "@/lib/enums";
import { validateFailures } from "@/lib/failures";

export async function GET(request: Request) {
  try {
    await ensureDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as RepairStatus | null;

    const where = status ? { status } : undefined;
    const repairs = await Repair.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    const result = await Promise.all(
      repairs.map(async (r) => {
        const usages = await RepairPartUsage.findAll({
          where: { repairId: r.id },
          include: [{ model: Part, as: "part" }],
        });
        return serializeRepair(r, usages);
      })
    );

    return NextResponse.json({ repairs: result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[GET /api/repairs]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDb();
    const body = await request.json();
    const {
      label,
      platform,
      failures,
      isCleaned,
      status,
      acquisitionCost,
      color,
      isSpecialEdition,
      notes,
      quantity: rawQuantity,
    } = body;

    if (!platform) {
      return NextResponse.json(
        { error: "platform es requerido" },
        { status: 400 }
      );
    }

    const parsedFailures = validateFailures(failures, platform);

    if (!parsedFailures) {
      return NextResponse.json(
        { error: "Selecciona al menos una falla válida para esta consola" },
        { status: 400 }
      );
    }

    const quantity = Math.min(
      Math.max(1, Math.floor(Number(rawQuantity) || 1)),
      50
    );
    const baseLabel =
      typeof label === "string" && label.trim() ? label.trim() : null;
    const colorValue =
      typeof color === "string" && color.trim() ? color.trim() : null;

    const cost = toNumber(acquisitionCost ?? 0);

    const { repairs, expenses } = await sequelize.transaction(async (t) => {
      const created = await Repair.bulkCreate(
        Array.from({ length: quantity }, (_, index) => ({
          label:
            baseLabel && quantity > 1 && index > 0
              ? `${baseLabel} · ${index + 1}`
              : baseLabel,
          platform,
          failures: parsedFailures,
          isCleaned: isCleaned ?? false,
          status: status ?? "PENDIENTE",
          acquisitionCost: cost,
          color: colorValue,
          isSpecialEdition: isSpecialEdition ?? false,
          notes: notes ?? null,
        })),
        { transaction: t }
      );

      const expensePayloads = buildRepairAcquisitionExpensePayloads(
        created,
        cost
      );
      const createdExpenses =
        expensePayloads.length > 0
          ? await Expense.bulkCreate(expensePayloads, { transaction: t })
          : [];

      return { repairs: created, expenses: createdExpenses };
    });

    const serialized = repairs.map((repair) => serializeRepair(repair, []));

    return NextResponse.json(
      {
        repair: serialized[0],
        repairs: serialized,
        quantity: serialized.length,
        expenses: expenses.map(serializeExpense),
      },
      { status: 201 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[POST /api/repairs]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

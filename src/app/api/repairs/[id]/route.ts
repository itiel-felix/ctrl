import { NextResponse } from "next/server";
import { ensureDb } from "@/lib/ensureDb";
import { toNumber } from "@/lib/calculations";
import { serializeRepair } from "@/lib/serialize";
import { sequelize } from "@/lib/db";
import {
  filterFailuresForPlatform,
  parseFailures,
  validateFailures,
} from "@/lib/failures";
import { isPartCompatibleWithRepair } from "@/lib/partCompatibility";
import { repairExpenseNotes } from "@/lib/repairExpenses";
import { Expense, Part, Repair, RepairPartUsage, Sale } from "@/models/index";

type Params = { params: Promise<{ id: string }> };

async function loadRepair(id: number) {
  const repair = await Repair.findByPk(id);
  if (!repair) return null;
  const usages = await RepairPartUsage.findAll({
    where: { repairId: id },
    include: [{ model: Part, as: "part" }],
  });
  return { repair, usages };
}

export async function GET(_request: Request, { params }: Params) {
  try {
    await ensureDb();
    const { id } = await params;
    const data = await loadRepair(Number(id));
    if (!data) {
      return NextResponse.json({ error: "Reparación no encontrada" }, { status: 404 });
    }
    return NextResponse.json({
      repair: serializeRepair(data.repair, data.usages),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[GET /api/repairs/[id]]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await ensureDb();
    const { id } = await params;
    const repairId = Number(id);
    const data = await loadRepair(repairId);
    if (!data) {
      return NextResponse.json({ error: "Reparación no encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const { repair: repairFields, addPart } = body;

    if (repairFields) {
      const r = data.repair;
      if (repairFields.label !== undefined) r.label = repairFields.label;
      if (repairFields.platform !== undefined) r.platform = repairFields.platform;
      if (repairFields.failures !== undefined) {
        const platform = repairFields.platform ?? r.platform;
        const parsed = validateFailures(repairFields.failures, platform);
        if (!parsed) {
          return NextResponse.json(
            { error: "Selecciona al menos una falla válida para esta consola" },
            { status: 400 }
          );
        }
        r.failures = parsed;
      }
      if (repairFields.platform !== undefined && repairFields.failures === undefined) {
        r.failures = filterFailuresForPlatform(
          parseFailures(r.failures),
          repairFields.platform
        );
      }
      if (repairFields.isCleaned !== undefined) r.isCleaned = repairFields.isCleaned;
      if (repairFields.status !== undefined) r.status = repairFields.status;
      if (repairFields.acquisitionCost !== undefined) {
        r.acquisitionCost = repairFields.acquisitionCost;
      }
      if (repairFields.color !== undefined) r.color = repairFields.color;
      if (repairFields.isSpecialEdition !== undefined) {
        r.isSpecialEdition = repairFields.isSpecialEdition;
      }
      if (repairFields.notes !== undefined) r.notes = repairFields.notes;
      await r.save();
    }

    if (addPart) {
      const { partId, quantity = 1 } = addPart;
      const part = await Part.findByPk(partId);
      if (!part) {
        return NextResponse.json({ error: "Repuesto no encontrado" }, { status: 404 });
      }
      if (part.stockQuantity < quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente (${part.stockQuantity} disponibles)` },
          { status: 400 }
        );
      }

      if (!isPartCompatibleWithRepair(part, data.repair.platform)) {
        return NextResponse.json(
          { error: "Este repuesto no es compatible con la consola del control" },
          { status: 400 }
        );
      }

      await sequelize.transaction(async (t) => {
        await RepairPartUsage.create(
          {
            repairId,
            partId,
            quantity,
            unitCostSnapshot: toNumber(part.unitCost),
          },
          { transaction: t }
        );
        part.stockQuantity -= quantity;
        await part.save({ transaction: t });
        if (data.repair.status === "PENDIENTE") {
          data.repair.status = "EN_REPARACION";
          await data.repair.save({ transaction: t });
        }
      });
    }

    const updated = await loadRepair(repairId);
    return NextResponse.json({
      repair: serializeRepair(updated!.repair, updated!.usages),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[PATCH /api/repairs/[id]]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await ensureDb();
    const { id } = await params;
    const repairId = Number(id);
    const repair = await Repair.findByPk(repairId);
    if (!repair) {
      return NextResponse.json({ error: "Reparación no encontrada" }, { status: 404 });
    }

    let expensesDeleted = 0;

    await sequelize.transaction(async (t) => {
      const usages = await RepairPartUsage.findAll({
        where: { repairId },
        transaction: t,
      });

      for (const usage of usages) {
        const part = await Part.findByPk(usage.partId, { transaction: t });
        if (part) {
          part.stockQuantity += usage.quantity;
          await part.save({ transaction: t });
        }
      }

      await RepairPartUsage.destroy({ where: { repairId }, transaction: t });
      expensesDeleted = await Expense.destroy({
        where: { notes: repairExpenseNotes(repairId) },
        transaction: t,
      });
      await Sale.destroy({ where: { repairId }, transaction: t });
      await repair.destroy({ transaction: t });
    });

    return NextResponse.json({ ok: true, expensesDeleted });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[DELETE /api/repairs/[id]]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

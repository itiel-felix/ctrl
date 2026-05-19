import { NextResponse } from "next/server";
import { ensureDb } from "@/lib/ensureDb";
import { serializeSale } from "@/lib/serialize";
import { Part, Repair, RepairPartUsage, Sale } from "@/models/index";

export async function GET() {
  try {
    await ensureDb();
    const sales = await Sale.findAll({ order: [["soldAt", "DESC"]] });

    const result = await Promise.all(
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

    return NextResponse.json({
      sales: result.filter(Boolean),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[GET /api/sales]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDb();
    const body = await request.json();
    const { repairId, salePrice, soldAt, notes } = body;

    if (!repairId || salePrice === undefined) {
      return NextResponse.json(
        { error: "repairId y salePrice son requeridos" },
        { status: 400 }
      );
    }

    const repair = await Repair.findByPk(repairId);
    if (!repair) {
      return NextResponse.json({ error: "Reparación no encontrada" }, { status: 404 });
    }
    if (repair.status === "VENDIDO") {
      return NextResponse.json(
        { error: "Este control ya fue vendido" },
        { status: 400 }
      );
    }

    const existing = await Sale.findOne({ where: { repairId } });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una venta para este control" },
        { status: 400 }
      );
    }

    const sale = await Sale.create({
      repairId,
      salePrice,
      soldAt: soldAt ? new Date(soldAt) : new Date(),
      notes: notes ?? null,
    });

    repair.status = "VENDIDO";
    await repair.save();

    const usages = await RepairPartUsage.findAll({
      where: { repairId: repair.id },
      include: [{ model: Part, as: "part" }],
    });

    return NextResponse.json(
      { sale: serializeSale(sale, repair, usages) },
      { status: 201 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[POST /api/sales]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

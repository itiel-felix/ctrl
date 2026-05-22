import { NextResponse } from "next/server";
import { sequelize } from "@/lib/db";
import { ensureDb } from "@/lib/ensureDb";
import { Repair, Sale } from "@/models/index";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await ensureDb();
    const { id } = await params;
    const saleId = Number(id);

    const sale = await Sale.findByPk(saleId);
    if (!sale) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    }

    await sequelize.transaction(async (t) => {
      const repair = await Repair.findByPk(sale.repairId, { transaction: t });
      await sale.destroy({ transaction: t });
      if (repair && repair.status === "VENDIDO") {
        repair.status = "LISTO";
        await repair.save({ transaction: t });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[DELETE /api/sales/[id]]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { ensureDb } from "@/lib/ensureDb";
import { serializePart } from "@/lib/serialize";
import { Part } from "@/models/Part";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    await ensureDb();
    const { id } = await params;
    const part = await Part.findByPk(Number(id));
    if (!part) {
      return NextResponse.json({ error: "Repuesto no encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const { name, platform, category, unitCost, stockQuantity } = body;

    if (name !== undefined) part.name = name;
    if (platform !== undefined) part.platform = platform;
    if (category !== undefined) part.category = category;
    if (unitCost !== undefined) part.unitCost = unitCost;
    if (stockQuantity !== undefined) part.stockQuantity = stockQuantity;

    await part.save();
    return NextResponse.json({ part: serializePart(part) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[PATCH /api/parts/[id]]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await ensureDb();
    const { id } = await params;
    const part = await Part.findByPk(Number(id));
    if (!part) {
      return NextResponse.json({ error: "Repuesto no encontrado" }, { status: 404 });
    }
    await part.destroy();
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[DELETE /api/parts/[id]]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

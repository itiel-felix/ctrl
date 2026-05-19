import { NextResponse } from "next/server";
import { ensureDb } from "@/lib/ensureDb";
import { DEFAULT_PARTS } from "@/lib/seedParts";
import { serializePart } from "@/lib/serialize";
import { Part } from "@/models/Part";

export async function GET() {
  try {
    await ensureDb();
    const parts = await Part.findAll({
      order: [
        ["platform", "ASC"],
        ["category", "ASC"],
        ["name", "ASC"],
      ],
    });
    return NextResponse.json({ parts: parts.map(serializePart) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[GET /api/parts]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDb();
    const body = await request.json();
    const { name, platform, category, unitCost, stockQuantity } = body;

    if (!name || !platform || !category) {
      return NextResponse.json(
        { error: "name, platform y category son requeridos" },
        { status: 400 }
      );
    }

    const part = await Part.create({
      name,
      platform,
      category,
      unitCost: unitCost ?? 0,
      stockQuantity: stockQuantity ?? 0,
    });

    return NextResponse.json({ part: serializePart(part) }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[POST /api/parts]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Carga repuestos predeterminados si el inventario está vacío */
export async function PUT() {
  try {
    await ensureDb();
    const count = await Part.count();
    if (count > 0) {
      return NextResponse.json(
        { error: "El inventario ya tiene repuestos" },
        { status: 400 }
      );
    }
    const parts = await Part.bulkCreate(
      DEFAULT_PARTS.map((p) => ({
        ...p,
        unitCost: 0,
        stockQuantity: 0,
      }))
    );
    return NextResponse.json({ parts: parts.map(serializePart) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[PUT /api/parts seed]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

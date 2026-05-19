import { NextResponse } from "next/server";
import { parseExpenseConcept } from "@/lib/ai/parseExpenseConcept";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const concept =
      typeof body.concept === "string" ? body.concept.trim() : "";

    if (!concept) {
      return NextResponse.json(
        { error: "concept es requerido" },
        { status: 400 }
      );
    }

    const parsed = await parseExpenseConcept(concept);

    return NextResponse.json({ parsed });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al interpretar";
    console.error("[POST /api/expenses/parse]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

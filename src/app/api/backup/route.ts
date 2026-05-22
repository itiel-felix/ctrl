import { NextResponse } from "next/server";
import { clearAllDatabase } from "@/lib/clearDatabase";
import { sequelize } from "@/lib/db";
import { ensureDb } from "@/lib/ensureDb";
import {
  Expense,
  Part,
  Repair,
  RepairPartUsage,
  Sale,
} from "@/models/index";

const CONFIRM_PHRASE = "BORRAR TODO";

export async function DELETE(request: Request) {
  try {
    await ensureDb();
    const body = await request.json().catch(() => ({}));
    const confirm =
      typeof body.confirm === "string" ? body.confirm.trim() : "";

    if (confirm !== CONFIRM_PHRASE) {
      return NextResponse.json(
        {
          error: `Escribe exactamente «${CONFIRM_PHRASE}» para confirmar`,
        },
        { status: 400 }
      );
    }

    const [parts, repairs, usages, sales, expenses] = await Promise.all([
      Part.count(),
      Repair.count(),
      RepairPartUsage.count(),
      Sale.count(),
      Expense.count(),
    ]);

    await sequelize.transaction(async (t) => {
      await clearAllDatabase(t);
    });

    return NextResponse.json({
      ok: true,
      deleted: {
        parts,
        repairs,
        repairPartUsages: usages,
        sales,
        expenses,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[DELETE /api/backup]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

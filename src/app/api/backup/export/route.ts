import { NextResponse } from "next/server";
import { buildDatabaseBackupFile } from "@/lib/databaseBackup";
import { ensureDb } from "@/lib/ensureDb";
import {
  Expense,
  Part,
  Repair,
  RepairPartUsage,
  Sale,
} from "@/models/index";

export async function GET() {
  try {
    await ensureDb();

    const [parts, repairs, repairPartUsages, sales, expenses] =
      await Promise.all([
        Part.findAll({ order: [["id", "ASC"]] }),
        Repair.findAll({ order: [["id", "ASC"]] }),
        RepairPartUsage.findAll({ order: [["id", "ASC"]] }),
        Sale.findAll({ order: [["id", "ASC"]] }),
        Expense.findAll({ order: [["id", "ASC"]] }),
      ]);

    const payload = buildDatabaseBackupFile({
      parts,
      repairs,
      repairPartUsages,
      sales,
      expenses,
    });

    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="ctrl-backup-${date}.json"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[GET /api/backup/export]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

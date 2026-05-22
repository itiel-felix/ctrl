import { NextResponse } from "next/server";
import type { Transaction } from "sequelize";
import { clearAllDatabase } from "@/lib/clearDatabase";
import {
  parseDatabaseBackup,
  resetAutoIncrement,
  type DatabaseBackupFile,
} from "@/lib/databaseBackup";
import { parseInventoryPayload } from "@/lib/expenseInventory";
import type { FailureCode } from "@/lib/failures";
import { sequelize } from "@/lib/db";
import { ensureDb } from "@/lib/ensureDb";
import {
  Expense,
  Part,
  Repair,
  RepairPartUsage,
  Sale,
} from "@/models/index";

export async function POST(request: Request) {
  try {
    await ensureDb();
    const body = await request.json();
    const { backup, expensesOnly, error } = parseDatabaseBackup(body);

    if (error && !backup && !expensesOnly) {
      return NextResponse.json({ error }, { status: 400 });
    }

    if (expensesOnly && !backup) {
      return NextResponse.json(
        {
          error:
            "Este archivo solo contiene gastos. Usa un respaldo completo (versión 2) para restaurar toda la base.",
        },
        { status: 400 }
      );
    }

    if (!backup) {
      return NextResponse.json({ error: "Respaldo inválido" }, { status: 400 });
    }

    const replace = body.replace !== false;

    await sequelize.transaction(async (t) => {
      if (replace) {
        await clearAllDatabase(t);
      }
      await restoreBackupRows(backup, t);
    });

    await syncAutoIncrements(backup);

    return NextResponse.json({
      mode: "replace" as const,
      imported: backup.counts,
      errors: [],
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[POST /api/backup/import]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function restoreBackupRows(
  backup: DatabaseBackupFile,
  transaction: Transaction
) {
  const { parts, repairs, repairPartUsages, sales, expenses } = backup.data;

  for (const p of parts) {
    await Part.create(
      {
        id: p.id,
        name: p.name,
        platform: p.platform,
        category: p.category,
        unitCost: p.unitCost,
        stockQuantity: p.stockQuantity,
      },
      { transaction }
    );
  }

  for (const r of repairs) {
    await Repair.create(
      {
        id: r.id,
        label: r.label,
        platform: r.platform,
        failures: r.failures as FailureCode[],
        isCleaned: r.isCleaned,
        status: r.status,
        acquisitionCost: r.acquisitionCost,
        color: r.color,
        isSpecialEdition: r.isSpecialEdition,
        notes: r.notes,
      },
      { transaction }
    );
  }

  for (const u of repairPartUsages) {
    await RepairPartUsage.create(
      {
        id: u.id,
        repairId: u.repairId,
        partId: u.partId,
        quantity: u.quantity,
        unitCostSnapshot: u.unitCostSnapshot,
      },
      { transaction }
    );
  }

  for (const s of sales) {
    await Sale.create(
      {
        id: s.id,
        repairId: s.repairId,
        salePrice: s.salePrice,
        soldAt: new Date(s.soldAt),
        notes: s.notes,
      },
      { transaction }
    );
  }

  for (const e of expenses) {
    const payload = parseInventoryPayload(e.inventoryPayload);
    await Expense.create(
      {
        id: e.id,
        description: e.description,
        amount: e.amount,
        expenseDate: e.expenseDate,
        notes: e.notes,
        isTool: e.isTool,
        inventoryApplied: e.inventoryApplied,
        inventoryPayload: payload,
        partId: e.partId,
      },
      { transaction }
    );
  }

}

async function syncAutoIncrements(backup: DatabaseBackupFile) {
  const { parts, repairs, repairPartUsages, sales, expenses } = backup.data;
  const max = (ids: number[]) => (ids.length ? Math.max(...ids) : 0);

  await resetAutoIncrement("parts", max(parts.map((p) => p.id)), sequelize);
  await resetAutoIncrement("repairs", max(repairs.map((r) => r.id)), sequelize);
  await resetAutoIncrement(
    "repair_part_usages",
    max(repairPartUsages.map((u) => u.id)),
    sequelize
  );
  await resetAutoIncrement("sales", max(sales.map((s) => s.id)), sequelize);
  await resetAutoIncrement(
    "expenses",
    max(expenses.map((e) => e.id)),
    sequelize
  );
}

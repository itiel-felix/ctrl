import type { Transaction } from "sequelize";
import {
  Expense,
  Part,
  Repair,
  RepairPartUsage,
  Sale,
} from "@/models/index";

export async function clearAllDatabase(transaction?: Transaction) {
  const opts = transaction ? { transaction } : {};
  await Sale.destroy({ where: {}, ...opts });
  await RepairPartUsage.destroy({ where: {}, ...opts });
  await Expense.destroy({ where: {}, ...opts });
  await Repair.destroy({ where: {}, ...opts });
  await Part.destroy({ where: {}, ...opts });
}

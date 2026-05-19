import { DataTypes, Model, type Optional } from "sequelize";
import { sequelize } from "@/lib/db";
import type { ExpenseInventoryPayload } from "@/lib/expenseInventory";

export interface ExpenseAttrs {
  id: number;
  description: string;
  amount: number;
  expenseDate: string;
  notes: string | null;
  isTool: boolean;
  inventoryApplied: boolean;
  inventoryPayload: ExpenseInventoryPayload | null;
  partId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ExpenseCreationAttrs = Optional<
  ExpenseAttrs,
  | "id"
  | "expenseDate"
  | "notes"
  | "isTool"
  | "inventoryApplied"
  | "inventoryPayload"
  | "partId"
  | "createdAt"
  | "updatedAt"
>;

export class Expense extends Model<ExpenseAttrs, ExpenseCreationAttrs> {
  declare id: number;
  declare description: string;
  declare amount: number;
  declare expenseDate: string;
  declare notes: string | null;
  declare isTool: boolean;
  declare inventoryApplied: boolean;
  declare inventoryPayload: ExpenseInventoryPayload | null;
  declare partId: number | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Expense.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    description: { type: DataTypes.STRING(200), allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    expenseDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "expense_date",
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    isTool: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_tool",
    },
    inventoryApplied: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "inventory_applied",
    },
    inventoryPayload: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "inventory_payload",
    },
    partId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "part_id",
    },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at" },
  },
  { sequelize, tableName: "expenses", timestamps: true, underscored: true }
);

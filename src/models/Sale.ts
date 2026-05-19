import { DataTypes, Model, type Optional } from "sequelize";
import { sequelize } from "@/lib/db";

export interface SaleAttrs {
  id: number;
  repairId: number;
  salePrice: number;
  soldAt: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SaleCreationAttrs = Optional<
  SaleAttrs,
  "id" | "soldAt" | "notes" | "createdAt" | "updatedAt"
>;

export class Sale extends Model<SaleAttrs, SaleCreationAttrs> {
  declare id: number;
  declare repairId: number;
  declare salePrice: number;
  declare soldAt: Date;
  declare notes: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Sale.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    repairId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      field: "repair_id",
    },
    salePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "sale_price",
    },
    soldAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "sold_at",
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at" },
  },
  { sequelize, tableName: "sales", timestamps: true, underscored: true }
);

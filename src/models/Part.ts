import { DataTypes, Model, type Optional } from "sequelize";
import { sequelize } from "@/lib/db";
import type { ConsolePlatform, PartCategory } from "@/lib/enums";

export interface PartAttrs {
  id: number;
  name: string;
  platform: ConsolePlatform;
  category: PartCategory;
  unitCost: number;
  stockQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export type PartCreationAttrs = Optional<
  PartAttrs,
  "id" | "stockQuantity" | "createdAt" | "updatedAt"
>;

export class Part extends Model<PartAttrs, PartCreationAttrs> {
  declare id: number;
  declare name: string;
  declare platform: ConsolePlatform;
  declare category: PartCategory;
  declare unitCost: number;
  declare stockQuantity: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Part.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(150), allowNull: false },
    platform: {
      type: DataTypes.ENUM(
        "PS4",
        "PS5",
        "XBOX_ONE",
        "XBOX_SERIES",
        "SWITCH"
      ),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM("STICK", "MICRO_SWITCH", "OTRO"),
      allowNull: false,
      defaultValue: "STICK",
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: "unit_cost",
    },
    stockQuantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: "stock_quantity",
    },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at" },
  },
  { sequelize, tableName: "parts", timestamps: true, underscored: true }
);

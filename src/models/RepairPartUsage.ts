import { DataTypes, Model, type Optional } from "sequelize";
import { sequelize } from "@/lib/db";

export interface RepairPartUsageAttrs {
  id: number;
  repairId: number;
  partId: number;
  quantity: number;
  unitCostSnapshot: number;
  createdAt: Date;
  updatedAt: Date;
}

export type RepairPartUsageCreationAttrs = Optional<
  RepairPartUsageAttrs,
  "id" | "createdAt" | "updatedAt"
>;

export class RepairPartUsage extends Model<
  RepairPartUsageAttrs,
  RepairPartUsageCreationAttrs
> {
  declare id: number;
  declare repairId: number;
  declare partId: number;
  declare quantity: number;
  declare unitCostSnapshot: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

RepairPartUsage.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    repairId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "repair_id",
    },
    partId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "part_id",
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    unitCostSnapshot: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "unit_cost_snapshot",
    },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at" },
  },
  {
    sequelize,
    tableName: "repair_part_usages",
    timestamps: true,
    underscored: true,
  }
);

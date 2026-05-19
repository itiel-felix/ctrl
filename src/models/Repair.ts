import { DataTypes, Model, type Optional } from "sequelize";
import { sequelize } from "@/lib/db";
import type { ConsolePlatform, FailureCode, RepairStatus } from "@/lib/enums";

export interface RepairAttrs {
  id: number;
  label: string | null;
  platform: ConsolePlatform;
  failures: FailureCode[];
  isCleaned: boolean;
  status: RepairStatus;
  acquisitionCost: number;
  color: string | null;
  isSpecialEdition: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type RepairCreationAttrs = Optional<
  RepairAttrs,
  | "id"
  | "label"
  | "failures"
  | "isCleaned"
  | "status"
  | "acquisitionCost"
  | "color"
  | "isSpecialEdition"
  | "notes"
  | "createdAt"
  | "updatedAt"
>;

export class Repair extends Model<RepairAttrs, RepairCreationAttrs> {
  declare id: number;
  declare label: string | null;
  declare platform: ConsolePlatform;
  declare failures: FailureCode[];
  declare isCleaned: boolean;
  declare status: RepairStatus;
  declare acquisitionCost: number;
  declare color: string | null;
  declare isSpecialEdition: boolean;
  declare notes: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Repair.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    label: { type: DataTypes.STRING(80), allowNull: true },
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
    failures: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    isCleaned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_cleaned",
    },
    status: {
      type: DataTypes.ENUM(
        "PENDIENTE",
        "EN_REPARACION",
        "LISTO",
        "VENDIDO",
        "CANCELADO"
      ),
      allowNull: false,
      defaultValue: "PENDIENTE",
    },
    acquisitionCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: "acquisition_cost",
    },
    color: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    isSpecialEdition: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_special_edition",
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at" },
  },
  { sequelize, tableName: "repairs", timestamps: true, underscored: true }
);

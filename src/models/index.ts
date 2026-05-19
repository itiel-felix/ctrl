import { Part } from "./Part";
import { Repair } from "./Repair";
import { RepairPartUsage } from "./RepairPartUsage";
import { Sale } from "./Sale";
import { Expense } from "./Expense";

Repair.hasMany(RepairPartUsage, { foreignKey: "repairId", as: "partUsages" });
RepairPartUsage.belongsTo(Repair, { foreignKey: "repairId" });

Part.hasMany(RepairPartUsage, { foreignKey: "partId", as: "usages" });
RepairPartUsage.belongsTo(Part, { foreignKey: "partId", as: "part" });

Repair.hasOne(Sale, { foreignKey: "repairId", as: "sale" });
Sale.belongsTo(Repair, { foreignKey: "repairId", as: "repair" });

export { Part, Repair, RepairPartUsage, Sale, Expense };

import type {
  ConsolePlatform,
  FailureCode,
  PartCategory,
  RepairStatus,
} from "@/lib/enums";

export interface PartDto {
  id: number;
  name: string;
  platform: ConsolePlatform;
  category: PartCategory;
  unitCost: number;
  stockQuantity: number;
}

export interface RepairPartUsageDto {
  id: number;
  partId: number;
  quantity: number;
  unitCostSnapshot: number;
  part?: PartDto;
}

export interface RepairDto {
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
  partUsages?: RepairPartUsageDto[];
  totalCost?: number;
  sale?: SaleDto | null;
}

export interface SaleDto {
  id: number;
  repairId: number;
  salePrice: number;
  soldAt: string;
  notes: string | null;
  repair?: RepairDto;
  totalCost?: number;
  profit?: number;
}

export interface ExpenseInventoryPayloadDto {
  item: string;
  platform: string | null;
  category: string | null;
  quantity: number;
}

export interface ExpenseDto {
  id: number;
  description: string;
  amount: number;
  expenseDate: string;
  notes: string | null;
  isTool: boolean;
  inventoryApplied: boolean;
  canStockToInventory: boolean;
  isRepairLinked: boolean;
  partId: number | null;
  inventoryPayload: ExpenseInventoryPayloadDto | null;
}

export interface FinanceSummary {
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  totalExpenses: number;
  netBalance: number;
}

export interface ExpenseImportResult {
  imported: number;
  skipped: number;
  errors: { index: number; message: string }[];
  parseWarning?: string;
}

export interface DatabaseImportResult {
  mode: "replace" | "expenses-only";
  imported: {
    parts: number;
    repairs: number;
    repairPartUsages: number;
    sales: number;
    expenses: number;
  };
  errors: string[];
}

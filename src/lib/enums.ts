export const CONSOLE_PLATFORMS = [
  "PS4",
  "PS5",
  "XBOX_ONE",
  "XBOX_SERIES",
  "SWITCH",
] as const;

export type ConsolePlatform = (typeof CONSOLE_PLATFORMS)[number];

export const REPAIR_STATUSES = [
  "PENDIENTE",
  "EN_REPARACION",
  "LISTO",
  "VENDIDO",
  "CANCELADO",
] as const;

export type RepairStatus = (typeof REPAIR_STATUSES)[number];

export const PART_CATEGORIES = ["STICK", "MICRO_SWITCH", "OTRO"] as const;

export type PartCategory = (typeof PART_CATEGORIES)[number];

export const PLATFORM_LABELS: Record<ConsolePlatform, string> = {
  PS4: "PlayStation 4",
  PS5: "PlayStation 5",
  XBOX_ONE: "Xbox One",
  XBOX_SERIES: "Xbox Series X|S",
  SWITCH: "Nintendo Switch (Joy-Con)",
};

const LEGACY_PLATFORM_LABELS: Record<string, string> = {
  XBOX_ONE_SERIES: "Xbox One (migrado desde registro antiguo)",
};

export function getPlatformLabel(platform: string): string {
  if (platform in PLATFORM_LABELS) {
    return PLATFORM_LABELS[platform as ConsolePlatform];
  }
  return LEGACY_PLATFORM_LABELS[platform] ?? platform;
}

export const STATUS_LABELS: Record<RepairStatus, string> = {
  PENDIENTE: "Pendiente",
  EN_REPARACION: "En reparación",
  LISTO: "Listo",
  VENDIDO: "Vendido",
  CANCELADO: "Cancelado",
};

export const CATEGORY_LABELS: Record<PartCategory, string> = {
  STICK: "Stick analógico",
  MICRO_SWITCH: "Micro switch (RB/LB)",
  OTRO: "Otro",
};

export type { FailureCode } from "@/lib/platformFailures";
export {
  FAILURE_CODES,
  FAILURE_LABELS,
  getFailureSelectGroups,
  filterFailuresForPlatform,
} from "@/lib/platformFailures";

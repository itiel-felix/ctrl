import type { ConsolePlatform } from "@/lib/enums";

export const QUICK_PRICES = [100, 200, 300] as const;
export const PRICE_INCREMENT = 50;

export const QUICK_QUANTITIES = [1, 2, 3, 5] as const;
export const MAX_REPAIR_QUANTITY = 50;

export function clampRepairQuantity(value: number): number {
  if (!Number.isFinite(value) || value < 1) return 1;
  return Math.min(Math.floor(value), MAX_REPAIR_QUANTITY);
}

export type ColorOption = {
  id: string;
  label: string;
  swatch: string;
};

export const COLORS_BY_PLATFORM: Record<ConsolePlatform, ColorOption[]> = {
  PS4: [
    { id: "blanco", label: "Blanco", swatch: "#e8e8e8" },
    { id: "negro", label: "Negro", swatch: "#1c1c1c" },
    { id: "rojo", label: "Rojo", swatch: "#b91c1c" },
    { id: "camuflaje", label: "Camuflaje", swatch: "#4b5e3c" },
    { id: "azul_plata", label: "Azul plata", swatch: "#7b8fa8" },
  ],
  PS5: [
    { id: "blanco", label: "Blanco", swatch: "#f0f0f0" },
    { id: "negro", label: "Negro", swatch: "#121212" },
  ],
  XBOX_ONE: [
    { id: "blanco", label: "Blanco", swatch: "#ececec" },
    { id: "negro", label: "Negro", swatch: "#1a1a1a" },
  ],
  XBOX_SERIES: [
    { id: "blanco", label: "Blanco", swatch: "#f5f5f5" },
    { id: "negro", label: "Negro", swatch: "#141414" },
    { id: "rojo", label: "Rojo", swatch: "#dc2626" },
    { id: "azul", label: "Azul", swatch: "#2563eb" },
    { id: "verde", label: "Verde", swatch: "#16a34a" },
    { id: "rosa", label: "Rosa", swatch: "#ec4899" },
  ],
  SWITCH: [
    { id: "gris", label: "Gris", swatch: "#6b7280" },
    { id: "rojo", label: "Rojo", swatch: "#dc2626" },
    { id: "azul", label: "Azul", swatch: "#2563eb" },
    { id: "blanco", label: "Blanco", swatch: "#f3f4f6" },
  ],
};

export function getColorsForPlatform(platform: ConsolePlatform): ColorOption[] {
  return COLORS_BY_PLATFORM[platform];
}

export function isColorValidForPlatform(
  color: string | null,
  platform: ConsolePlatform
): boolean {
  if (!color) return false;
  return COLORS_BY_PLATFORM[platform].some((c) => c.label === color);
}

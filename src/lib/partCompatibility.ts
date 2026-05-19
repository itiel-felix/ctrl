import type { ConsolePlatform, PartCategory } from "@/lib/enums";
import type { PartDto } from "@/types";

/** Sticks Xbox One ↔ Series comparten el mismo módulo analógico. */
const XBOX_STICK_PLATFORMS: ConsolePlatform[] = ["XBOX_ONE", "XBOX_SERIES"];

export function getCompatiblePlatformsForPart(
  repairPlatform: ConsolePlatform,
  partCategory: PartCategory
): ConsolePlatform[] {
  if (
    partCategory === "STICK" &&
    (repairPlatform === "XBOX_ONE" || repairPlatform === "XBOX_SERIES")
  ) {
    return XBOX_STICK_PLATFORMS;
  }
  return [repairPlatform];
}

export function isPartCompatibleWithRepair(
  part: Pick<PartDto, "platform" | "category">,
  repairPlatform: ConsolePlatform
): boolean {
  return getCompatiblePlatformsForPart(repairPlatform, part.category).includes(
    part.platform
  );
}

export function filterPartsForRepair(
  parts: PartDto[],
  repairPlatform: ConsolePlatform
): PartDto[] {
  return parts.filter((p) => isPartCompatibleWithRepair(p, repairPlatform));
}

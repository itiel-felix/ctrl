import type { ConsolePlatform, PartCategory } from "@/lib/enums";
import type { PartDto } from "@/types";

/** Xbox One y Series comparten sticks y micro switches RB/LB. */
const XBOX_SHARED_PLATFORMS: ConsolePlatform[] = ["XBOX_ONE", "XBOX_SERIES"];

const XBOX_CROSS_COMPAT_CATEGORIES: PartCategory[] = ["STICK", "MICRO_SWITCH"];

function isXboxPlatform(platform: ConsolePlatform): boolean {
  return platform === "XBOX_ONE" || platform === "XBOX_SERIES";
}

export function getCompatiblePlatformsForPart(
  repairPlatform: ConsolePlatform,
  partCategory: PartCategory
): ConsolePlatform[] {
  if (
    isXboxPlatform(repairPlatform) &&
    XBOX_CROSS_COMPAT_CATEGORIES.includes(partCategory)
  ) {
    return XBOX_SHARED_PLATFORMS;
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

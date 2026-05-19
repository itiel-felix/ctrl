import type { ConsolePlatform } from "@/lib/enums";
import {
  FAILURE_CODES,
  FAILURE_LABELS,
  filterFailuresForPlatform,
  normalizeFailuresForPlatform,
  resolveFailureCode,
  type FailureCode,
} from "@/lib/platformFailures";

export type { FailureCode };
export { FAILURE_CODES, FAILURE_LABELS, filterFailuresForPlatform };

export function parseFailures(
  value: unknown,
  platform?: ConsolePlatform
): FailureCode[] {
  if (!Array.isArray(value)) return [];
  const parsed = value.filter(
    (v): v is FailureCode =>
      typeof v === "string" && (FAILURE_CODES as readonly string[]).includes(v)
  );
  if (!platform) return parsed;
  return normalizeFailuresForPlatform(parsed, platform);
}

export function validateFailures(
  failures: unknown,
  platform: ConsolePlatform
): FailureCode[] | null {
  if (!Array.isArray(failures) || failures.length === 0) return null;

  const parsed: FailureCode[] = [];
  for (const item of failures) {
    if (typeof item !== "string") return null;
    const resolved = resolveFailureCode(item, platform);
    if (!resolved) return null;
    parsed.push(resolved);
  }
  return normalizeFailuresForPlatform(parsed, platform);
}

export function formatFailuresList(codes: FailureCode[]): string {
  return codes.map((c) => FAILURE_LABELS[c]).join(", ");
}

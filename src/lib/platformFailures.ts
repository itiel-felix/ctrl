import type { ConsolePlatform } from "@/lib/enums";

/** Sticks — todas las consolas (drift y/o sin respuesta en una sola opción) */
const STICK_FAILURES = ["STICK_LEFT", "STICK_RIGHT"] as const;

const LEGACY_STICK_CODES = [
  "STICK_LEFT_DRIFT",
  "STICK_LEFT_NO_RESPONSE",
  "STICK_RIGHT_DRIFT",
  "STICK_RIGHT_NO_RESPONSE",
] as const;

/** Códigos antiguos de sticks → opción unificada */
export const STICK_FAILURE_ALIASES: Record<
  (typeof LEGACY_STICK_CODES)[number],
  (typeof STICK_FAILURES)[number]
> = {
  STICK_LEFT_DRIFT: "STICK_LEFT",
  STICK_LEFT_NO_RESPONSE: "STICK_LEFT",
  STICK_RIGHT_DRIFT: "STICK_RIGHT",
  STICK_RIGHT_NO_RESPONSE: "STICK_RIGHT",
};

/** PlayStation 4 / 5 */
const PS_FAILURES = [
  ...STICK_FAILURES,
  "R1_NO_RESPONSE",
  "R2_NO_RESPONSE",
  "L1_NO_RESPONSE",
  "L2_NO_RESPONSE",
  "DPAD_NO_RESPONSE",
  "FACE_BUTTONS_PS",
] as const;

/** Xbox One / Series */
const XBOX_FAILURES = [
  ...STICK_FAILURES,
  "RB_NO_RESPONSE",
  "LB_NO_RESPONSE",
  "RT_NO_RESPONSE",
  "LT_NO_RESPONSE",
  "DPAD_NO_RESPONSE",
  "FACE_BUTTONS_XBOX",
] as const;

/** Nintendo Switch (Joy-Con / Pro) */
const SWITCH_FAILURES = [
  ...STICK_FAILURES,
  "SL_NO_RESPONSE",
  "SR_NO_RESPONSE",
  "ZL_NO_RESPONSE",
  "ZR_NO_RESPONSE",
  "DPAD_NO_RESPONSE",
  "MINUS_NO_RESPONSE",
  "PLUS_NO_RESPONSE",
  "HOME_NO_RESPONSE",
  "CAPTURE_NO_RESPONSE",
  "FACE_BUTTONS_SWITCH",
] as const;

const LEGACY_CODES = [
  "FACE_BUTTONS_NO_RESPONSE",
  ...LEGACY_STICK_CODES,
] as const;
export type LegacyFailureCode = (typeof LEGACY_CODES)[number];

export type PsFailureCode = (typeof PS_FAILURES)[number];
export type XboxFailureCode = (typeof XBOX_FAILURES)[number];
export type SwitchFailureCode = (typeof SWITCH_FAILURES)[number];

export type FailureCode =
  | PsFailureCode
  | XboxFailureCode
  | SwitchFailureCode
  | LegacyFailureCode;

export const FAILURE_CODES = [
  ...new Set([
    ...PS_FAILURES,
    ...XBOX_FAILURES,
    ...SWITCH_FAILURES,
    ...LEGACY_CODES,
  ]),
] as FailureCode[];

export const FAILURE_LABELS: Record<FailureCode, string> = {
  STICK_LEFT: "Stick izq. con drift / no responde",
  STICK_RIGHT: "Stick der. con drift / no responde",
  STICK_LEFT_DRIFT: "Stick izq. con drift / no responde",
  STICK_LEFT_NO_RESPONSE: "Stick izq. con drift / no responde",
  STICK_RIGHT_DRIFT: "Stick der. con drift / no responde",
  STICK_RIGHT_NO_RESPONSE: "Stick der. con drift / no responde",
  R1_NO_RESPONSE: "R1 no responde",
  R2_NO_RESPONSE: "R2 / gatillo derecho no responde",
  L1_NO_RESPONSE: "L1 no responde",
  L2_NO_RESPONSE: "L2 / gatillo izquierdo no responde",
  RB_NO_RESPONSE: "RB no responde",
  LB_NO_RESPONSE: "LB no responde",
  RT_NO_RESPONSE: "RT / gatillo derecho no responde",
  LT_NO_RESPONSE: "LT / gatillo izquierdo no responde",
  SL_NO_RESPONSE: "SL (botón lateral) no responde",
  SR_NO_RESPONSE: "SR (botón lateral) no responde",
  ZL_NO_RESPONSE: "ZL no responde",
  ZR_NO_RESPONSE: "ZR no responde",
  DPAD_NO_RESPONSE: "Cruceta / D-pad no responde",
  MINUS_NO_RESPONSE: "Botón − no responde",
  PLUS_NO_RESPONSE: "Botón + no responde",
  HOME_NO_RESPONSE: "Botón Home no responde",
  CAPTURE_NO_RESPONSE: "Botón Captura no responde",
  FACE_BUTTONS_PS: "Botones de acción (△ / ○ / × / □) no funcionan",
  FACE_BUTTONS_XBOX: "Botones de acción (A / B / X / Y) no funcionan",
  FACE_BUTTONS_SWITCH: "Botones de acción (A / B / X / Y) no funcionan",
  /** Códigos antiguos (compatibilidad con registros previos) */
  FACE_BUTTONS_NO_RESPONSE: "Botones de acción no funcionan",
};

type FailureGroupDef = { label: string; codes: readonly FailureCode[] };

const PS_GROUPS: FailureGroupDef[] = [
  { label: "Sticks analógicos", codes: STICK_FAILURES },
  {
    label: "Bumpers y gatillos",
    codes: ["R1_NO_RESPONSE", "R2_NO_RESPONSE", "L1_NO_RESPONSE", "L2_NO_RESPONSE"],
  },
  {
    label: "Otros",
    codes: ["DPAD_NO_RESPONSE", "FACE_BUTTONS_PS"],
  },
];

const XBOX_GROUPS: FailureGroupDef[] = [
  { label: "Sticks analógicos", codes: STICK_FAILURES },
  {
    label: "Bumpers y gatillos",
    codes: ["RB_NO_RESPONSE", "LB_NO_RESPONSE", "RT_NO_RESPONSE", "LT_NO_RESPONSE"],
  },
  {
    label: "Otros",
    codes: ["DPAD_NO_RESPONSE", "FACE_BUTTONS_XBOX"],
  },
];

const SWITCH_GROUPS: FailureGroupDef[] = [
  { label: "Sticks (Joy-Con)", codes: STICK_FAILURES },
  {
    label: "Botones superiores",
    codes: ["SL_NO_RESPONSE", "SR_NO_RESPONSE", "ZL_NO_RESPONSE", "ZR_NO_RESPONSE"],
  },
  {
    label: "Otros",
    codes: [
      "DPAD_NO_RESPONSE",
      "MINUS_NO_RESPONSE",
      "PLUS_NO_RESPONSE",
      "HOME_NO_RESPONSE",
      "CAPTURE_NO_RESPONSE",
      "FACE_BUTTONS_SWITCH",
    ],
  },
];

const GROUPS_BY_PLATFORM: Record<ConsolePlatform, FailureGroupDef[]> = {
  PS4: PS_GROUPS,
  PS5: PS_GROUPS,
  XBOX_ONE: XBOX_GROUPS,
  XBOX_SERIES: XBOX_GROUPS,
  SWITCH: SWITCH_GROUPS,
};

const CODES_BY_PLATFORM: Record<ConsolePlatform, readonly FailureCode[]> = {
  PS4: PS_FAILURES,
  PS5: PS_FAILURES,
  XBOX_ONE: XBOX_FAILURES,
  XBOX_SERIES: XBOX_FAILURES,
  SWITCH: SWITCH_FAILURES,
};

export function getFailureCodesForPlatform(
  platform: ConsolePlatform
): readonly FailureCode[] {
  return CODES_BY_PLATFORM[platform];
}

export function getFailureSelectGroups(platform: ConsolePlatform) {
  return GROUPS_BY_PLATFORM[platform].map((g) => ({
    value: g.label,
    items: g.codes.map((code) => ({
      value: code,
      label: FAILURE_LABELS[code],
    })),
  }));
}

export function resolveFailureCode(
  code: string,
  platform: ConsolePlatform
): FailureCode | null {
  const mapped =
    code in STICK_FAILURE_ALIASES
      ? STICK_FAILURE_ALIASES[code as keyof typeof STICK_FAILURE_ALIASES]
      : code;
  if (isFailureValidForPlatform(mapped, platform)) {
    return mapped as FailureCode;
  }
  if ((LEGACY_CODES as readonly string[]).includes(code)) {
    return code as LegacyFailureCode;
  }
  return null;
}

export function normalizeFailuresForPlatform(
  failures: FailureCode[],
  platform: ConsolePlatform
): FailureCode[] {
  const allowed = new Set(getFailureCodesForPlatform(platform));
  const seen = new Set<FailureCode>();
  const result: FailureCode[] = [];

  for (const code of failures) {
    const resolved = resolveFailureCode(code, platform);
    if (!resolved || !allowed.has(resolved) || seen.has(resolved)) continue;
    seen.add(resolved);
    result.push(resolved);
  }

  return result;
}

export function filterFailuresForPlatform(
  failures: FailureCode[],
  platform: ConsolePlatform
): FailureCode[] {
  return normalizeFailuresForPlatform(failures, platform);
}

export function isFailureValidForPlatform(
  code: string,
  platform: ConsolePlatform
): code is FailureCode {
  return (CODES_BY_PLATFORM[platform] as readonly string[]).includes(code);
}

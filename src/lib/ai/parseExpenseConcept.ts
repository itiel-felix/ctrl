import {
  CONSOLE_PLATFORMS,
  PLATFORM_LABELS,
  type ConsolePlatform,
  type PartCategory,
} from "@/lib/enums";
import { detectIsTool } from "@/lib/expenseInventory";
import { getAiClient, getAiModel } from "@/lib/ai/client";

export type ParsedExpenseConcept = {
  raw: string;
  item: string;
  platform: ConsolePlatform | null;
  platformLabel: string | null;
  quantity: number | null;
  category: PartCategory | null;
  description: string;
  notes: string;
  isTool: boolean;
  source: "ai" | "fallback";
};

const PLATFORM_ALIASES: Record<string, ConsolePlatform> = {
  ps4: "PS4",
  ps5: "PS5",
  playstation4: "PS4",
  playstation5: "PS5",
  xboxone: "XBOX_ONE",
  xboxseries: "XBOX_SERIES",
  xbox: "XBOX_ONE",
  series: "XBOX_SERIES",
  switch: "SWITCH",
  joycon: "SWITCH",
};

const CATEGORY_KEYWORDS: Record<PartCategory, string[]> = {
  STICK: [
    "stick",
    "sticks",
    "joystick",
    "joysticks",
    "analogico",
    "analógico",
    "thumbstick",
  ],
  MICRO_SWITCH: [
    "micro",
    "switch",
    "microswitch",
    "rb",
    "lb",
    "bumper",
    "gatillo",
  ],
  OTRO: [],
};

function detectPlatform(text: string): ConsolePlatform | null {
  const lower = text.toLowerCase();
  if (/\bps\s*4\b|playstation\s*4|ps4\b/.test(lower)) return "PS4";
  if (/\bps\s*5\b|playstation\s*5|ps5\b/.test(lower)) return "PS5";
  if (/xbox\s*series|series\s*x|series\s*s/.test(lower)) return "XBOX_SERIES";
  if (/xbox\s*one|xboxone/.test(lower)) return "XBOX_ONE";
  if (/switch|joy-?con|joycon/.test(lower)) return "SWITCH";

  for (const [alias, code] of Object.entries(PLATFORM_ALIASES)) {
    if (lower.includes(alias)) return code;
  }
  return null;
}

function detectCategory(text: string): PartCategory {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    PartCategory,
    string[],
  ][]) {
    if (category === "OTRO") continue;
    if (keywords.some((k) => lower.includes(k))) return category;
  }
  return "OTRO";
}

function titleCase(text: string): string {
  return text
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function buildFormatted(parsed: {
  item: string;
  platform: ConsolePlatform | null;
  quantity: number | null;
  category: PartCategory | null;
}): { description: string; notes: string } {
  const platformLabel = parsed.platform
    ? PLATFORM_LABELS[parsed.platform]
    : null;

  const lines = [
    parsed.item,
    platformLabel ? `Plataforma: ${platformLabel}` : null,
    parsed.quantity != null ? `Cantidad: ${parsed.quantity}` : null,
    parsed.category && parsed.category !== "OTRO"
      ? `Categoría: ${parsed.category}`
      : null,
  ].filter(Boolean) as string[];

  const descriptionParts = [parsed.item];
  if (parsed.platform) descriptionParts.push(PLATFORM_LABELS[parsed.platform]);
  if (parsed.quantity != null) descriptionParts.push(`×${parsed.quantity}`);

  return {
    description: descriptionParts.join(" — "),
    notes: lines.join("\n"),
  };
}

export function parseExpenseConceptFallback(
  concept: string
): ParsedExpenseConcept {
  const raw = concept.trim();
  const qtyMatch = raw.match(/^(\d+)\s+/);
  const quantity = qtyMatch ? Number(qtyMatch[1]) : null;
  let remainder = qtyMatch ? raw.slice(qtyMatch[0].length).trim() : raw;

  const platform = detectPlatform(remainder);
  if (platform) {
    remainder = remainder
      .replace(/\bps\s*4\b/gi, "")
      .replace(/\bps\s*5\b/gi, "")
      .replace(/playstation\s*[45]/gi, "")
      .replace(/xbox\s*(one|series)?/gi, "")
      .replace(/series\s*[xs]/gi, "")
      .replace(/switch|joy-?con/gi, "")
      .trim();
  }

  const item = titleCase(remainder || raw);
  const category = detectCategory(raw);

  const { description, notes } = buildFormatted({
    item,
    platform,
    quantity,
    category,
  });

  return {
    raw,
    item,
    platform,
    platformLabel: platform ? PLATFORM_LABELS[platform] : null,
    quantity,
    category,
    description,
    notes,
    isTool: detectIsTool(raw),
    source: "fallback",
  };
}

type AiParseResult = {
  item?: string;
  platformCode?: string | null;
  quantity?: number | null;
  category?: string | null;
  isTool?: boolean;
};

function normalizeAiResult(
  raw: string,
  data: AiParseResult
): ParsedExpenseConcept {
  const platform =
    data.platformCode &&
    (CONSOLE_PLATFORMS as readonly string[]).includes(data.platformCode)
      ? (data.platformCode as ConsolePlatform)
      : detectPlatform(raw);

  const item = titleCase(String(data.item ?? "").trim() || raw);
  const quantity =
    data.quantity != null && Number.isFinite(Number(data.quantity))
      ? Math.max(0, Math.floor(Number(data.quantity)))
      : null;

  const category =
    data.category &&
    (["STICK", "MICRO_SWITCH", "OTRO"] as const).includes(
      data.category as PartCategory
    )
      ? (data.category as PartCategory)
      : detectCategory(raw);

  const { description, notes } = buildFormatted({
    item,
    platform,
    quantity,
    category,
  });

  const isTool =
    data.isTool === true || detectIsTool(`${raw} ${item}`);

  return {
    raw,
    item,
    platform,
    platformLabel: platform ? PLATFORM_LABELS[platform] : null,
    quantity,
    category,
    description,
    notes,
    isTool,
    source: "ai",
  };
}

const SYSTEM_PROMPT = `Eres un asistente para un negocio de reparación de controles de videojuegos en México.
Interpretas conceptos cortos de gastos o compras de repuestos y devuelves JSON estricto.

Plataformas válidas (platformCode): PS4, PS5, XBOX_ONE, XBOX_SERIES, SWITCH o null.
Categorías válidas (category): STICK (sticks/joysticks/analógicos), MICRO_SWITCH (micro switches, RB/LB), OTRO.
isTool: true si es herramienta de taller (soldador, destornillador, pinzas, multímetro, estación, etc.), NO repuesto.

Reglas:
- Extrae cantidad numérica si aparece (ej. "5 joystick PS4" → quantity: 5).
- item: nombre del producto en español, capitalizado (ej. "Joystick").
- platformCode: consola relacionada si se menciona (null para herramientas).
- isTool true → no va a inventario de repuestos.
- No inventes datos que no estén en el texto.`;

export async function parseExpenseConcept(
  concept: string
): Promise<ParsedExpenseConcept> {
  const raw = concept.trim();
  if (!raw) {
    throw new Error("Escribe un concepto para interpretar");
  }

  const client = getAiClient();
  if (!client) {
    return parseExpenseConceptFallback(raw);
  }

  try {
    const response = await client.chat.completions.create({
      model: getAiModel(),
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Concepto: "${raw}"\n\nResponde JSON: { "item": string, "platformCode": string|null, "quantity": number|null, "category": "STICK"|"MICRO_SWITCH"|"OTRO", "isTool": boolean }`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Respuesta vacía del modelo");

    const data = JSON.parse(content) as AiParseResult;
    return normalizeAiResult(raw, data);
  } catch {
    return parseExpenseConceptFallback(raw);
  }
}

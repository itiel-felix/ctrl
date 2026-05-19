import type { ConsolePlatform, PartCategory } from "@/lib/enums";

export const DEFAULT_PARTS: {
  name: string;
  platform: ConsolePlatform;
  category: PartCategory;
}[] = [
  { name: "Stick analógico", platform: "PS4", category: "STICK" },
  { name: "Stick analógico", platform: "PS5", category: "STICK" },
  { name: "Stick analógico", platform: "XBOX_ONE", category: "STICK" },
  { name: "Stick analógico", platform: "XBOX_SERIES", category: "STICK" },
  { name: "Stick Joy-Con", platform: "SWITCH", category: "STICK" },
  {
    name: "Micro switch RB/LB",
    platform: "XBOX_ONE",
    category: "MICRO_SWITCH",
  },
  {
    name: "Micro switch RB/LB",
    platform: "XBOX_SERIES",
    category: "MICRO_SWITCH",
  },
];

"use client";

import { CONSOLE_PLATFORMS, PLATFORM_LABELS, type ConsolePlatform } from "@/lib/enums";
import { ChipButton } from "@/components/ui/ChipButton";

type Props = {
  value: ConsolePlatform;
  onChange: (platform: ConsolePlatform) => void;
};

export function PlatformPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {CONSOLE_PLATFORMS.map((p) => (
        <ChipButton
          key={p}
          selected={value === p}
          onClick={() => onChange(p)}
        >
          {PLATFORM_LABELS[p]}
        </ChipButton>
      ))}
    </div>
  );
}

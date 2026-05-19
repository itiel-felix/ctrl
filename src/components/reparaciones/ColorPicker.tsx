"use client";

import { getColorsForPlatform } from "@/lib/controllerOptions";
import type { ConsolePlatform } from "@/lib/enums";
import { ChipButton } from "@/components/ui/ChipButton";

type Props = {
  platform: ConsolePlatform;
  color: string | null;
  isSpecialEdition: boolean;
  specialNote: string;
  onColorChange: (color: string | null) => void;
  onSpecialChange: (isSpecial: boolean, note: string) => void;
};

export function ColorPicker({
  platform,
  color,
  isSpecialEdition,
  specialNote,
  onColorChange,
  onSpecialChange,
}: Props) {
  const options = getColorsForPlatform(platform);

  function selectColor(label: string) {
    onSpecialChange(false, "");
    onColorChange(label);
  }

  function toggleSpecial() {
    if (isSpecialEdition) {
      onSpecialChange(false, "");
      onColorChange(null);
    } else {
      onSpecialChange(true, specialNote);
      onColorChange(specialNote.trim() || "Especial");
    }
  }

  return (
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1 flex flex-wrap gap-2">
        {options.map((opt) => (
          <ChipButton
            key={opt.id}
            selected={!isSpecialEdition && color === opt.label}
            disabled={isSpecialEdition}
            onClick={() => selectColor(opt.label)}
            className="flex items-center gap-2"
          >
            <span
              className="inline-block h-3 w-3 rounded-full border border-white/20"
              style={{ backgroundColor: opt.swatch }}
            />
            {opt.label}
          </ChipButton>
        ))}
      </div>

      <div className="flex w-[7.5rem] shrink-0 flex-col gap-2">
        <ChipButton
          selected={isSpecialEdition}
          onClick={toggleSpecial}
          className="w-full border-amber-600/50"
        >
          Especial
        </ChipButton>
        {isSpecialEdition && (
          <input
            value={specialNote}
            onChange={(e) => {
              const note = e.target.value;
              onSpecialChange(true, note);
              onColorChange(note.trim() || "Especial");
            }}
            placeholder="Edición o color"
            className="w-full border-amber-600/40 text-sm"
          />
        )}
      </div>
    </div>
  );
}

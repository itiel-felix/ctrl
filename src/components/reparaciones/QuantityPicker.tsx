"use client";

import {
  MAX_REPAIR_QUANTITY,
  QUICK_QUANTITIES,
  clampRepairQuantity,
} from "@/lib/controllerOptions";
import { ChipButton } from "@/components/ui/ChipButton";

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export function QuantityPicker({ value, onChange }: Props) {
  const qty = clampRepairQuantity(value);

  function setQuantity(next: number) {
    onChange(clampRepairQuantity(next));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {QUICK_QUANTITIES.map((n) => (
          <ChipButton
            key={n}
            selected={qty === n}
            onClick={() => setQuantity(n)}
          >
            {n}
          </ChipButton>
        ))}
        <ChipButton
          disabled={qty >= MAX_REPAIR_QUANTITY}
          onClick={() => setQuantity(qty + 1)}
        >
          +1
        </ChipButton>
      </div>
      <div className="flex items-center gap-2">
        <label className="mb-0 shrink-0 text-sm text-[var(--muted)]">
          Otro:
        </label>
        <input
          type="number"
          step="1"
          min={1}
          max={MAX_REPAIR_QUANTITY}
          value={qty}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="max-w-[100px]"
        />
      </div>
      {qty > 1 && (
        <p className="text-xs text-[var(--muted)]">
          Se registrarán {qty} controles iguales (cada uno con su propio
          registro).
        </p>
      )}
    </div>
  );
}

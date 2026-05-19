"use client";

import { PRICE_INCREMENT, QUICK_PRICES } from "@/lib/controllerOptions";
import { formatMoney } from "@/lib/calculations";
import { ChipButton } from "@/components/ui/ChipButton";
import { MoneyInput } from "@/components/ui/MoneyInput";

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export function QuickPricePicker({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {QUICK_PRICES.map((price) => (
          <ChipButton
            key={price}
            selected={value === price}
            onClick={() => onChange(price)}
          >
            {formatMoney(price)}
          </ChipButton>
        ))}
        <ChipButton onClick={() => onChange(value + PRICE_INCREMENT)}>
          +{PRICE_INCREMENT}
        </ChipButton>
      </div>
      <div className="flex items-center gap-2">
        <label className="mb-0 shrink-0 text-sm text-[var(--muted)]">
          Otro:
        </label>
        <MoneyInput
          step="1"
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          wrapperClassName="max-w-[140px]"
          placeholder="0"
        />
      </div>
    </div>
  );
}

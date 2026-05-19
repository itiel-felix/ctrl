"use client";

import { useEffect, useMemo } from "react";
import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import type { ConsolePlatform } from "@/lib/enums";
import {
  FAILURE_LABELS,
  filterFailuresForPlatform,
  getFailureSelectGroups,
  type FailureCode,
} from "@/lib/platformFailures";

type Props = {
  platform: ConsolePlatform;
  value: FailureCode[];
  onChange: (value: FailureCode[]) => void;
  id?: string;
  disabled?: boolean;
};

const triggerClass =
  "flex w-full min-h-10 items-center justify-between gap-2 rounded-lg border border-[var(--card-border)] bg-[#0f1419] px-3 py-2.5 text-left text-sm text-[var(--foreground)] outline-none hover:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50 data-[popup-open]:border-[var(--accent)]";

const itemClass =
  "grid cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-4 pl-2.5 text-sm leading-snug outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-[var(--accent)]";

function renderValue(selected: FailureCode[]) {
  if (selected.length === 0) {
    return "Selecciona las fallas...";
  }
  const first = FAILURE_LABELS[selected[0]] ?? selected[0];
  const more =
    selected.length > 1 ? ` (+${selected.length - 1} más)` : "";
  return first + more;
}

export function FailureMultiSelect({
  platform,
  value,
  onChange,
  id,
  disabled,
}: Props) {
  const groups = useMemo(
    () => getFailureSelectGroups(platform),
    [platform]
  );

  const filteredValue = useMemo(
    () => filterFailuresForPlatform(value, platform),
    [value, platform]
  );

  useEffect(() => {
    if (filteredValue.length !== value.length) {
      onChange(filteredValue);
    }
  }, [filteredValue, value, onChange]);

  return (
    <Select.Root
      key={platform}
      id={id}
      multiple
      disabled={disabled}
      value={filteredValue}
      onValueChange={(next) => onChange(next as FailureCode[])}
      items={groups}
    >
      <Select.Trigger className={triggerClass}>
        <Select.Value
          className={`min-w-0 flex-1 truncate ${filteredValue.length === 0 ? "text-[var(--muted)]" : ""}`}
        >
          {renderValue}
        </Select.Value>
        <Select.Icon className="flex shrink-0 text-[var(--muted)]">
          <ChevronDown size={16} />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner
          className="z-50 outline-none"
          sideOffset={6}
          alignItemWithTrigger={false}
        >
          <Select.Popup className="min-w-[var(--anchor-width)] max-h-[var(--available-height)] origin-[var(--transform-origin)] overflow-y-auto rounded-lg border border-[var(--card-border)] bg-[var(--card)] py-1 shadow-xl transition-[transform,opacity] data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0">
            <Select.List className="outline-none">
              {groups.map((group, index) => (
                <div key={group.value}>
                  <Select.Group>
                    <Select.GroupLabel className="sticky top-0 z-[1] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {group.value}
                    </Select.GroupLabel>
                    {group.items.map((item) => (
                      <Select.Item
                        key={item.value}
                        value={item.value}
                        className={itemClass}
                      >
                        <Select.ItemIndicator className="col-start-1">
                          <Check size={12} className="text-[var(--accent)]" />
                        </Select.ItemIndicator>
                        <Select.ItemText className="col-start-2">
                          {item.label}
                        </Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Group>
                  {index < groups.length - 1 ? (
                    <Select.Separator className="mx-3 my-1 h-px bg-[var(--card-border)]" />
                  ) : null}
                </div>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

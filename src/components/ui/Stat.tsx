import { formatMoney } from "@/lib/calculations";

export function Stat({
  label,
  value,
  money,
  tone,
  hint,
}: {
  label: string;
  value: number | string;
  money?: boolean;
  tone?: "default" | "success" | "danger";
  hint?: string;
}) {
  const colors = {
    default: "text-white",
    success: "text-green-400",
    danger: "text-red-400",
  };
  const display =
    money && typeof value === "number" ? formatMoney(value) : value;

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colors[tone ?? "default"]}`}>
        {display}
      </p>
      {hint && (
        <p className="text-xs text-[var(--muted)] mt-2 leading-snug">{hint}</p>
      )}
    </div>
  );
}

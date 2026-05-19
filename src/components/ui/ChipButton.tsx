type Props = {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  title?: string;
};

export function ChipButton({
  children,
  selected,
  onClick,
  disabled,
  className = "",
  type = "button",
  title,
}: Props) {
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
        selected
          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
          : "border-[var(--card-border)] bg-[#0f1419] text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[#243044]"
      } ${className}`}
    >
      {children}
    </button>
  );
}

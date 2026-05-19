export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 ${className}`}
    >
      {title && (
        <h2 className="text-lg font-semibold mb-4 text-white">{title}</h2>
      )}
      {children}
    </section>
  );
}

export function Btn({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const base =
    "px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50";
  const variants = {
    primary: "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white",
    secondary:
      "bg-[#243044] hover:bg-[#2d3a4f] text-white border border-[var(--card-border)]",
    danger: "bg-[var(--danger)] hover:bg-red-600 text-white",
    ghost: "text-[var(--muted)] hover:text-white hover:bg-[#243044]",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export type BadgeTone =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "pending"
  | "progress"
  | "stick"
  | "face"
  | "trigger"
  | "dpad"
  | "system";

export function Badge({
  children,
  tone = "default",
  dot = false,
  pulse = false,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  pulse?: boolean;
}) {
  const tones: Record<BadgeTone, string> = {
    default:
      "border border-[var(--card-border)] bg-[#1e293b]/80 text-slate-300",
    success:
      "border border-emerald-500/35 bg-emerald-500/12 text-emerald-200",
    warning:
      "border border-amber-500/35 bg-amber-500/12 text-amber-200",
    danger: "border border-red-500/35 bg-red-500/12 text-red-200",
    info: "border border-blue-500/35 bg-blue-500/12 text-blue-200",
    pending:
      "border border-amber-400/50 bg-amber-500/15 text-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
    progress:
      "border border-sky-400/45 bg-sky-500/15 text-sky-100 shadow-[0_0_12px_rgba(56,189,248,0.12)]",
    stick:
      "border border-orange-400/40 bg-orange-500/12 text-orange-100",
    face: "border border-rose-400/40 bg-rose-500/12 text-rose-100",
    trigger:
      "border border-cyan-400/35 bg-cyan-500/10 text-cyan-100",
    dpad: "border border-violet-400/40 bg-violet-500/12 text-violet-100",
    system:
      "border border-slate-400/35 bg-slate-500/12 text-slate-200",
  };

  const dotColors: Record<BadgeTone, string> = {
    default: "bg-slate-400",
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    danger: "bg-red-400",
    info: "bg-blue-400",
    pending: "bg-amber-300",
    progress: "bg-sky-300",
    stick: "bg-orange-300",
    face: "bg-rose-300",
    trigger: "bg-cyan-300",
    dpad: "bg-violet-300",
    system: "bg-slate-300",
  };

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium leading-tight ${tones[tone]}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColors[tone]} ${pulse ? "animate-pulse" : ""}`}
          aria-hidden
        />
      )}
      <span className="truncate">{children}</span>
    </span>
  );
}

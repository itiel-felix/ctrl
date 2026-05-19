import { STATUS_LABELS, type RepairStatus } from "@/lib/enums";
import { Badge, type BadgeTone } from "@/components/ui/Card";

const STATUS_BADGE: Record<
  RepairStatus,
  { tone: BadgeTone; dot: boolean; pulse: boolean }
> = {
  PENDIENTE: { tone: "pending", dot: true, pulse: true },
  EN_REPARACION: { tone: "progress", dot: true, pulse: true },
  LISTO: { tone: "success", dot: true, pulse: false },
  VENDIDO: { tone: "info", dot: false, pulse: false },
  CANCELADO: { tone: "danger", dot: false, pulse: false },
};

export function RepairStatusBadge({ status }: { status: RepairStatus }) {
  const config = STATUS_BADGE[status];
  return (
    <Badge tone={config.tone} dot={config.dot} pulse={config.pulse}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

import {
  FAILURE_LABELS,
  type FailureCode,
} from "@/lib/platformFailures";
import { Badge, type BadgeTone } from "@/components/ui/Card";

function getFailureBadgeTone(code: FailureCode): BadgeTone {
  if (code.startsWith("STICK")) return "stick";
  if (code.includes("FACE_BUTTONS")) return "face";
  if (code === "DPAD_NO_RESPONSE") return "dpad";
  if (
    code === "MINUS_NO_RESPONSE" ||
    code === "PLUS_NO_RESPONSE" ||
    code === "HOME_NO_RESPONSE" ||
    code === "CAPTURE_NO_RESPONSE"
  ) {
    return "system";
  }
  if (code.endsWith("_NO_RESPONSE")) return "trigger";
  return "default";
}

export function FailureBadges({ failures }: { failures: FailureCode[] }) {
  if (failures.length === 0) {
    return (
      <span className="text-sm italic text-[var(--muted)]">
        Sin fallas registradas
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {failures.map((code) => (
        <Badge key={code} tone={getFailureBadgeTone(code)}>
          {FAILURE_LABELS[code] ?? code}
        </Badge>
      ))}
    </div>
  );
}

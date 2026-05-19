"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { isColorValidForPlatform } from "@/lib/controllerOptions";
import type { ConsolePlatform } from "@/lib/enums";
import type { FailureCode } from "@/lib/platformFailures";
import { filterFailuresForPlatform } from "@/lib/platformFailures";
import { Btn } from "@/components/ui/Card";
import { FailureMultiSelect } from "@/components/ui/FailureMultiSelect";
import { PlatformPicker } from "@/components/reparaciones/PlatformPicker";
import { QuickPricePicker } from "@/components/reparaciones/QuickPricePicker";
import { ColorPicker } from "@/components/reparaciones/ColorPicker";
import { QuantityPicker } from "@/components/reparaciones/QuantityPicker";

type Props = {
  onCreated: () => void;
};

const initialState = () => ({
  platform: "PS4" as ConsolePlatform,
  failures: [] as FailureCode[],
  acquisitionCost: 0,
  color: null as string | null,
  isSpecialEdition: false,
  specialNote: "",
  isCleaned: false,
  notes: "",
  quantity: 1,
});

export function NewRepairForm({ onCreated }: Props) {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);

  function setPlatform(platform: ConsolePlatform) {
    setForm((prev) => ({
      ...prev,
      platform,
      failures: filterFailuresForPlatform(prev.failures, platform),
      color:
        prev.isSpecialEdition || isColorValidForPlatform(prev.color, platform)
          ? prev.color
          : null,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.failures.length === 0) {
      alert("Selecciona al menos una falla");
      return;
    }
    if (!form.color?.trim()) {
      alert("Selecciona un color o marca como Especial");
      return;
    }

    setSubmitting(true);
    try {
      await api("/api/repairs", {
        method: "POST",
        body: JSON.stringify({
          platform: form.platform,
          failures: form.failures,
          acquisitionCost: form.acquisitionCost,
          color: form.color.trim(),
          isSpecialEdition: form.isSpecialEdition,
          isCleaned: form.isCleaned,
          notes: form.notes.trim() || null,
          quantity: form.quantity,
        }),
      });
      onCreated();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-sm text-[var(--muted)] mb-2">Consola</p>
        <PlatformPicker value={form.platform} onChange={setPlatform} />
      </div>

      <div>
        <p className="text-sm text-[var(--muted)] mb-2">Color</p>
        <ColorPicker
          platform={form.platform}
          color={form.color}
          isSpecialEdition={form.isSpecialEdition}
          specialNote={form.specialNote}
          onColorChange={(color) => setForm((p) => ({ ...p, color }))}
          onSpecialChange={(isSpecialEdition, specialNote) =>
            setForm((p) => ({ ...p, isSpecialEdition, specialNote }))
          }
        />
      </div>

      <div>
        <p className="text-sm text-[var(--muted)] mb-2">Fallas</p>
        <FailureMultiSelect
          platform={form.platform}
          value={form.failures}
          onChange={(failures) => setForm((p) => ({ ...p, failures }))}
        />
      </div>

      <div>
        <p className="text-sm text-[var(--muted)] mb-2">Costo de adquisición</p>
        <QuickPricePicker
          value={form.acquisitionCost}
          onChange={(acquisitionCost) =>
            setForm((p) => ({ ...p, acquisitionCost }))
          }
        />
      </div>

      <div>
        <p className="text-sm text-[var(--muted)] mb-2">Cantidad</p>
        <QuantityPicker
          value={form.quantity}
          onChange={(quantity) => setForm((p) => ({ ...p, quantity }))}
        />
      </div>

      <div className="flex items-center gap-2.5">
        <input
          id="repair-is-cleaned"
          type="checkbox"
          checked={form.isCleaned}
          onChange={(e) =>
            setForm((p) => ({ ...p, isCleaned: e.target.checked }))
          }
          className="!mt-0 !mb-0 h-4 w-4 !w-4 shrink-0 rounded border-[var(--card-border)] bg-[#0f1419] accent-[var(--accent)]"
        />
        <label
          htmlFor="repair-is-cleaned"
          className="!mb-0 cursor-pointer text-sm text-[var(--foreground)]"
        >
          Marcar limpio
        </label>
      </div>

      <div>
        <p className="text-sm text-[var(--muted)] mb-2">
          Notas extra (opcional)
        </p>
        <input
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          placeholder="Accesorios, detalles adicionales..."
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Btn type="submit" disabled={submitting} className="shrink-0">
          {submitting
            ? "Guardando..."
            : form.quantity > 1
              ? `Registrar ${form.quantity} controles`
              : "Registrar control"}
        </Btn>
        <button
          type="button"
          onClick={() => setForm(initialState())}
          className="text-sm text-[var(--muted)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
        >
          Limpiar formulario
        </button>
      </div>
    </form>
  );
}

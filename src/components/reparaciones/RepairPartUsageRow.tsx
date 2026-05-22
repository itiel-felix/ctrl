"use client";

import { useEffect, useState } from "react";
import type { PartDto, RepairPartUsageDto } from "@/types";
import { Btn } from "@/components/ui/Card";
import { formatMoney } from "@/lib/calculations";
import { getPlatformLabel } from "@/lib/enums";

type Props = {
  usage: RepairPartUsageDto;
  repairId: number;
  repairPlatform: string;
  parts: PartDto[];
  canEdit: boolean;
  onUpdate: (
    repairId: number,
    usageId: number,
    partId: number,
    quantity: number
  ) => void;
  onRemove: (repairId: number, usageId: number, partName: string) => void;
};

export function RepairPartUsageRow({
  usage: u,
  repairId,
  repairPlatform,
  parts,
  canEdit,
  onUpdate,
  onRemove,
}: Props) {
  const partName = u.part?.name ?? `Pieza #${u.partId}`;
  const [editing, setEditing] = useState(false);
  const [partId, setPartId] = useState(u.partId);
  const [qty, setQty] = useState(u.quantity);

  useEffect(() => {
    if (!editing) {
      setPartId(u.partId);
      setQty(u.quantity);
    }
  }, [u.partId, u.quantity, editing]);

  const selectedPart = parts.find((p) => p.id === partId);
  const stockHint = selectedPart?.stockQuantity ?? 0;
  const samePart = partId === u.partId;
  const maxQty = samePart ? stockHint + u.quantity : stockHint;

  function save() {
    if (qty < 1) {
      alert("La cantidad debe ser al menos 1");
      return;
    }
    onUpdate(repairId, u.id, partId, qty);
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="rounded-lg border border-[var(--accent)]/40 bg-[#1a2332] p-3 space-y-3">
        <p className="text-xs text-[var(--muted)] uppercase tracking-wide">
          Editar repuesto
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs">Pieza</label>
            <select
              value={partId}
              onChange={(e) => setPartId(Number(e.target.value))}
            >
              {parts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.platform !== repairPlatform
                    ? ` · ${getPlatformLabel(p.platform)}`
                    : ""}{" "}
                  (stock: {p.id === u.partId ? p.stockQuantity + u.quantity : p.stockQuantity})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs">Cantidad</label>
            <input
              type="number"
              min={1}
              max={maxQty > 0 ? maxQty : undefined}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            />
            {maxQty > 0 && (
              <p className="text-xs text-[var(--muted)] mt-1">
                Máx. {maxQty} disponible(s)
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn type="button" className="!py-1 !px-3 !text-xs" onClick={save}>
            Guardar
          </Btn>
          <Btn
            type="button"
            variant="ghost"
            className="!py-1 !px-3 !text-xs"
            onClick={() => {
              setPartId(u.partId);
              setQty(u.quantity);
              setEditing(false);
            }}
          >
            Cancelar
          </Btn>
        </div>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#1a2332]/60 px-3 py-2">
      <span>
        {partName} × {u.quantity} —{" "}
        {formatMoney(u.quantity * u.unitCostSnapshot)}
      </span>
      {canEdit && (
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-[var(--accent)] hover:underline underline-offset-2"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => onRemove(repairId, u.id, partName)}
            className="text-xs text-red-400/90 hover:text-red-300 underline-offset-2 hover:underline"
          >
            Quitar
          </button>
        </div>
      )}
    </li>
  );
}

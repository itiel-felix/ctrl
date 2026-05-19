"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  getPlatformLabel,
  REPAIR_STATUSES,
  STATUS_LABELS,
  type FailureCode,
  type RepairStatus,
} from "@/lib/enums";
import { formatMoney } from "@/lib/calculations";
import { filterPartsForRepair } from "@/lib/partCompatibility";
import type { PartDto, RepairDto } from "@/types";
import { Badge, Btn, Card } from "@/components/ui/Card";
import { FailureMultiSelect } from "@/components/ui/FailureMultiSelect";
import { FailureBadges } from "@/components/ui/FailureBadges";
import { RepairStatusBadge } from "@/components/ui/RepairStatusBadge";
import { NewRepairForm } from "@/components/reparaciones/NewRepairForm";

export function RepairsPanel() {
  const [repairs, setRepairs] = useState<RepairDto[]>([]);
  const [parts, setParts] = useState<PartDto[]>([]);
  const [filter, setFilter] = useState<RepairStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = filter ? `?status=${filter}` : "";
      const [repairsRes, partsRes] = await Promise.all([
        api<{ repairs: RepairDto[] }>(`/api/repairs${q}`),
        api<{ parts: PartDto[] }>("/api/parts"),
      ]);
      setRepairs(repairsRes.repairs);
      setParts(partsRes.parts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateRepair(id: number, fields: Partial<RepairDto>) {
    try {
      await api(`/api/repairs/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ repair: fields }),
      });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  async function addPart(repairId: number, partId: number, quantity: number) {
    try {
      await api(`/api/repairs/${repairId}`, {
        method: "PATCH",
        body: JSON.stringify({ addPart: { partId, quantity } }),
      });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  async function deleteRepair(repair: RepairDto) {
    const label = repair.label || `Control #${repair.id}`;
    const soldNote =
      repair.status === "VENDIDO"
        ? " También se eliminará el registro de venta asociado."
        : "";
    if (
      !confirm(
        `¿Eliminar ${label}? Se quitará el control y su gasto de compra.${soldNote}`
      )
    ) {
      return;
    }
    try {
      await api(`/api/repairs/${repair.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  const pending = repairs.filter(
    (r) => r.status === "PENDIENTE" || r.status === "EN_REPARACION"
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 items-center">
        <label className="sr-only">Filtrar estado</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as RepairStatus | "")}
          className="w-auto min-w-[180px]"
        >
          <option value="">Todos los estados</option>
          {REPAIR_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <Btn type="button" variant="secondary" onClick={load}>
          Actualizar
        </Btn>
        <span className="text-sm text-[var(--muted)]">
          {pending.length} pendientes de reparar / en proceso
        </span>
      </div>

      {error && (
        <p className="text-red-400 text-sm">
          {error}. ¿MySQL corriendo y SYNC_DB=true tras cambios de esquema?
        </p>
      )}

      <Card title="Nuevo control">
        <NewRepairForm onCreated={load} />
      </Card>

      {loading ? (
        <p className="text-[var(--muted)]">Cargando...</p>
      ) : repairs.length === 0 ? (
        <p className="text-[var(--muted)]">No hay controles registrados.</p>
      ) : (
        <div className="space-y-4">
          {repairs.map((r) => (
            <RepairCard
              key={r.id}
              repair={r}
              parts={filterPartsForRepair(parts, r.platform)}
              onUpdate={updateRepair}
              onAddPart={addPart}
              onDelete={() => deleteRepair(r)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RepairCard({
  repair: r,
  parts,
  onUpdate,
  onAddPart,
  onDelete,
}: {
  repair: RepairDto;
  parts: PartDto[];
  onUpdate: (id: number, fields: Partial<RepairDto>) => void;
  onAddPart: (repairId: number, partId: number, qty: number) => void;
  onDelete: () => void;
}) {
  const [partId, setPartId] = useState(parts[0]?.id ?? 0);
  const [qty, setQty] = useState(1);
  const [editingFailures, setEditingFailures] = useState(false);
  const [failuresDraft, setFailuresDraft] = useState<FailureCode[]>(r.failures);

  useEffect(() => {
    setFailuresDraft(r.failures);
  }, [r.failures]);

  function saveFailures() {
    if (failuresDraft.length === 0) {
      alert("Selecciona al menos una falla");
      return;
    }
    onUpdate(r.id, { failures: failuresDraft });
    setEditingFailures(false);
  }

  const isPending =
    r.status === "PENDIENTE" || r.status === "EN_REPARACION";

  return (
    <Card
      className={
        isPending
          ? "border-amber-500/25 shadow-[inset_3px_0_0_0_rgba(245,158,11,0.55)]"
          : r.status === "LISTO"
            ? "border-emerald-500/20 shadow-[inset_3px_0_0_0_rgba(52,211,153,0.45)]"
            : ""
      }
    >
      <div className="flex flex-wrap justify-between gap-2 mb-3">
        <div>
          <h3 className="font-semibold text-white">
            {r.label || `Control #${r.id}`}
          </h3>
          <p className="text-sm text-[var(--muted)]">
            {getPlatformLabel(r.platform)}
            {r.color && (
              <>
                {" · "}
                <span className="text-[var(--foreground)]">{r.color}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {r.isSpecialEdition && (
            <Badge tone="warning">Especial</Badge>
          )}
          <RepairStatusBadge status={r.status} />
          <button
            type="button"
            onClick={onDelete}
            className="text-sm text-red-400/90 underline-offset-2 hover:text-red-300 hover:underline"
          >
            Eliminar
          </button>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm text-[var(--muted)] mb-2">Fallas</p>
        {editingFailures ? (
          <div className="space-y-2">
            <FailureMultiSelect
              platform={r.platform}
              value={failuresDraft}
              onChange={setFailuresDraft}
            />
            <div className="flex gap-2">
              <Btn type="button" onClick={saveFailures}>
                Guardar fallas
              </Btn>
              <Btn
                type="button"
                variant="ghost"
                onClick={() => {
                  setFailuresDraft(r.failures);
                  setEditingFailures(false);
                }}
              >
                Cancelar
              </Btn>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-start gap-2">
            <FailureBadges failures={r.failures} />
            {r.status !== "VENDIDO" && r.status !== "CANCELADO" && (
              <Btn
                type="button"
                variant="ghost"
                className="!py-1 !px-2 text-xs"
                onClick={() => setEditingFailures(true)}
              >
                Editar
              </Btn>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-sm mb-4">
        <span>
          Limpieza:{" "}
          {r.isCleaned ? (
            <span className="text-green-400">Sí</span>
          ) : (
            <span className="text-amber-400">Pendiente</span>
          )}
        </span>
        <span>
          Costo: <strong>{formatMoney(r.acquisitionCost)}</strong>
          {r.totalCost !== undefined && r.totalCost !== r.acquisitionCost && (
            <> · Total: {formatMoney(r.totalCost)}</>
          )}
        </span>
      </div>

      {r.notes && (
        <p className="text-sm text-[var(--muted)] mb-4">{r.notes}</p>
      )}

      {r.partUsages && r.partUsages.length > 0 && (
        <ul className="text-sm mb-4 space-y-1">
          <li className="text-[var(--muted)]">Repuestos usados:</li>
          {r.partUsages.map((u) => (
            <li key={u.id}>
              {u.part?.name ?? `Pieza #${u.partId}`} × {u.quantity} —{" "}
              {formatMoney(u.quantity * u.unitCostSnapshot)}
            </li>
          ))}
        </ul>
      )}

      {r.status !== "VENDIDO" && r.status !== "CANCELADO" && (
        <div className="flex flex-wrap gap-2 items-end border-t border-[var(--card-border)] pt-4">
          <div className="flex-1 min-w-[140px]">
            <label>Agregar repuesto</label>
            <select
              value={partId}
              onChange={(e) => setPartId(Number(e.target.value))}
            >
              {parts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.platform !== r.platform
                    ? ` · ${getPlatformLabel(p.platform)}`
                    : ""}{" "}
                  (stock: {p.stockQuantity})
                </option>
              ))}
            </select>
          </div>
          <div className="w-20">
            <label>Cant.</label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </div>
          <Btn
            type="button"
            variant="secondary"
            onClick={() => onAddPart(r.id, partId, qty)}
            disabled={!partId}
          >
            Usar pieza
          </Btn>
          <Btn
            type="button"
            variant="ghost"
            onClick={() => onUpdate(r.id, { isCleaned: !r.isCleaned })}
          >
            {r.isCleaned ? "Marcar sucio" : "Marcar limpio"}
          </Btn>
          {r.status !== "LISTO" && (
            <Btn
              type="button"
              variant="secondary"
              onClick={() => onUpdate(r.id, { status: "LISTO" })}
            >
              Marcar listo
            </Btn>
          )}
          <select
            className="w-auto"
            value={r.status}
            onChange={(e) =>
              onUpdate(r.id, { status: e.target.value as RepairStatus })
            }
          >
            {REPAIR_STATUSES.filter((s) => s !== "VENDIDO").map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      )}
    </Card>
  );
}

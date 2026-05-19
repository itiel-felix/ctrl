"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  REPAIR_STATUSES,
  STATUS_LABELS,
  type RepairStatus,
} from "@/lib/enums";
import { filterPartsForRepair } from "@/lib/partCompatibility";
import type { PartDto, RepairDto } from "@/types";
import { Btn, Card } from "@/components/ui/Card";
import { NewRepairForm } from "@/components/reparaciones/NewRepairForm";
import { RepairCard } from "@/components/reparaciones/RepairCard";

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

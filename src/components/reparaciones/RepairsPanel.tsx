"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import {
  REPAIR_STATUSES,
  STATUS_LABELS,
  type RepairStatus,
} from "@/lib/enums";
import { filterPartsForRepair } from "@/lib/partCompatibility";
import { entityKey, useEntityLoading } from "@/hooks/useEntityLoading";
import type { PartDto, RepairDto } from "@/types";
import { Btn, Card } from "@/components/ui/Card";
import { NewRepairForm } from "@/components/reparaciones/NewRepairForm";
import { RepairCard } from "@/components/reparaciones/RepairCard";

export function RepairsPanel() {
  const [repairs, setRepairs] = useState<RepairDto[]>([]);
  const [parts, setParts] = useState<PartDto[]>([]);
  const [filter, setFilter] = useState<RepairStatus | "">("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);
  const { isLoading, run } = useEntityLoading();

  const fetchData = useCallback(async () => {
    const q = filter ? `?status=${filter}` : "";
    const [repairsRes, partsRes] = await Promise.all([
      api<{ repairs: RepairDto[] }>(`/api/repairs${q}`),
      api<{ parts: PartDto[] }>("/api/parts"),
    ]);
    setRepairs(repairsRes.repairs);
    setParts(partsRes.parts);
  }, [filter]);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true;
      if (!silent) {
        if (!hasLoadedOnce.current) setInitialLoading(true);
        else setListRefreshing(true);
      }
      setError(null);
      try {
        await fetchData();
        hasLoadedOnce.current = true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar");
      } finally {
        setInitialLoading(false);
        setListRefreshing(false);
      }
    },
    [fetchData]
  );

  useEffect(() => {
    load();
  }, [load]);

  async function updateRepair(id: number, fields: Partial<RepairDto>) {
    const key = entityKey("repair", id);
    try {
      await run(key, async () => {
        await api(`/api/repairs/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ repair: fields }),
        });
        await fetchData();
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  async function addPart(repairId: number, partId: number, quantity: number) {
    const key = entityKey("repair", repairId);
    try {
      await run(key, async () => {
        await api(`/api/repairs/${repairId}`, {
          method: "PATCH",
          body: JSON.stringify({ addPart: { partId, quantity } }),
        });
        await fetchData();
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  async function updatePart(
    repairId: number,
    usageId: number,
    partId: number,
    quantity: number
  ) {
    const key = entityKey("repair", repairId);
    try {
      await run(key, async () => {
        await api(`/api/repairs/${repairId}`, {
          method: "PATCH",
          body: JSON.stringify({
            updatePartUsage: { usageId, partId, quantity },
          }),
        });
        await fetchData();
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  async function removePart(
    repairId: number,
    usageId: number,
    partName: string
  ) {
    if (
      !confirm(
        `¿Quitar «${partName}» de este control? La cantidad volverá al inventario.`
      )
    ) {
      return;
    }
    const key = entityKey("repair", repairId);
    try {
      await run(key, async () => {
        await api(`/api/repairs/${repairId}`, {
          method: "PATCH",
          body: JSON.stringify({ removePartUsageId: usageId }),
        });
        await fetchData();
      });
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
    const key = entityKey("repair", repair.id);
    try {
      await run(key, async () => {
        await api(`/api/repairs/${repair.id}`, { method: "DELETE" });
        await fetchData();
      });
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
          disabled={listRefreshing}
        >
          <option value="">Todos los estados</option>
          {REPAIR_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <Btn
          type="button"
          variant="secondary"
          onClick={() => load()}
          disabled={listRefreshing}
        >
          {listRefreshing ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Actualizando…
            </span>
          ) : (
            "Actualizar"
          )}
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
        <NewRepairForm onCreated={() => load({ silent: true })} />
      </Card>

      {initialLoading ? (
        <p className="text-[var(--muted)] flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          Cargando controles…
        </p>
      ) : repairs.length === 0 ? (
        <p className="text-[var(--muted)]">No hay controles registrados.</p>
      ) : (
        <div className="space-y-4 relative">
          {listRefreshing && (
            <div className="absolute top-0 right-0 z-20 flex items-center gap-2 text-xs text-[var(--muted)] bg-[#0d1117]/90 px-2 py-1 rounded-lg">
              <Loader2 className="size-3.5 animate-spin" />
              Actualizando lista…
            </div>
          )}
          {repairs.map((r) => (
            <RepairCard
              key={r.id}
              repair={r}
              parts={filterPartsForRepair(parts, r.platform)}
              loading={isLoading(entityKey("repair", r.id))}
              onUpdate={updateRepair}
              onAddPart={addPart}
              onRemovePart={removePart}
              onUpdatePart={updatePart}
              onDelete={() => deleteRepair(r)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

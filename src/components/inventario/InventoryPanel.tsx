"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  CATEGORY_LABELS,
  CONSOLE_PLATFORMS,
  PART_CATEGORIES,
  PLATFORM_LABELS,
  type ConsolePlatform,
  type PartCategory,
} from "@/lib/enums";
import { formatMoney } from "@/lib/calculations";
import type { PartDto } from "@/types";
import { Badge, Btn, Card } from "@/components/ui/Card";
import { MoneyInput } from "@/components/ui/MoneyInput";

export function InventoryPanel() {
  const [parts, setParts] = useState<PartDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ parts: PartDto[] }>("/api/parts");
      setParts(res.parts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function seedDefaults() {
    try {
      await api("/api/parts", { method: "PUT" });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  async function createPart(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api("/api/parts", {
        method: "POST",
        body: JSON.stringify({
          name: fd.get("name"),
          platform: fd.get("platform"),
          category: fd.get("category"),
          unitCost: Number(fd.get("unitCost") || 0),
          stockQuantity: Number(fd.get("stockQuantity") || 0),
        }),
      });
      (e.target as HTMLFormElement).reset();
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  async function updateStock(id: number, stockQuantity: number, unitCost: number) {
    try {
      await api(`/api/parts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ stockQuantity, unitCost }),
      });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  const lowStock = parts.filter((p) => p.stockQuantity <= 2);

  return (
    <div className="space-y-6">
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {parts.length === 0 && !loading && (
        <Card>
          <p className="text-sm text-[var(--muted)] mb-4">
            El inventario está vacío. Puedes cargar los repuestos predeterminados
            (sticks por consola y micro switches Xbox) o agregar los tuyos.
          </p>
          <Btn type="button" onClick={seedDefaults}>
            Cargar repuestos predeterminados
          </Btn>
        </Card>
      )}

      {lowStock.length > 0 && (
        <p className="text-amber-400 text-sm">
          Stock bajo: {lowStock.map((p) => p.name).join(", ")}
        </p>
      )}

      <Card title="Nuevo repuesto">
        <form onSubmit={createPart} className="grid gap-4 md:grid-cols-2">
          <div>
            <label>Nombre de la pieza</label>
            <input name="name" required placeholder="Stick analógico" />
          </div>
          <div>
            <label>Consola</label>
            <select name="platform" required>
              {CONSOLE_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABELS[p as ConsolePlatform]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Tipo</label>
            <select name="category" required>
              {PART_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c as PartCategory]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Costo unitario</label>
            <MoneyInput name="unitCost" defaultValue="0" />
          </div>
          <div>
            <label>Stock inicial</label>
            <input
              name="stockQuantity"
              type="number"
              min="0"
              defaultValue="0"
            />
          </div>
          <div className="flex items-end">
            <Btn type="submit">Agregar</Btn>
          </div>
        </form>
      </Card>

      {loading ? (
        <p className="text-[var(--muted)]">Cargando...</p>
      ) : (
        <Card title="Repuestos">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--muted)] border-b border-[var(--card-border)]">
                  <th className="pb-2 pr-3">Pieza</th>
                  <th className="pb-2 pr-3">Consola</th>
                  <th className="pb-2 pr-3">Tipo</th>
                  <th className="pb-2 pr-3">Costo</th>
                  <th className="pb-2 pr-3">Stock</th>
                  <th className="pb-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((p) => (
                  <PartRow key={p.id} part={p} onSave={updateStock} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function PartRow({
  part: p,
  onSave,
}: {
  part: PartDto;
  onSave: (id: number, stock: number, cost: number) => void;
}) {
  const [stock, setStock] = useState(p.stockQuantity);
  const [cost, setCost] = useState(p.unitCost);

  return (
    <tr className="border-b border-[var(--card-border)]/50">
      <td className="py-3 pr-3 font-medium">{p.name}</td>
      <td className="py-3 pr-3">
        <Badge>{PLATFORM_LABELS[p.platform]}</Badge>
      </td>
      <td className="py-3 pr-3 text-[var(--muted)]">
        {CATEGORY_LABELS[p.category]}
      </td>
      <td className="py-3 pr-3">
        <MoneyInput
          value={cost}
          onChange={(e) => setCost(Number(e.target.value))}
          wrapperClassName="w-28"
        />
      </td>
      <td className="py-3 pr-3">
        <input
          type="number"
          min="0"
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          className={`w-20 ${stock <= 2 ? "border-amber-500" : ""}`}
        />
      </td>
      <td className="py-3">
        <Btn
          type="button"
          variant="secondary"
          onClick={() => onSave(p.id, stock, cost)}
        >
          Guardar
        </Btn>
      </td>
    </tr>
  );
}

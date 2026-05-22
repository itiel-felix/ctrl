"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/calculations";
import { getPlatformLabel } from "@/lib/enums";
import { entityKey, useEntityLoading } from "@/hooks/useEntityLoading";
import type { ExpenseDto, FinanceSummary, RepairDto, SaleDto } from "@/types";
import { Badge, Btn, Card } from "@/components/ui/Card";
import { EntityLoadingShell } from "@/components/ui/EntityLoadingShell";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Stat } from "@/components/ui/Stat";
import { DatabaseBackupPanel } from "@/components/ventas/DatabaseBackupPanel";
import { ExpenseRegisterForm } from "@/components/ventas/ExpenseRegisterForm";

export function FinancePanel() {
  const [sales, setSales] = useState<SaleDto[]>([]);
  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [readyRepairs, setReadyRepairs] = useState<RepairDto[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [summaryRefreshing, setSummaryRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);
  const { isLoading, run } = useEntityLoading();

  const fetchData = useCallback(async () => {
    const [finance, repairsRes] = await Promise.all([
      api<{
        sales: SaleDto[];
        expenses: ExpenseDto[];
        summary: FinanceSummary;
      }>("/api/expenses"),
      api<{ repairs: RepairDto[] }>("/api/repairs?status=LISTO"),
    ]);
    setSales(finance.sales);
    setExpenses(finance.expenses);
    setSummary(finance.summary);
    setReadyRepairs(repairsRes.repairs);
  }, []);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true;
      if (!silent) {
        if (!hasLoadedOnce.current) setInitialLoading(true);
        else setSummaryRefreshing(true);
      }
      setError(null);
      try {
        await fetchData();
        hasLoadedOnce.current = true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar");
      } finally {
        setInitialLoading(false);
        setSummaryRefreshing(false);
      }
    },
    [fetchData]
  );

  useEffect(() => {
    load();
  }, [load]);

  async function stockExpense(expenseId: number) {
    const key = entityKey("expense", expenseId);
    try {
      await run(key, async () => {
        await api(`/api/expenses/${expenseId}/stock`, { method: "POST" });
        await fetchData();
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  async function deleteExpense(expense: ExpenseDto) {
    const inventoryNote = expense.inventoryApplied
      ? " Se restará la cantidad del inventario asociado."
      : "";
    const repairNote = expense.isRepairLinked
      ? " Es el gasto de compra de un control; el control seguirá en reparaciones."
      : "";
    if (
      !confirm(
        `¿Eliminar el gasto «${expense.description}» (${formatMoney(expense.amount)})?${inventoryNote}${repairNote}`
      )
    ) {
      return;
    }
    const key = entityKey("expense", expense.id);
    try {
      await run(key, async () => {
        await api(`/api/expenses/${expense.id}`, { method: "DELETE" });
        await fetchData();
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  async function deleteSale(sale: SaleDto) {
    const label = sale.repair?.label || `Control #${sale.repairId}`;
    if (
      !confirm(
        `¿Eliminar la venta de ${label} (${formatMoney(sale.salePrice)})? El control volverá a estado «Listo».`
      )
    ) {
      return;
    }
    const key = entityKey("sale", sale.id);
    try {
      await run(key, async () => {
        await api(`/api/sales/${sale.id}`, { method: "DELETE" });
        await fetchData();
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  async function registerSale(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const key = "sale-form";
    try {
      await run(key, async () => {
        await api("/api/sales", {
          method: "POST",
          body: JSON.stringify({
            repairId: Number(fd.get("repairId")),
            salePrice: Number(fd.get("salePrice")),
            notes: fd.get("notes") || null,
          }),
        });
        (e.target as HTMLFormElement).reset();
        await fetchData();
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {initialLoading ? (
        <p className="text-[var(--muted)] flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          Cargando resumen…
        </p>
      ) : (
        summary && (
          <div className="relative">
            {summaryRefreshing && (
              <div className="absolute top-0 right-0 z-10 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <Loader2 className="size-3.5 animate-spin" />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <Stat label="Ventas" value={summary.totalSales} hint="Controles vendidos" />
              <Stat
                label="Ingresos"
                value={summary.totalRevenue}
                money
                hint="Efectivo por ventas"
              />
              <Stat
                label="Gastos"
                value={summary.totalExpenses}
                money
                hint="Todo lo registrado como gasto"
              />
              <Stat
                label="Ganancia bruta"
                value={summary.totalProfit}
                money
                tone="success"
                hint="Por venta: precio − costo del control"
              />
              <Stat
                label="Balance neto"
                value={summary.netBalance}
                money
                tone={summary.netBalance >= 0 ? "success" : "danger"}
                hint="Ingresos − gastos. ≥ 0 = recuperaste lo invertido"
              />
            </div>
          </div>
        )
      )}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6 min-w-0">
          <EntityLoadingShell loading={isLoading("sale-form")}>
            <Card title="Registrar venta">
              <form onSubmit={registerSale} className="grid gap-4">
                <div>
                  <label>Control (debe estar listo)</label>
                  <select name="repairId" required disabled={initialLoading}>
                    <option value="">Selecciona un control</option>
                    {readyRepairs.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label || `#${r.id}`} — {getPlatformLabel(r.platform)}{" "}
                        — costo {formatMoney(r.totalCost ?? r.acquisitionCost)}
                      </option>
                    ))}
                  </select>
                  {readyRepairs.length === 0 && !initialLoading && (
                    <p className="text-xs text-amber-400 mt-1">
                      Marca controles como &quot;Listo&quot; en Reparaciones primero.
                    </p>
                  )}
                </div>
                <div>
                  <label>Precio de venta</label>
                  <MoneyInput name="salePrice" required />
                </div>
                <div>
                  <label>Notas</label>
                  <input name="notes" placeholder="Cliente, método de pago..." />
                </div>
                <div>
                  <Btn type="submit" disabled={readyRepairs.length === 0}>
                    Registrar venta
                  </Btn>
                </div>
              </form>
            </Card>
          </EntityLoadingShell>

          <Card title="Historial de ventas">
            {initialLoading ? (
              <p className="text-sm text-[var(--muted)] flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Cargando ventas…
              </p>
            ) : sales.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Sin ventas aún.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--muted)] border-b border-[var(--card-border)]">
                      <th className="pb-2 pr-4">Control</th>
                      <th className="pb-2 pr-4">Venta</th>
                      <th className="pb-2 pr-4">Costo</th>
                      <th className="pb-2 pr-4">Ganancia</th>
                      <th className="pb-2 w-10" aria-label="Acciones" />
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s) => {
                      const rowLoading = isLoading(entityKey("sale", s.id));
                      return (
                        <tr
                          key={s.id}
                          className={`border-b border-[var(--card-border)]/50 relative ${rowLoading ? "opacity-60" : ""}`}
                        >
                          <td className="py-3 pr-4">
                            {s.repair?.label || `#${s.repairId}`}
                            <br />
                            <span className="text-xs text-[var(--muted)]">
                              {s.repair && getPlatformLabel(s.repair.platform)}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            {formatMoney(s.salePrice)}
                          </td>
                          <td className="py-3 pr-4">
                            {formatMoney(s.totalCost ?? 0)}
                          </td>
                          <td className="py-3 pr-4 text-green-400 font-medium">
                            {formatMoney(s.profit ?? 0)}
                          </td>
                          <td className="py-3">
                            {rowLoading ? (
                              <Loader2 className="size-4 animate-spin text-[var(--accent)]" />
                            ) : (
                              <button
                                type="button"
                                onClick={() => deleteSale(s)}
                                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                title="Eliminar venta"
                                aria-label={`Eliminar venta de ${s.repair?.label || s.repairId}`}
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6 min-w-0">
          <DatabaseBackupPanel onDone={() => load({ silent: true })} />

          <Card title="Registrar gasto">
            <ExpenseRegisterForm onCreated={() => load({ silent: true })} />
          </Card>

          <Card title="Gastos">
            {initialLoading ? (
              <p className="text-sm text-[var(--muted)] flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Cargando gastos…
              </p>
            ) : expenses.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Sin gastos registrados.
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {expenses.map((e) => (
                  <EntityLoadingShell
                    key={e.id}
                    loading={isLoading(entityKey("expense", e.id))}
                  >
                    <li className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--card-border)]/50 pb-3">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="text-[var(--foreground)]">
                          {e.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-[var(--muted)]">
                            {e.expenseDate}
                          </span>
                          {e.isRepairLinked && (
                            <Badge tone="info">Compra de control</Badge>
                          )}
                          {e.isTool && <Badge tone="warning">Herramienta</Badge>}
                          {e.inventoryApplied && (
                            <Badge tone="success">En inventario</Badge>
                          )}
                          {e.canStockToInventory && (
                            <Badge tone="pending">Pendiente inventario</Badge>
                          )}
                        </div>
                        {e.canStockToInventory && (
                          <Btn
                            type="button"
                            variant="secondary"
                            className="!py-1 !px-2.5 !text-xs"
                            onClick={() => stockExpense(e.id)}
                          >
                            Recargar inventario
                          </Btn>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-medium text-red-400">
                          {formatMoney(e.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteExpense(e)}
                          className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          title="Eliminar gasto"
                          aria-label={`Eliminar gasto ${e.description}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </li>
                  </EntityLoadingShell>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/calculations";
import { getPlatformLabel } from "@/lib/enums";
import type { ExpenseDto, FinanceSummary, RepairDto, SaleDto } from "@/types";
import { Badge, Btn, Card } from "@/components/ui/Card";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Stat } from "@/components/ui/Stat";
import { ExpenseImportExport } from "@/components/ventas/ExpenseImportExport";
import { ExpenseRegisterForm } from "@/components/ventas/ExpenseRegisterForm";

export function FinancePanel() {
  const [sales, setSales] = useState<SaleDto[]>([]);
  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [readyRepairs, setReadyRepairs] = useState<RepairDto[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function stockExpense(expenseId: number) {
    try {
      await api(`/api/expenses/${expenseId}/stock`, { method: "POST" });
      await load();
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
    try {
      await api(`/api/expenses/${expense.id}`, { method: "DELETE" });
      await load();
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
    try {
      await api(`/api/sales/${sale.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  async function registerSale(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api("/api/sales", {
        method: "POST",
        body: JSON.stringify({
          repairId: Number(fd.get("repairId")),
          salePrice: Number(fd.get("salePrice")),
          notes: fd.get("notes") || null,
        }),
      });
      (e.target as HTMLFormElement).reset();
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  if (loading) return <p className="text-[var(--muted)]">Cargando...</p>;

  return (
    <div className="space-y-6">
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Ventas" value={summary.totalSales} />
          <Stat label="Ingresos" value={summary.totalRevenue} money />
          <Stat label="Ganancia bruta" value={summary.totalProfit} money tone="success" />
          <Stat
            label="Balance neto"
            value={summary.netBalance}
            money
            tone={summary.netBalance >= 0 ? "success" : "danger"}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6 min-w-0">
      <Card title="Registrar venta">
        <form onSubmit={registerSale} className="grid gap-4">
          <div>
            <label>Control (debe estar listo)</label>
            <select name="repairId" required>
              <option value="">Selecciona un control</option>
              {readyRepairs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label || `#${r.id}`} — {getPlatformLabel(r.platform)} — costo{" "}
                  {formatMoney(r.totalCost ?? r.acquisitionCost)}
                </option>
              ))}
            </select>
            {readyRepairs.length === 0 && (
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

      <Card title="Historial de ventas">
        {sales.length === 0 ? (
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
                {sales.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-[var(--card-border)]/50"
                  >
                    <td className="py-3 pr-4">
                      {s.repair?.label || `#${s.repairId}`}
                      <br />
                      <span className="text-xs text-[var(--muted)]">
                        {s.repair && getPlatformLabel(s.repair.platform)}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{formatMoney(s.salePrice)}</td>
                    <td className="py-3 pr-4">
                      {formatMoney(s.totalCost ?? 0)}
                    </td>
                    <td className="py-3 pr-4 text-green-400 font-medium">
                      {formatMoney(s.profit ?? 0)}
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => deleteSale(s)}
                        className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Eliminar venta"
                        aria-label={`Eliminar venta de ${s.repair?.label || s.repairId}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
        </div>

        <div className="space-y-6 min-w-0">
      <ExpenseImportExport onDone={load} />

      <Card title="Registrar gasto">
        <ExpenseRegisterForm onCreated={load} />
      </Card>

      <Card title="Gastos">
        {expenses.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Sin gastos registrados.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {expenses.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--card-border)]/50 pb-3"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-[var(--foreground)]">{e.description}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-[var(--muted)]">{e.expenseDate}</span>
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
            ))}
          </ul>
        )}
      </Card>
        </div>
      </div>
    </div>
  );
}

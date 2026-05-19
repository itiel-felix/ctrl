"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { ParsedExpenseConcept } from "@/lib/ai/parseExpenseConcept";
import { Btn } from "@/components/ui/Card";
import { MoneyInput } from "@/components/ui/MoneyInput";

type Props = {
  onCreated: () => void;
};

export function ExpenseRegisterForm({ onCreated }: Props) {
  const [concept, setConcept] = useState("");
  const [parsed, setParsed] = useState<ParsedExpenseConcept | null>(null);
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [extraNotes, setExtraNotes] = useState("");
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  async function interpretConcept() {
    const text = concept.trim();
    if (!text) {
      setParseError("Escribe un concepto, por ejemplo: 5 joystick PS4");
      return;
    }

    setParsing(true);
    setParseError(null);
    try {
      const res = await api<{ parsed: ParsedExpenseConcept }>(
        "/api/expenses/parse",
        {
          method: "POST",
          body: JSON.stringify({ concept: text }),
        }
      );
      setParsed(res.parsed);
    } catch (err) {
      setParsed(null);
      setParseError(err instanceof Error ? err.message : "Error al interpretar");
    } finally {
      setParsing(false);
    }
  }

  function resetForm() {
    setConcept("");
    setParsed(null);
    setAmount("");
    setExtraNotes("");
    setParseError(null);
    setExpenseDate(new Date().toISOString().slice(0, 10));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!parsed) {
      setParseError("Interpreta el concepto antes de registrar el gasto");
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      alert("Indica un monto válido");
      return;
    }

    const notes = extraNotes.trim()
      ? `${parsed.notes}\n\n${extraNotes.trim()}`
      : parsed.notes;

    setSubmitting(true);
    try {
      await api("/api/expenses", {
        method: "POST",
        body: JSON.stringify({
          description: parsed.description,
          amount: parsedAmount,
          expenseDate,
          notes,
          parsed,
        }),
      });
      resetForm();
      onCreated();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div>
          <label>Concepto (texto libre)</label>
          <input
            value={concept}
            onChange={(e) => {
              setConcept(e.target.value);
              setParsed(null);
              setParseError(null);
            }}
            placeholder='Ej. "5 joystick PS4"'
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void interpretConcept();
              }
            }}
          />
        </div>
        <div className="flex items-end">
          <Btn
            type="button"
            variant="secondary"
            disabled={parsing || !concept.trim()}
            onClick={() => void interpretConcept()}
            className="w-full md:w-auto"
          >
            {parsing ? "Interpretando..." : "Interpretar con IA"}
          </Btn>
        </div>
      </div>

      {parseError && <p className="text-sm text-red-400">{parseError}</p>}

      {parsed && (
        <div className="rounded-lg border border-[var(--accent)]/30 bg-[#0f1419] p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Interpretación
            {parsed.source === "fallback" && (
              <span className="ml-2 font-normal normal-case text-amber-400/90">
                (sin API de IA — reglas locales)
              </span>
            )}
          </p>
          <dl className="grid gap-1.5 text-sm">
            <div className="flex gap-2">
              <dt className="text-[var(--muted)] shrink-0">Producto:</dt>
              <dd className="text-white font-medium">{parsed.item}</dd>
            </div>
            {parsed.platformLabel && (
              <div className="flex gap-2">
                <dt className="text-[var(--muted)] shrink-0">Plataforma:</dt>
                <dd>{parsed.platformLabel}</dd>
              </div>
            )}
            {parsed.quantity != null && (
              <div className="flex gap-2">
                <dt className="text-[var(--muted)] shrink-0">Cantidad:</dt>
                <dd>{parsed.quantity}</dd>
              </div>
            )}
            {parsed.category && parsed.category !== "OTRO" && (
              <div className="flex gap-2">
                <dt className="text-[var(--muted)] shrink-0">Categoría:</dt>
                <dd>{parsed.category}</dd>
              </div>
            )}
          </dl>
          <p className="text-xs pt-1 border-t border-[var(--card-border)]/60">
            {parsed.isTool ? (
              <span className="text-amber-300">
                Herramienta — solo gasto, no se agrega al inventario de repuestos.
              </span>
            ) : parsed.platform ? (
              <span className="text-emerald-300/90">
                Al registrar, se sumará al inventario de repuestos automáticamente.
              </span>
            ) : (
              <span className="text-amber-400/90">
                Sin plataforma detectada: quedará pendiente de registrar en inventario.
              </span>
            )}
          </p>
          <p className="text-xs text-[var(--muted)]">
            Se guardará como: <span className="text-[var(--foreground)]">{parsed.description}</span>
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label>Monto</label>
          <MoneyInput
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Fecha</label>
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            required
          />
        </div>
        <div className="md:col-span-2">
          <label>Notas extra (opcional)</label>
          <input
            value={extraNotes}
            onChange={(e) => setExtraNotes(e.target.value)}
            placeholder="Proveedor, factura, etc."
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Btn type="submit" disabled={submitting || !parsed}>
          {submitting ? "Guardando..." : "Registrar gasto"}
        </Btn>
        <button
          type="button"
          onClick={resetForm}
          className="text-sm text-[var(--muted)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
        >
          Limpiar
        </button>
      </div>
    </form>
  );
}

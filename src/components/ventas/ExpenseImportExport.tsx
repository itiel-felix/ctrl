"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { api } from "@/lib/api";
import type { ExpenseImportResult } from "@/types";
import { Btn, Card } from "@/components/ui/Card";

export function ExpenseImportExport({ onDone }: { onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [applyInventory, setApplyInventory] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/expenses/export");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          typeof data.error === "string" ? data.error : "Error al exportar"
        );
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="([^"]+)"/);
      const filename =
        match?.[1] ?? `ctrl-gastos-${new Date().toISOString().slice(0, 10)}.json`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setMessage("Exportación descargada.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al exportar");
    }
  }

  async function handleFile(file: File) {
    setImporting(true);
    setError(null);
    setMessage(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text) as unknown;

      const payload = Array.isArray(json)
        ? { expenses: json, applyInventory, skipDuplicates: true }
        : { ...(json as Record<string, unknown>), applyInventory, skipDuplicates: true };

      const result = await api<ExpenseImportResult>("/api/expenses/import", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const parts = [
        `${result.imported} gasto(s) importado(s)`,
        result.skipped > 0 ? `${result.skipped} omitido(s) (duplicados)` : null,
        result.errors.length > 0
          ? `${result.errors.length} con error`
          : null,
      ].filter(Boolean);

      setMessage(parts.join(" · "));

      if (result.errors.length > 0) {
        setError(
          result.errors
            .slice(0, 3)
            .map((e) => `Fila ${e.index + 1}: ${e.message}`)
            .join("; ")
        );
      }

      if (result.imported > 0) {
        onDone();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al importar");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Card title="Importar / exportar gastos (JSON)">
      <p className="text-sm text-[var(--muted)] mb-4">
        Exporta todos los gastos a un archivo JSON o importa un respaldo. Los
        duplicados (misma fecha, descripción y monto) se omiten por defecto.
      </p>

      <div className="flex flex-wrap gap-3">
        <Btn type="button" variant="secondary" onClick={handleExport}>
          <span className="inline-flex items-center gap-2">
            <Download className="size-4" aria-hidden />
            Exportar JSON
          </span>
        </Btn>

        <Btn
          type="button"
          variant="secondary"
          disabled={importing}
          onClick={() => fileRef.current?.click()}
        >
          <span className="inline-flex items-center gap-2">
            <Upload className="size-4" aria-hidden />
            {importing ? "Importando…" : "Importar JSON"}
          </span>
        </Btn>

        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>

      <label className="mt-4 flex items-start gap-2 text-sm text-[var(--muted)] cursor-pointer">
        <input
          type="checkbox"
          checked={applyInventory}
          onChange={(e) => setApplyInventory(e.target.checked)}
          className="mt-1"
        />
        <span>
          Aplicar al inventario si el gasto trae{" "}
          <code className="text-xs text-[var(--foreground)]">inventoryPayload</code>{" "}
          (solo filas nuevas con plataforma válida)
        </span>
      </label>

      {message && (
        <p className="mt-3 text-sm text-green-400" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </Card>
  );
}

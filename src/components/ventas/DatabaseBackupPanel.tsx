"use client";

import { useRef, useState } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { api } from "@/lib/api";
import type { DatabaseImportResult } from "@/types";
import { Btn, Card } from "@/components/ui/Card";

const CONFIRM_PHRASE = "BORRAR TODO";

export function DatabaseBackupPanel({ onDone }: { onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/backup/export");
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
        match?.[1] ??
        `ctrl-backup-${new Date().toISOString().slice(0, 10)}.json`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setMessage(
        "Respaldo completo descargado (inventario, reparaciones, ventas y gastos)."
      );
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

      if (
        !confirm(
          "¿Restaurar este respaldo? Se reemplazará TODA la base de datos actual (inventario, reparaciones, ventas y gastos)."
        )
      ) {
        return;
      }

      const result = await api<DatabaseImportResult>("/api/backup/import", {
        method: "POST",
        body: JSON.stringify({ ...((json as object) ?? {}), replace: true }),
      });

      const c = result.imported;
      setMessage(
        `Base restaurada: ${c.parts} piezas, ${c.repairs} reparaciones, ${c.repairPartUsages} usos, ${c.sales} ventas, ${c.expenses} gastos.`
      );
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al importar");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleClearAll() {
    if (confirmText.trim() !== CONFIRM_PHRASE) {
      setError(`Escribe exactamente «${CONFIRM_PHRASE}» para confirmar.`);
      return;
    }

    setClearing(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api<{
        ok: boolean;
        deleted: Record<string, number>;
      }>("/api/backup", {
        method: "DELETE",
        body: JSON.stringify({ confirm: CONFIRM_PHRASE }),
      });

      const d = result.deleted;
      setMessage(
        `Base vaciada: ${d.parts} piezas, ${d.repairs} reparaciones, ${d.repairPartUsages} usos, ${d.sales} ventas, ${d.expenses} gastos eliminados.`
      );
      setConfirmText("");
      setShowClearConfirm(false);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al borrar");
    } finally {
      setClearing(false);
    }
  }

  return (
    <Card title="Respaldo de base de datos (JSON)">
      <p className="text-sm text-[var(--muted)] mb-4">
        Exporta o importa <strong className="text-[var(--foreground)]">toda</strong> la
        base: inventario, reparaciones, ventas y gastos. Al importar se reemplaza
        todo lo que hay actualmente.
      </p>

      <div className="flex flex-wrap gap-3">
        <Btn type="button" variant="secondary" onClick={handleExport}>
          <span className="inline-flex items-center gap-2">
            <Download className="size-4" aria-hidden />
            Exportar todo
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
            {importing ? "Restaurando…" : "Importar respaldo"}
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

        <Btn
          type="button"
          variant="danger"
          onClick={() => {
            setShowClearConfirm((v) => !v);
            setError(null);
          }}
        >
          <span className="inline-flex items-center gap-2">
            <Trash2 className="size-4" aria-hidden />
            Borrar todo
          </span>
        </Btn>
      </div>

      {showClearConfirm && (
        <div className="mt-4 p-4 rounded-lg border border-red-500/40 bg-red-500/10 space-y-3">
          <p className="text-sm text-red-300">
            Esto elimina permanentemente inventario, reparaciones, ventas y gastos.
            Exporta un respaldo antes si lo necesitas.
          </p>
          <div>
            <label className="text-xs text-[var(--muted)]">
              Escribe <strong className="text-red-300">{CONFIRM_PHRASE}</strong> para
              confirmar
            </label>
            <input
              className="mt-1 w-full"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn
              type="button"
              variant="danger"
              disabled={clearing || confirmText.trim() !== CONFIRM_PHRASE}
              onClick={() => void handleClearAll()}
            >
              {clearing ? "Borrando…" : "Confirmar borrado total"}
            </Btn>
            <Btn
              type="button"
              variant="ghost"
              onClick={() => {
                setShowClearConfirm(false);
                setConfirmText("");
              }}
            >
              Cancelar
            </Btn>
          </div>
        </div>
      )}

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

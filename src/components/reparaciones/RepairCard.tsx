import { useState, useEffect } from "react";
import type { RepairDto, PartDto } from "@/types";
import { Card, Badge, Btn } from "@/components/ui/Card";
import { RepairStatusBadge } from "@/components/ui/RepairStatusBadge";
import { FailureMultiSelect } from "@/components/ui/FailureMultiSelect";
import { FailureBadges } from "@/components/ui/FailureBadges";
import { formatMoney } from "@/lib/calculations";
import { EntityLoadingShell } from "@/components/ui/EntityLoadingShell";
import { RepairPartUsageRow } from "@/components/reparaciones/RepairPartUsageRow";

import {
    getPlatformLabel,
    REPAIR_STATUSES,
    STATUS_LABELS,
    type FailureCode,
    type RepairStatus,
} from "@/lib/enums";
export function RepairCard({
    repair: r,
    parts,
    onUpdate,
    onAddPart,
    onRemovePart,
    onUpdatePart,
    onDelete,
    loading = false,
}: {
    repair: RepairDto;
    parts: PartDto[];
    loading?: boolean;
    onUpdate: (id: number, fields: Partial<RepairDto>) => void;
    onAddPart: (repairId: number, partId: number, qty: number) => void;
    onRemovePart: (repairId: number, usageId: number, partName: string) => void;
    onUpdatePart: (
        repairId: number,
        usageId: number,
        partId: number,
        quantity: number
    ) => void;
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
        <EntityLoadingShell loading={loading}>
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
                <ul className="text-sm mb-4 space-y-2">
                    <li className="text-[var(--muted)]">Repuestos usados:</li>
                    {r.partUsages.map((u) => (
                        <RepairPartUsageRow
                            key={u.id}
                            usage={u}
                            repairId={r.id}
                            repairPlatform={r.platform}
                            parts={parts}
                            canEdit={
                                r.status !== "VENDIDO" &&
                                r.status !== "CANCELADO"
                            }
                            onUpdate={onUpdatePart}
                            onRemove={onRemovePart}
                        />
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
        </EntityLoadingShell>
    );
}

"use client";

import { useActionState, useCallback, useEffect, useMemo, useState } from "react";

import {
  addQualyLapAction,
  addQualySanctionAction,
  deleteQualyLapAction,
  deleteQualySanctionAction,
  updateQualyLapAction,
  updateQualySanctionAction,
  type QualyActionState,
} from "@/app/admin/qualy/actions";
import {
  formatLapTime,
  formatSanctionLabel,
  type QualyRow,
  type QualySanctionType,
  type QualySnapshot,
} from "@/lib/qualy";

type QualyBoardProps = {
  initialSnapshot: QualySnapshot;
};

const initialActionState: QualyActionState = {
  status: "idle",
};

export function QualyBoard({ initialSnapshot }: QualyBoardProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [selectedPilotId, setSelectedPilotId] = useState<number | null>(null);
  const [selectedSanctionPilotId, setSelectedSanctionPilotId] = useState<number | null>(null);
  const [sanctionType, setSanctionType] = useState<QualySanctionType>("segundos");

  const [lapState, lapAction, lapPending] = useActionState(
    addQualyLapAction,
    initialActionState,
  );
  const [sanctionState, sanctionAction, sanctionPending] = useActionState(
    addQualySanctionAction,
    initialActionState,
  );
  const [editLapState, editLapAction, editLapPending] = useActionState(
    updateQualyLapAction,
    initialActionState,
  );
  const [deleteLapState, deleteLapAction, deleteLapPending] = useActionState(
    deleteQualyLapAction,
    initialActionState,
  );
  const [editSanctionState, editSanctionAction, editSanctionPending] = useActionState(
    updateQualySanctionAction,
    initialActionState,
  );
  const [deleteSanctionState, deleteSanctionAction, deleteSanctionPending] = useActionState(
    deleteQualySanctionAction,
    initialActionState,
  );

  const refreshSnapshot = useCallback(async () => {
    const response = await fetch("/admin/qualy/data", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const nextSnapshot = (await response.json()) as QualySnapshot;
    setSnapshot(nextSnapshot);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) {
        return;
      }

      await refreshSnapshot();
    };

    run();
    const interval = setInterval(run, 2500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refreshSnapshot]);

  const selectedPilotLaps = useMemo(() => {
    if (selectedPilotId == null) {
      return null;
    }

    return snapshot.pilotLaps.find((pilot) => pilot.pilotoId === selectedPilotId) ?? null;
  }, [selectedPilotId, snapshot.pilotLaps]);

  const selectedPilotRow = useMemo(() => {
    if (selectedSanctionPilotId == null) {
      return null;
    }

    return snapshot.rows.find((pilot) => pilot.pilotoId === selectedSanctionPilotId) ?? null;
  }, [selectedSanctionPilotId, snapshot.rows]);

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 md:space-y-8">
      <div className="rounded-2xl border border-rks-line/80 bg-gradient-to-r from-rks-surface/95 via-zinc-950 to-zinc-950 p-4 shadow-lg shadow-black/20 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rks-amber/85">
              Qualy oficial
            </p>
            <h2 className="mt-1 text-2xl font-bold uppercase tracking-[0.08em] text-zinc-100 md:text-3xl">
              Clasificación oficial (5 minutos)
            </h2>
          </div>

          <span className="rounded-full border border-rks-line bg-black/25 px-3 py-1 text-xs font-semibold text-zinc-300">
            Actualización: 2.5s
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-rks-line/70 bg-rks-surface/80 p-4 shadow-xl shadow-black/25 md:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rks-blue/90">🟣 Best lap session</p>
        <h3 className="mt-1 text-lg font-bold text-white">Live ranking por mejor vuelta</h3>

        <form action={lapAction} className="mt-4 grid gap-2 lg:grid-cols-[minmax(0,1fr)_140px_auto]">
          <select
            name="pilotoId"
            required
            className="h-10 rounded-xl border border-rks-line bg-black/30 px-3 text-sm text-zinc-100"
          >
            <option value="">Selecciona piloto</option>
            {snapshot.pilots.map((pilot) => (
              <option key={pilot.id} value={pilot.id}>
                {pilot.nombre} {pilot.apellidos}
              </option>
            ))}
          </select>

          <input
            name="tiempo"
            required
            type="text"
            inputMode="decimal"
            placeholder="47.123"
            className="h-10 rounded-xl border border-rks-line bg-black/30 px-3 text-sm text-zinc-100"
          />

          <button
            type="submit"
            disabled={lapPending}
            className="h-10 rounded-xl bg-rks-blue px-4 text-sm font-semibold text-white"
          >
            {lapPending ? "Añadiendo..." : "Añadir vuelta"}
          </button>
        </form>

        <form action={sanctionAction} className="mt-3 grid gap-2 xl:grid-cols-[minmax(0,1fr)_180px_90px_minmax(0,1fr)_auto]">
          <select
            name="pilotoId"
            required
            className="h-10 rounded-xl border border-rks-line bg-black/30 px-3 text-sm text-zinc-100"
          >
            <option value="">Piloto sanción</option>
            {snapshot.pilots.map((pilot) => (
              <option key={pilot.id} value={pilot.id}>
                {pilot.nombre} {pilot.apellidos}
              </option>
            ))}
          </select>

          <select
            name="tipo"
            required
            value={sanctionType}
            onChange={(event) => setSanctionType(event.target.value as QualySanctionType)}
            className="h-10 rounded-xl border border-rks-line bg-black/30 px-2 text-sm text-zinc-100"
          >
            <option value="segundos">+ segundos</option>
            <option value="eliminar_mejor_vuelta">eliminar mejor vuelta</option>
          </select>

          <input
            name="valor"
            required={sanctionType === "segundos"}
            disabled={sanctionType !== "segundos"}
            type="text"
            inputMode="decimal"
            placeholder={sanctionType === "segundos" ? "3" : "n/a"}
            className="h-10 rounded-xl border border-rks-line bg-black/30 px-3 text-sm text-zinc-100 disabled:opacity-45"
          />

          <input
            name="motivo"
            required
            placeholder="Motivo sanción"
            className="h-10 rounded-xl border border-rks-line bg-black/30 px-3 text-sm text-zinc-100"
          />

          <button
            type="submit"
            disabled={sanctionPending}
            className="h-10 rounded-xl border border-rks-blue/60 bg-rks-blue/15 px-4 text-sm font-semibold text-rks-blue"
          >
            + Sanción
          </button>
        </form>

        <ActionStateMessage
          states={[
            lapState,
            sanctionState,
            editLapState,
            deleteLapState,
            editSanctionState,
            deleteSanctionState,
          ]}
        />

        <div className="mt-4 overflow-hidden rounded-xl border border-rks-line/70">
          <div className="grid grid-cols-[42px_minmax(0,1fr)_56px_92px_100px_84px_120px] gap-2 border-b border-rks-line/70 bg-black/25 px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400 md:px-3 md:text-xs">
            <p>Pos</p>
            <p>Piloto</p>
            <p>Kart</p>
            <p>Última</p>
            <p>Mejor</p>
            <p>Gap</p>
            <p>⚠️</p>
          </div>

          <div className="divide-y divide-rks-line/60">
            {snapshot.rows.map((row) => (
              <QualyOfficialRowItem
                key={row.pilotoId}
                row={row}
                fastestLap={snapshot.fastestLap}
                onOpenPilot={(pilotId) => setSelectedPilotId(pilotId)}
                onOpenSanctions={(pilotId) => setSelectedSanctionPilotId(pilotId)}
              />
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-rks-line/70 bg-black/20 p-4 md:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rks-amber/90">🏁 Parrilla de salida</p>
          <h4 className="mt-1 text-base font-bold text-zinc-100">Formación según qualy oficial</h4>

          <QualyParrillaGrid rows={snapshot.rows} />
        </div>
      </div>

      {selectedPilotLaps ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedPilotId(null)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-rks-line/70 bg-rks-surface p-4 shadow-2xl shadow-black/40"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-lg font-bold text-zinc-100">Vueltas · {selectedPilotLaps.piloto}</h4>
              <button
                type="button"
                onClick={() => setSelectedPilotId(null)}
                className="h-9 rounded-lg border border-rks-line bg-black/25 px-3 text-sm text-zinc-300"
              >
                Cerrar
              </button>
            </div>

            <div className="max-h-80 overflow-auto rounded-xl border border-rks-line/70">
              {selectedPilotLaps.laps.length === 0 ? (
                <p className="p-4 text-sm text-zinc-400">Sin vueltas registradas.</p>
              ) : (
                selectedPilotLaps.laps.map((lap) => (
                  <div
                    key={lap.id}
                    className={`border-b border-rks-line/50 px-4 py-2 text-sm ${
                      lap.isDeleted
                        ? "bg-red-950/25 text-red-300"
                        : lap.isBestFinal
                          ? "bg-rks-amber/10 text-rks-amber"
                          : "text-zinc-200"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        V{lap.numero}
                        {lap.isDeleted ? " · ❌ eliminada" : ""}
                        {lap.isBestFinal ? " · BEST FINAL" : ""}
                        {lap.isBestOriginal && !lap.isDeleted ? " · BEST RAW" : ""}
                      </span>
                      <span className="font-semibold">{formatLapTime(lap.tiempo)}</span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <form action={editLapAction} className="flex items-center gap-2">
                        <input type="hidden" name="lapId" value={lap.id} />
                        <input
                          name="tiempo"
                          required
                          type="text"
                          inputMode="decimal"
                          defaultValue={lap.tiempo.toFixed(3)}
                          className="h-9 w-24 rounded-lg border border-rks-line bg-black/30 px-2 text-sm text-zinc-100"
                        />
                        <button
                          type="submit"
                          disabled={editLapPending}
                          className="h-9 rounded-lg border border-rks-blue/60 bg-rks-blue/15 px-3 text-xs font-semibold text-rks-blue"
                        >
                          Guardar
                        </button>
                      </form>

                      <form action={deleteLapAction}>
                        <input type="hidden" name="lapId" value={lap.id} />
                        <button
                          type="submit"
                          disabled={deleteLapPending}
                          className="h-9 rounded-lg border border-red-500/60 bg-red-500/10 px-3 text-xs font-semibold text-red-300"
                        >
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {selectedPilotRow ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedSanctionPilotId(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-rks-line/70 bg-rks-surface p-4 shadow-2xl shadow-black/40"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <h4 className="text-lg font-bold text-zinc-100">Sanciones · {selectedPilotRow.piloto}</h4>
              <button
                type="button"
                onClick={() => setSelectedSanctionPilotId(null)}
                className="h-9 rounded-lg border border-rks-line bg-black/25 px-3 text-sm text-zinc-300"
              >
                Cerrar
              </button>
            </div>

            <div className="max-h-80 space-y-2 overflow-auto rounded-xl border border-rks-line/70 p-3">
              {selectedPilotRow.sanciones.length === 0 ? (
                <p className="text-sm text-zinc-400">Sin sanciones aplicadas.</p>
              ) : (
                selectedPilotRow.sanciones.map((sancion) => (
                  <div key={sancion.id} className="rounded-lg border border-rks-line/60 bg-black/20 p-2">
                    <form action={editSanctionAction} className="grid gap-2 md:grid-cols-[140px_90px_minmax(0,1fr)_auto]">
                      <input type="hidden" name="sancionId" value={sancion.id} />
                      <select
                        name="tipo"
                        defaultValue={sancion.tipo}
                        className="h-9 rounded-lg border border-rks-line bg-black/30 px-2 text-xs text-zinc-100"
                      >
                        <option value="segundos">+ segundos</option>
                        <option value="eliminar_mejor_vuelta">eliminar mejor vuelta</option>
                      </select>
                      <input
                        name="valor"
                        required
                        type="text"
                        inputMode="decimal"
                        defaultValue={sancion.valor.toString()}
                        className="h-9 rounded-lg border border-rks-line bg-black/30 px-2 text-xs text-zinc-100"
                      />
                      <input
                        name="motivo"
                        required
                        defaultValue={sancion.motivo}
                        className="h-9 rounded-lg border border-rks-line bg-black/30 px-2 text-xs text-zinc-100"
                      />
                      <button
                        type="submit"
                        disabled={editSanctionPending}
                        className="h-9 rounded-lg border border-rks-blue/60 bg-rks-blue/15 px-3 text-xs font-semibold text-rks-blue"
                      >
                        Guardar
                      </button>
                    </form>

                    <form action={deleteSanctionAction} className="mt-2">
                      <input type="hidden" name="sancionId" value={sancion.id} />
                      <button
                        type="submit"
                        disabled={deleteSanctionPending}
                        className="h-8 rounded-lg border border-red-500/60 bg-red-500/10 px-3 text-xs font-semibold text-red-300"
                      >
                        Eliminar sanción
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ActionStateMessage({ states }: { states: QualyActionState[] }) {
  const error = states.find((state) => state.status === "error");
  const success = states.find((state) => state.status === "success");

  if (error?.message) {
    return <p className="mt-2 text-sm text-red-300">{error.message}</p>;
  }

  if (success?.message) {
    return <p className="mt-2 text-sm text-emerald-300">{success.message}</p>;
  }

  return null;
}

function QualyOfficialRowItem({
  row,
  fastestLap,
  onOpenPilot,
  onOpenSanctions,
}: {
  row: QualyRow;
  fastestLap: { pilotoId: number; tiempo: number } | null;
  onOpenPilot: (pilotId: number) => void;
  onOpenSanctions: (pilotId: number) => void;
}) {
  const isFastest =
    fastestLap != null &&
    fastestLap.pilotoId === row.pilotoId &&
    row.mejorVueltaFinal != null &&
    row.mejorVueltaFinal === fastestLap.tiempo;

  const sanctionsLabel = row.sanciones
    .map((sanction) =>
      formatSanctionLabel(
        sanction.tipo as QualySanctionType,
        sanction.valor,
      ),
    )
    .join(" · ");

  const deletedLabel =
    row.eliminaciones > 0 &&
    row.mejorVueltaOriginal != null &&
    row.mejorVueltaFinal != null
      ? `❌ ${formatLapTime(row.mejorVueltaOriginal)} → ${formatLapTime(
          row.mejorVueltaFinal - row.sancionSegundos,
        )}`
      : row.eliminaciones > 0
        ? "Best lap deleted"
        : null;

  return (
    <div className="grid grid-cols-[42px_minmax(0,1fr)_56px_92px_100px_84px_120px] items-center gap-2 px-2 py-2 text-sm md:px-3">
      <p className="font-semibold text-zinc-100">{row.pos}</p>
      <button
        type="button"
        onClick={() => onOpenPilot(row.pilotoId)}
        className="truncate text-left text-zinc-100 underline-offset-2 hover:underline"
      >
        {row.piloto}
      </button>
      <p className="text-zinc-300">{row.kart ?? "—"}</p>
      <p className="text-zinc-100">{formatLapTime(row.ultimaVuelta)}</p>
      <p className={`font-semibold ${isFastest ? "text-emerald-300" : "text-zinc-100"}`}>
        {formatLapTime(row.mejorVueltaFinal)}
      </p>
      <p className="text-zinc-200">{row.gap}</p>

      {row.sanciones.length > 0 ? (
        <button
          type="button"
          onClick={() => onOpenSanctions(row.pilotoId)}
          className="rounded-lg border border-rks-amber/60 bg-rks-amber/10 px-2 py-1 text-[11px] font-semibold text-rks-amber"
          title={deletedLabel ?? sanctionsLabel}
        >
          {row.sancionSegundos > 0 ? `+${row.sancionSegundos}s` : "❌ lap"}
        </button>
      ) : (
        <span className="text-xs text-zinc-500">—</span>
      )}
    </div>
  );
}

function QualyParrillaGrid({ rows }: { rows: QualyRow[] }) {
  const orderedRows = rows.filter((row) => row.mejorVueltaFinal != null);
  const leftLane = orderedRows.filter((row) => row.pos % 2 === 1);
  const rightLane = orderedRows.filter((row) => row.pos % 2 === 0);
  const laneRows = Math.max(leftLane.length, rightLane.length);

  if (orderedRows.length === 0) {
    return (
      <p className="mt-3 rounded-xl border border-rks-line/70 bg-black/20 p-3 text-sm text-zinc-400">
        Añade vueltas de qualy para generar la parrilla.
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-xl border-x-2 border-rks-line/70 px-2 py-2 md:px-4 md:py-3">
      <div className="grid grid-cols-2 gap-3 md:gap-5">
        <div className="space-y-3 md:space-y-4">
          {Array.from({ length: laneRows }, (_, index) => (
            <QualyParrillaSlot key={`q-left-slot-${index}`} row={leftLane[index] ?? null} />
          ))}
        </div>

        <div className="space-y-3 pt-6 md:space-y-4 md:pt-8">
          {Array.from({ length: laneRows }, (_, index) => (
            <QualyParrillaSlot key={`q-right-slot-${index}`} row={rightLane[index] ?? null} />
          ))}
        </div>
      </div>
    </div>
  );
}

function QualyParrillaSlot({ row }: { row: QualyRow | null }) {
  if (!row) {
    return <div className="relative h-24 rounded-xl border-2 border-dashed border-rks-line/60 bg-black/20" />;
  }

  return (
    <div className="relative h-24 rounded-xl border-2 border-rks-blue/45 bg-gradient-to-br from-rks-surface/90 to-black/50 p-2.5 shadow-md shadow-black/25">
      <div className="absolute left-2 right-2 top-1.5 h-1 rounded bg-white/15" />

      <div className="flex h-full flex-col justify-end">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="inline-flex min-w-9 items-center justify-center rounded-lg bg-rks-blue/20 px-2 py-0.5 text-xs font-bold text-rks-blue md:text-sm">
            P{row.pos}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 md:text-[11px]">
            {row.kart != null ? `Kart ${row.kart}` : "Sin kart"}
          </span>
        </div>

        <p className="truncate text-xs font-semibold text-zinc-100 md:text-sm">{row.piloto}</p>
        <p className="text-[11px] text-zinc-400">{formatLapTime(row.mejorVueltaFinal)}</p>
      </div>
    </div>
  );
}

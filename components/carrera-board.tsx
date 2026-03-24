"use client";

import { useActionState, useCallback, useEffect, useMemo, useState } from "react";

import {
  addCarreraLapAction,
  addCarreraSanctionAction,
  deleteCarreraLapAction,
  deleteCarreraSanctionAction,
  finalizeCarreraAction,
  updateCarreraLapAction,
  updateCarreraSanctionAction,
  type CarreraActionState,
} from "@/app/admin/carrera/actions";
import {
  formatLapTime,
  formatSanctionLabel,
  type CarreraRow,
  type CarreraSanctionType,
  type CarreraSnapshot,
} from "@/lib/carrera";

type CarreraBoardProps = {
  initialSnapshot: CarreraSnapshot;
};

const initialActionState: CarreraActionState = {
  status: "idle",
};

export function CarreraBoard({ initialSnapshot }: CarreraBoardProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [replayLap, setReplayLap] = useState<number | null>(initialSnapshot.replayLap);
  const [selectedPilotId, setSelectedPilotId] = useState<number | null>(null);
  const [selectedSanctionPilotId, setSelectedSanctionPilotId] = useState<number | null>(null);

  const [lapState, lapAction, lapPending] = useActionState(
    addCarreraLapAction,
    initialActionState,
  );
  const [sanctionState, sanctionAction, sanctionPending] = useActionState(
    addCarreraSanctionAction,
    initialActionState,
  );
  const [finalizeState, finalizeAction, finalizePending] = useActionState(
    finalizeCarreraAction,
    initialActionState,
  );
  const [editLapState, editLapAction, editLapPending] = useActionState(
    updateCarreraLapAction,
    initialActionState,
  );
  const [deleteLapState, deleteLapAction, deleteLapPending] = useActionState(
    deleteCarreraLapAction,
    initialActionState,
  );
  const [editSanctionState, editSanctionAction, editSanctionPending] = useActionState(
    updateCarreraSanctionAction,
    initialActionState,
  );
  const [deleteSanctionState, deleteSanctionAction, deleteSanctionPending] = useActionState(
    deleteCarreraSanctionAction,
    initialActionState,
  );

  const replayOptions = useMemo(
    () => Array.from({ length: snapshot.maxLap }, (_, index) => index + 1),
    [snapshot.maxLap],
  );

  const refreshSnapshot = useCallback(async () => {
    const params = new URLSearchParams();
    if (replayLap != null) {
      params.set("replayLap", String(replayLap));
    }

    const url = `/admin/carrera/data${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      return;
    }

    const nextSnapshot = (await response.json()) as CarreraSnapshot;
    setSnapshot(nextSnapshot);
  }, [replayLap]);

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

    return snapshot.raceLaps.find((pilot) => pilot.pilotoId === selectedPilotId) ?? null;
  }, [selectedPilotId, snapshot.raceLaps]);

  const selectedPilotRow = useMemo(() => {
    if (selectedSanctionPilotId == null) {
      return null;
    }

    return snapshot.raceRows.find((row) => row.pilotoId === selectedSanctionPilotId) ?? null;
  }, [selectedSanctionPilotId, snapshot.raceRows]);

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 md:space-y-8">
      <div className="rounded-2xl border border-rks-line/80 bg-gradient-to-r from-rks-surface/95 via-zinc-950 to-zinc-950 p-4 shadow-lg shadow-black/20 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rks-amber/85">
              Carrera final
            </p>
            <h2 className="mt-1 text-2xl font-bold uppercase tracking-[0.08em] text-zinc-100 md:text-3xl">
              Live timing · 20 vueltas
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
              Replay
            </label>
            <select
              value={replayLap ?? ""}
              onChange={(event) =>
                setReplayLap(event.target.value ? Number(event.target.value) : null)
              }
              className="h-10 rounded-xl border border-rks-line bg-zinc-950/90 px-3 text-sm text-zinc-200"
            >
              <option value="">Live</option>
              {replayOptions.map((lap) => (
                <option key={lap} value={lap}>
                  Hasta vuelta {lap}
                </option>
              ))}
            </select>
            <span className="rounded-full border border-rks-line bg-black/25 px-3 py-1 text-xs font-semibold text-zinc-300">
              Actualización: 2.5s
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-rks-line/70 bg-rks-surface/80 p-4 shadow-xl shadow-black/25 md:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rks-blue/90">🏁 Parrilla de salida</p>
        <h3 className="mt-1 text-lg font-bold text-white">Formación según qualy oficial</h3>
        <CarreraStartingGrid rows={snapshot.startingGrid} />
      </div>

      <div className="rounded-2xl border border-rks-line/70 bg-rks-surface/80 p-4 shadow-xl shadow-black/25 md:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">🟢 Carrera (20 vueltas)</p>
        <h3 className="mt-1 text-lg font-bold text-white">Clasificación en vivo</h3>

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
              placeholder="52.456"
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

        <form action={sanctionAction} className="mt-3 grid gap-2 xl:grid-cols-[minmax(0,1fr)_120px_90px_minmax(0,1fr)_auto]">
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
            className="h-10 rounded-xl border border-rks-line bg-black/30 px-2 text-sm text-zinc-100"
          >
            <option value="segundos">+ segundos</option>
            <option value="posiciones">- posiciones</option>
          </select>
          <input
            name="valor"
            required
            type="text"
            inputMode="decimal"
            placeholder="5"
            className="h-10 rounded-xl border border-rks-line bg-black/30 px-3 text-sm text-zinc-100"
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
            finalizeState,
            editLapState,
            deleteLapState,
            editSanctionState,
            deleteSanctionState,
          ]}
        />

        <div className="mt-4 hidden overflow-hidden rounded-xl border border-rks-line/70 md:block">
          <div className="grid grid-cols-[42px_minmax(0,1fr)_56px_88px_88px_84px_70px] gap-2 border-b border-rks-line/70 bg-black/25 px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400 md:px-3 md:text-xs">
            <p>Pos</p>
            <p>Piloto</p>
            <p>Kart</p>
            <p>Última</p>
            <p>Mejor</p>
            <p>Gap</p>
            <p>⚠️</p>
          </div>

          <div className="divide-y divide-rks-line/60">
            {snapshot.raceRows.map((row) => (
              <CarreraRowItem
                key={row.pilotoId}
                row={row}
                fastestLap={snapshot.fastestLap}
                onOpenPilot={(pilotId) => setSelectedPilotId(pilotId)}
                onOpenSanctions={(pilotId) => setSelectedSanctionPilotId(pilotId)}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2 md:hidden">
          {snapshot.raceRows.map((row) => (
            <CarreraRowItemMobile
              key={`mobile-carrera-${row.pilotoId}`}
              row={row}
              fastestLap={snapshot.fastestLap}
              onOpenPilot={(pilotId) => setSelectedPilotId(pilotId)}
              onOpenSanctions={(pilotId) => setSelectedSanctionPilotId(pilotId)}
            />
          ))}
        </div>

        <form action={finalizeAction} className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rks-line/70 bg-black/20 p-3">
          <p className="text-sm text-zinc-300">
            Objetivo: {snapshot.targetLaps} vueltas · líder actual: {snapshot.raceRows[0]?.laps ?? 0} vueltas
          </p>

          <button
            type="submit"
            disabled={finalizePending}
            className="h-10 rounded-xl bg-rks-amber px-4 text-sm font-bold text-zinc-950 transition hover:brightness-110 disabled:opacity-70"
          >
            {finalizePending ? "Calculando..." : "Finalizar carrera y guardar puntos"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-rks-line/70 bg-rks-surface/80 p-4 shadow-xl shadow-black/25 md:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rks-amber/90">🏆 Resultados guardados</p>
        {snapshot.savedResults.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">Todavía no hay resultados finales guardados.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-rks-line/70">
            <div className="grid grid-cols-[56px_minmax(0,1fr)_80px] gap-2 border-b border-rks-line/70 bg-black/25 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
              <p>Pos</p>
              <p>Piloto</p>
              <p>Puntos</p>
            </div>
            <div className="divide-y divide-rks-line/60">
              {snapshot.savedResults.map((result) => (
                <div key={`${result.pilotoId}-${result.posicion}`} className="grid grid-cols-[56px_minmax(0,1fr)_80px] gap-2 px-3 py-2 text-sm">
                  <p className="font-semibold text-zinc-100">{result.posicion}</p>
                  <p className="truncate text-zinc-100">{result.piloto}</p>
                  <p className="font-semibold text-rks-amber">{result.puntos}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedPilotLaps ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedPilotId(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-rks-line/70 bg-rks-surface p-4 shadow-2xl shadow-black/40" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-lg font-bold text-zinc-100">Vueltas · {selectedPilotLaps.piloto}</h4>
              <button type="button" onClick={() => setSelectedPilotId(null)} className="h-9 rounded-lg border border-rks-line bg-black/25 px-3 text-sm text-zinc-300">
                Cerrar
              </button>
            </div>

            <div className="mb-3 rounded-xl border border-rks-line/70 bg-black/20 px-3 py-2 text-sm text-zinc-200">
              Tiempo total: <span className="font-semibold">{formatLapTime(selectedPilotLaps.totalTime)}</span>
            </div>

            <div className="max-h-72 overflow-auto rounded-xl border border-rks-line/70">
              {selectedPilotLaps.laps.length === 0 ? (
                <p className="p-4 text-sm text-zinc-400">Sin vueltas registradas.</p>
              ) : (
                selectedPilotLaps.laps.map((lap) => (
                  <div key={lap.id} className={`border-b border-rks-line/50 px-4 py-2 text-sm ${lap.esMejor ? "bg-rks-amber/10 text-rks-amber" : "text-zinc-200"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>Vuelta {lap.numero}</span>
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedSanctionPilotId(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-rks-line/70 bg-rks-surface p-4 shadow-2xl shadow-black/40" onClick={(event) => event.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h4 className="text-lg font-bold text-zinc-100">Sanciones · {selectedPilotRow.piloto}</h4>
              <button type="button" onClick={() => setSelectedSanctionPilotId(null)} className="h-9 rounded-lg border border-rks-line bg-black/25 px-3 text-sm text-zinc-300">
                Cerrar
              </button>
            </div>

            <div className="max-h-80 space-y-2 overflow-auto rounded-xl border border-rks-line/70 p-3">
              {selectedPilotRow.sanciones.length === 0 ? (
                <p className="text-sm text-zinc-400">Sin sanciones aplicadas.</p>
              ) : (
                selectedPilotRow.sanciones.map((sancion) => (
                  <div key={sancion.id} className="rounded-lg border border-rks-line/60 bg-black/20 p-2">
                    <form action={editSanctionAction} className="grid gap-2 md:grid-cols-[120px_90px_minmax(0,1fr)_auto]">
                      <input type="hidden" name="sancionId" value={sancion.id} />
                      <select
                        name="tipo"
                        defaultValue={sancion.tipo}
                        className="h-9 rounded-lg border border-rks-line bg-black/30 px-2 text-xs text-zinc-100"
                      >
                        <option value="segundos">+ segundos</option>
                        <option value="posiciones">- posiciones</option>
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

function ActionStateMessage({ states }: { states: CarreraActionState[] }) {
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

function CarreraStartingGrid({
  rows,
}: {
  rows: Array<{
    pos: number;
    pilotoId: number;
    piloto: string;
    kart: number | null;
    tiempoQualy: number | null;
  }>;
}) {
  const leftLane = rows.filter((row) => row.pos % 2 === 1);
  const rightLane = rows.filter((row) => row.pos % 2 === 0);
  const laneRows = Math.max(leftLane.length, rightLane.length);

  if (rows.length === 0) {
    return (
      <p className="mt-3 rounded-xl border border-rks-line/70 bg-black/20 p-3 text-sm text-zinc-400">
        No hay resultados de qualy oficial para formar parrilla.
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-xl border-x-2 border-rks-line/70 px-2 py-2 md:px-4 md:py-3">
      <div className="grid grid-cols-2 gap-3 md:gap-5">
        <div className="space-y-3 md:space-y-4">
          {Array.from({ length: laneRows }, (_, index) => (
            <GridSlot key={`c-left-slot-${index}`} row={leftLane[index] ?? null} />
          ))}
        </div>

        <div className="space-y-3 pt-6 md:space-y-4 md:pt-8">
          {Array.from({ length: laneRows }, (_, index) => (
            <GridSlot key={`c-right-slot-${index}`} row={rightLane[index] ?? null} />
          ))}
        </div>
      </div>
    </div>
  );
}

function GridSlot({
  row,
}: {
  row: {
    pos: number;
    pilotoId: number;
    piloto: string;
    kart: number | null;
    tiempoQualy: number | null;
  } | null;
}) {
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
        <p className="text-[11px] text-zinc-400">{formatLapTime(row.tiempoQualy)}</p>
      </div>
    </div>
  );
}

function CarreraRowItem({
  row,
  fastestLap,
  onOpenPilot,
  onOpenSanctions,
}: {
  row: CarreraRow;
  fastestLap: { pilotoId: number; tiempo: number } | null;
  onOpenPilot: (pilotId: number) => void;
  onOpenSanctions: (pilotId: number) => void;
}) {
  const isFastest =
    fastestLap != null &&
    fastestLap.pilotoId === row.pilotoId &&
    row.mejorVuelta != null &&
    row.mejorVuelta === fastestLap.tiempo;

  const sanctionsLabel = row.sanciones
    .map((sanction) =>
      formatSanctionLabel(
        sanction.tipo as CarreraSanctionType,
        sanction.valor,
      ),
    )
    .join(" · ");

  return (
    <div className="grid grid-cols-[42px_minmax(0,1fr)_56px_88px_88px_84px_70px] items-center gap-2 px-2 py-2 text-sm md:px-3">
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
        {formatLapTime(row.mejorVuelta)}
      </p>
      <p className="text-zinc-200">{row.gap}</p>

      {row.sanciones.length > 0 ? (
        <button
          type="button"
          onClick={() => onOpenSanctions(row.pilotoId)}
          className="rounded-lg border border-rks-amber/60 bg-rks-amber/10 px-2 py-1 text-[11px] font-semibold text-rks-amber"
          title={sanctionsLabel}
        >
          {sanctionsLabel}
        </button>
      ) : (
        <span className="text-xs text-zinc-500">—</span>
      )}
    </div>
  );
}

function CarreraRowItemMobile({
  row,
  fastestLap,
  onOpenPilot,
  onOpenSanctions,
}: {
  row: CarreraRow;
  fastestLap: { pilotoId: number; tiempo: number } | null;
  onOpenPilot: (pilotId: number) => void;
  onOpenSanctions: (pilotId: number) => void;
}) {
  const isFastest =
    fastestLap != null &&
    fastestLap.pilotoId === row.pilotoId &&
    row.mejorVuelta != null &&
    row.mejorVuelta === fastestLap.tiempo;

  const sanctionsLabel = row.sanciones
    .map((sanction) =>
      formatSanctionLabel(
        sanction.tipo as CarreraSanctionType,
        sanction.valor,
      ),
    )
    .join(" · ");

  return (
    <article className="rounded-xl border border-rks-line/70 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpenPilot(row.pilotoId)}
          className="truncate text-left text-sm font-bold text-zinc-100 underline-offset-2 hover:underline"
        >
          P{row.pos} · {row.piloto}
        </button>
        <span className="shrink-0 rounded-md border border-rks-line/70 bg-black/25 px-2 py-1 text-xs text-zinc-300">
          Kart {row.kart ?? "—"}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-300">
        <p>
          Última: <span className="font-semibold text-zinc-100">{formatLapTime(row.ultimaVuelta)}</span>
        </p>
        <p>
          Mejor: <span className={`font-semibold ${isFastest ? "text-emerald-300" : "text-zinc-100"}`}>{formatLapTime(row.mejorVuelta)}</span>
        </p>
        <p>
          Gap: <span className="font-semibold text-zinc-100">{row.gap}</span>
        </p>
        <p>
          Vueltas: <span className="font-semibold text-zinc-100">{row.laps}</span>
        </p>
      </div>

      {row.sanciones.length > 0 ? (
        <button
          type="button"
          onClick={() => onOpenSanctions(row.pilotoId)}
          className="mt-2 rounded-lg border border-rks-amber/60 bg-rks-amber/10 px-2 py-1 text-xs font-semibold text-rks-amber"
          title={sanctionsLabel}
        >
          {sanctionsLabel}
        </button>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">Sin sanción</p>
      )}
    </article>
  );
}

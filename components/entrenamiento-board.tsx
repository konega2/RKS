"use client";

import Image from "next/image";
import { useActionState, useCallback, useEffect, useMemo, useState } from "react";

import {
  addRaceLapAction,
  addSanctionAction,
  deleteLapAction as deleteLapServerAction,
  deleteSanctionAction as deleteSanctionServerAction,
  setQualyLapAction,
  updateLapAction,
  updateSanctionAction,
  type EntrenamientoActionState,
} from "@/app/admin/entrenamiento/actions";
import {
  ENTRENO_CARRERA_SESSION,
  ENTRENO_QUALY_SESSION,
  type EntrenoSession,
  formatLapTime,
  formatSanctionLabel,
  type EntrenamientoSnapshot,
  type QualyRow,
  type RaceRow,
} from "@/lib/entrenamiento";

type EntrenamientoBoardProps = {
  initialSnapshot: EntrenamientoSnapshot;
};

type SanctionDetail = {
  pilotoId: number;
  sesion: EntrenoSession;
};

const initialActionState: EntrenamientoActionState = {
  status: "idle",
};

export function EntrenamientoBoard({ initialSnapshot }: EntrenamientoBoardProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [replayLap, setReplayLap] = useState<number | null>(initialSnapshot.replayLap);
  const [selectedPilot, setSelectedPilot] = useState<{
    pilotoId: number;
    sesion: EntrenoSession;
  } | null>(null);
  const [selectedSanction, setSelectedSanction] = useState<SanctionDetail | null>(null);

  const [qualyState, qualyAction, qualyPending] = useActionState(
    setQualyLapAction,
    initialActionState,
  );
  const [raceState, raceAction, racePending] = useActionState(
    addRaceLapAction,
    initialActionState,
  );
  const [sancionState, sancionAction, sancionPending] = useActionState(
    addSanctionAction,
    initialActionState,
  );
  const [editLapState, editLapAction, editLapPending] = useActionState(
    updateLapAction,
    initialActionState,
  );
  const [deleteLapState, deleteLapAction, deleteLapPending] = useActionState(
    deleteLapServerAction,
    initialActionState,
  );
  const [editSanctionState, editSanctionAction, editSanctionPending] = useActionState(
    updateSanctionAction,
    initialActionState,
  );
  const [deleteSanctionState, deleteSanctionAction, deleteSanctionPending] = useActionState(
    deleteSanctionServerAction,
    initialActionState,
  );

  const replayOptions = useMemo(
    () =>
      Array.from({ length: snapshot.maxRaceLap }, (_, index) => index + 1),
    [snapshot.maxRaceLap],
  );

  const refreshSnapshot = useCallback(async (signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (replayLap != null) {
      params.set("replayLap", String(replayLap));
    }

    const url = `/admin/entrenamiento/data${params.toString() ? `?${params.toString()}` : ""}`;
    try {
      const response = await fetch(url, { cache: "no-store", signal });

      if (!response.ok) {
        return;
      }

      const nextSnapshot = (await response.json()) as EntrenamientoSnapshot;
      setSnapshot(nextSnapshot);
    } catch {
      return;
    }
  }, [replayLap]);

  useEffect(() => {
    let cancelled = false;
    let controller: AbortController | null = null;

    const run = async () => {
      if (cancelled) {
        return;
      }

      controller?.abort();
      controller = new AbortController();
      await refreshSnapshot(controller.signal);
    };

    run();
    const interval = setInterval(run, 2500);

    return () => {
      cancelled = true;
      controller?.abort();
      clearInterval(interval);
    };
  }, [refreshSnapshot]);

  const selectedPilotLaps = useMemo(() => {
    if (selectedPilot == null) {
      return null;
    }

    if (selectedPilot.sesion === ENTRENO_CARRERA_SESSION) {
      return snapshot.raceLapSummary.find((pilot) => pilot.pilotoId === selectedPilot.pilotoId) ?? null;
    }

    const qualyRow = snapshot.qualyRows.find((row) => row.pilotoId === selectedPilot.pilotoId) ?? null;
    if (!qualyRow) {
      return null;
    }

    return {
      pilotoId: qualyRow.pilotoId,
      piloto: qualyRow.piloto,
      laps: qualyRow.lapId != null && qualyRow.tiempoOriginal != null
        ? [{ id: qualyRow.lapId, numero: 1, tiempo: qualyRow.tiempoOriginal, esMejor: true }]
        : [],
    };
  }, [selectedPilot, snapshot.qualyRows, snapshot.raceLapSummary]);

  const selectedSanctionRows = useMemo(() => {
    if (!selectedSanction) {
      return null;
    }

    if (selectedSanction.sesion === ENTRENO_CARRERA_SESSION) {
      return snapshot.raceRows.find((row) => row.pilotoId === selectedSanction.pilotoId) ?? null;
    }

    return snapshot.qualyRows.find((row) => row.pilotoId === selectedSanction.pilotoId) ?? null;
  }, [selectedSanction, snapshot.qualyRows, snapshot.raceRows]);

  const pilotsById = useMemo(
    () => new Map(snapshot.pilots.map((pilot) => [pilot.id, pilot])),
    [snapshot.pilots],
  );

  const podiumRows = useMemo(
    () => snapshot.raceRows.filter((row) => row.laps > 0 && row.tiempoTotal != null).slice(0, 3),
    [snapshot.raceRows],
  );

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 md:space-y-8">
      <div className="rounded-2xl border border-rks-line/80 bg-gradient-to-r from-rks-surface/95 via-zinc-950 to-zinc-950 p-4 shadow-lg shadow-black/20 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rks-amber/85">
              Entrenamiento
            </p>
            <h2 className="mt-1 text-2xl font-bold uppercase tracking-[0.08em] text-zinc-100 md:text-3xl">
              Qualy + Carrera (Live Timing)
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

      <div className="grid gap-5">
        <div className="rounded-2xl border border-rks-line/70 bg-rks-surface/80 p-4 shadow-xl shadow-black/25 md:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rks-blue/90">🔵 Qualy (1 vuelta)</p>
          <h3 className="mt-1 text-lg font-bold text-white">Clasificación final</h3>

          <form action={qualyAction} className="mt-4 grid gap-2 lg:grid-cols-[minmax(0,1fr)_140px_auto]">
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
              disabled={qualyPending}
              className="h-10 rounded-xl bg-rks-blue px-4 text-sm font-semibold text-white"
            >
              {qualyPending ? "Guardando..." : "Guardar qualy"}
            </button>
          </form>

          <form action={sancionAction} className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_100px_minmax(0,1fr)_auto]">
            <input type="hidden" name="sesion" value={ENTRENO_QUALY_SESSION} />
            <input type="hidden" name="tipo" value="segundos" />
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
            <input
              name="valor"
              required
              type="text"
              inputMode="decimal"
              placeholder="+3s"
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
              disabled={sancionPending}
              className="h-10 rounded-xl border border-rks-blue/60 bg-rks-blue/15 px-4 text-sm font-semibold text-rks-blue"
            >
              + Sanción
            </button>
          </form>

          <StateMessage
            states={[
              qualyState,
              sancionState,
              editLapState,
              deleteLapState,
              editSanctionState,
              deleteSanctionState,
            ]}
          />

          <div className="mt-4 overflow-hidden rounded-xl border border-rks-line/70 md:block hidden">
            <div className="grid grid-cols-[50px_minmax(0,1fr)_110px_90px] gap-2 border-b border-rks-line/70 bg-black/25 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
              <p>Pos</p>
              <p>Piloto</p>
              <p>Tiempo</p>
              <p>⚠️</p>
            </div>

            <div className="divide-y divide-rks-line/60">
              {snapshot.qualyRows.map((row) => (
                <QualyRowItem
                  key={row.pilotoId}
                  row={row}
                  onOpenPilot={(pilotId) => setSelectedPilot({ pilotoId: pilotId, sesion: ENTRENO_QUALY_SESSION })}
                  onOpenSanction={(detail) => setSelectedSanction(detail)}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-2 md:hidden">
            {snapshot.qualyRows.map((row) => (
              <QualyRowItemMobile
                key={`mobile-qualy-${row.pilotoId}`}
                row={row}
                onOpenPilot={(pilotId) => setSelectedPilot({ pilotoId: pilotId, sesion: ENTRENO_QUALY_SESSION })}
                onOpenSanction={(detail) => setSelectedSanction(detail)}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-rks-line/70 bg-rks-surface/80 p-4 shadow-xl shadow-black/25 md:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rks-amber/90">🏁 Parrilla de salida</p>
          <h3 className="mt-1 text-lg font-bold text-white">Formación automática según qualy</h3>

          <ParrillaGrid rows={snapshot.qualyRows} />
        </div>

        <div className="rounded-2xl border border-rks-line/70 bg-rks-surface/80 p-4 shadow-xl shadow-black/25 md:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">🟢 Carrera (8 minutos)</p>
          <h3 className="mt-1 text-lg font-bold text-white">Live timing</h3>

          <form action={raceAction} className="mt-4 grid gap-2 lg:grid-cols-[minmax(0,1fr)_140px_auto]">
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
              disabled={racePending}
              className="h-10 rounded-xl bg-rks-blue px-4 text-sm font-semibold text-white"
            >
              {racePending ? "Añadiendo..." : "Añadir vuelta"}
            </button>
          </form>

          <form action={sancionAction} className="mt-3 grid gap-2 xl:grid-cols-[minmax(0,1fr)_120px_90px_minmax(0,1fr)_auto]">
            <input type="hidden" name="sesion" value={ENTRENO_CARRERA_SESSION} />
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
              disabled={sancionPending}
              className="h-10 rounded-xl border border-rks-blue/60 bg-rks-blue/15 px-4 text-sm font-semibold text-rks-blue"
            >
              + Sanción
            </button>
          </form>

          <StateMessage
            states={[
              raceState,
              sancionState,
              editLapState,
              deleteLapState,
              editSanctionState,
              deleteSanctionState,
            ]}
          />

          <div className="mt-4 overflow-hidden rounded-xl border border-rks-line/70 md:block hidden">
            <div className="grid grid-cols-[42px_minmax(0,1fr)_56px_88px_88px_92px_84px_70px] gap-2 border-b border-rks-line/70 bg-black/25 px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400 md:px-3 md:text-xs">
              <p>Pos</p>
              <p>Piloto</p>
              <p>Kart</p>
              <p>Mejor</p>
              <p>Última</p>
              <p>Total</p>
              <p>Gap</p>
              <p>⚠️</p>
            </div>

            <div className="divide-y divide-rks-line/60">
              {snapshot.raceRows.map((row) => (
                <RaceRowItem
                  key={row.pilotoId}
                  row={row}
                  fastestRaceLap={snapshot.fastestRaceLap}
                  onOpenPilot={(pilotId) => setSelectedPilot({ pilotoId: pilotId, sesion: ENTRENO_CARRERA_SESSION })}
                  onOpenSanction={(detail) => setSelectedSanction(detail)}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-2 md:hidden">
            {snapshot.raceRows.map((row) => (
              <RaceRowItemMobile
                key={`mobile-race-${row.pilotoId}`}
                row={row}
                fastestRaceLap={snapshot.fastestRaceLap}
                  onOpenPilot={(pilotId) => setSelectedPilot({ pilotoId: pilotId, sesion: ENTRENO_CARRERA_SESSION })}
                onOpenSanction={(detail) => setSelectedSanction(detail)}
              />
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-rks-line/70 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rks-amber/90">🏆 Podio</p>

            {podiumRows.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-400">
                Completa vueltas de carrera para mostrar ganadores.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
                {[1, 0, 2].map((index) => {
                  const row = podiumRows[index];
                  if (!row) {
                    return <div key={`podium-empty-${index}`} />;
                  }

                  const pilot = pilotsById.get(row.pilotoId);
                  const photo = pilot?.foto ? `/uploads/${pilot.foto}` : null;
                  const isWinner = row.pos === 1;
                  const pedestalHeight = row.pos === 1 ? "h-16" : row.pos === 2 ? "h-12" : "h-9";

                  return (
                    <div key={row.pilotoId} className="flex flex-col justify-end">
                      <div
                        className={`rounded-xl border p-3 text-center shadow-md shadow-black/25 ${
                          isWinner
                            ? "border-rks-amber/60 bg-rks-amber/10"
                            : "border-rks-line/70 bg-rks-surface/70"
                        }`}
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                          P{row.pos}
                        </p>

                        <div className="mx-auto mt-2 h-16 w-16 overflow-hidden rounded-full border border-rks-line/80 bg-black/25 md:h-20 md:w-20">
                          {photo ? (
                            <Image
                              src={photo}
                              alt={row.piloto}
                              width={96}
                              height={96}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xl font-bold text-rks-blue">
                              {row.piloto.charAt(0)}
                            </div>
                          )}
                        </div>

                        <p className="mt-2 truncate text-sm font-semibold text-zinc-100 md:text-base">
                          {row.piloto}
                        </p>
                        <p className="text-xs text-zinc-400">Total: {formatLapTime(row.tiempoTotal)}</p>
                      </div>

                      <div
                        className={`mt-2 rounded-b-xl border border-rks-line/70 ${pedestalHeight} ${
                          isWinner ? "bg-rks-amber/20" : "bg-black/30"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedPilotLaps ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedPilot(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-rks-line/70 bg-rks-surface p-4 shadow-2xl shadow-black/40"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-lg font-bold text-zinc-100">Vueltas - {selectedPilotLaps.piloto}</h4>
              <button
                type="button"
                onClick={() => setSelectedPilot(null)}
                className="h-9 rounded-lg border border-rks-line bg-black/25 px-3 text-sm text-zinc-300"
              >
                Cerrar
              </button>
            </div>

            <div className="max-h-72 overflow-auto rounded-xl border border-rks-line/70">
              {selectedPilotLaps.laps.length === 0 ? (
                <p className="p-4 text-sm text-zinc-400">Sin vueltas registradas.</p>
              ) : (
                selectedPilotLaps.laps.map((lap) => (
                  <div
                    key={lap.id}
                    className={`border-b border-rks-line/50 px-4 py-2 text-sm ${
                      lap.esMejor ? "bg-rks-amber/10 text-rks-amber" : "text-zinc-200"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>Vuelta {lap.numero}</span>
                      <span className="font-semibold">{formatLapTime(lap.tiempo)}</span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <form action={editLapAction} className="flex items-center gap-2">
                        <input type="hidden" name="lapId" value={lap.id} />
                        <input
                          type="hidden"
                          name="sesion"
                          value={selectedPilot?.sesion ?? ENTRENO_CARRERA_SESSION}
                        />
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
                        <input
                          type="hidden"
                          name="sesion"
                          value={selectedPilot?.sesion ?? ENTRENO_CARRERA_SESSION}
                        />
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

      {selectedSanction && selectedSanctionRows ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedSanction(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-rks-line/70 bg-rks-surface p-4 shadow-2xl shadow-black/40"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <h4 className="text-lg font-bold text-zinc-100">Sanciones · {selectedSanctionRows.piloto}</h4>
              <button
                type="button"
                onClick={() => setSelectedSanction(null)}
                className="h-9 rounded-lg border border-rks-line bg-black/25 px-3 text-sm text-zinc-300"
              >
                Cerrar
              </button>
            </div>

            <div className="max-h-80 space-y-2 overflow-auto rounded-xl border border-rks-line/70 p-3">
              {selectedSanctionRows.sanciones.length === 0 ? (
                <p className="text-sm text-zinc-400">Sin sanciones aplicadas.</p>
              ) : (
                selectedSanctionRows.sanciones.map((sancion) => (
                  <div key={sancion.id} className="rounded-lg border border-rks-line/60 bg-black/20 p-2">
                    <form action={editSanctionAction} className="grid gap-2 md:grid-cols-[120px_90px_minmax(0,1fr)_auto]">
                      <input type="hidden" name="sancionId" value={sancion.id} />
                      <input type="hidden" name="sesion" value={selectedSanction.sesion} />
                      <select
                        name="tipo"
                        defaultValue={sancion.tipo}
                        className="h-9 rounded-lg border border-rks-line bg-black/30 px-2 text-xs text-zinc-100"
                      >
                        <option value="segundos">+ segundos</option>
                        {selectedSanction.sesion === ENTRENO_CARRERA_SESSION ? (
                          <option value="posiciones">- posiciones</option>
                        ) : null}
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
                      <input type="hidden" name="sesion" value={selectedSanction.sesion} />
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

function StateMessage({ states }: { states: EntrenamientoActionState[] }) {
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

function QualyRowItem({
  row,
  onOpenPilot,
  onOpenSanction,
}: {
  row: QualyRow;
  onOpenPilot: (pilotId: number) => void;
  onOpenSanction: (detail: SanctionDetail) => void;
}) {
  return (
    <div className="grid grid-cols-[50px_minmax(0,1fr)_110px_90px] items-center gap-2 px-3 py-2 text-sm">
      <p className="font-semibold text-zinc-100">{row.pos}</p>
      <button
        type="button"
        onClick={() => onOpenPilot(row.pilotoId)}
        className="truncate text-left text-zinc-100 underline-offset-2 hover:underline"
      >
        {row.piloto}
      </button>
      <p className="font-semibold text-zinc-100">{formatLapTime(row.tiempoFinal)}</p>
      {row.sancionSegundos > 0 ? (
        <button
          type="button"
          onClick={() =>
            onOpenSanction({
              pilotoId: row.pilotoId,
              sesion: ENTRENO_QUALY_SESSION,
            })
          }
          className="rounded-lg border border-rks-amber/60 bg-rks-amber/10 px-2 py-1 text-xs font-semibold text-rks-amber"
        >
          +{row.sancionSegundos}s
        </button>
      ) : (
        <span className="text-xs text-zinc-500">—</span>
      )}
    </div>
  );
}

function QualyRowItemMobile({
  row,
  onOpenPilot,
  onOpenSanction,
}: {
  row: QualyRow;
  onOpenPilot: (pilotId: number) => void;
  onOpenSanction: (detail: SanctionDetail) => void;
}) {
  return (
    <article className="rounded-xl border border-rks-line/70 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onOpenPilot(row.pilotoId)}
          className="truncate text-left text-sm font-bold text-zinc-100 underline-offset-2 hover:underline"
        >
          P{row.pos} · {row.piloto}
        </button>
        <p className="text-sm font-semibold text-zinc-100">{formatLapTime(row.tiempoFinal)}</p>
      </div>

      {row.sancionSegundos > 0 ? (
        <button
          type="button"
          onClick={() =>
            onOpenSanction({
              pilotoId: row.pilotoId,
              sesion: ENTRENO_QUALY_SESSION,
            })
          }
          className="mt-2 rounded-lg border border-rks-amber/60 bg-rks-amber/10 px-2 py-1 text-xs font-semibold text-rks-amber"
        >
          +{row.sancionSegundos}s
        </button>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">Sin sanción</p>
      )}
    </article>
  );
}

function ParrillaGrid({ rows }: { rows: QualyRow[] }) {
  const orderedRows = rows.filter((row) => row.tiempoFinal != null);
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
    <div className="mt-4 rounded-2xl border border-rks-line/70 bg-black/20 p-3 md:p-4">
      <div className="rounded-xl border-x-2 border-rks-line/70 px-2 py-2 md:px-4 md:py-3">
        <div className="grid grid-cols-2 gap-3 md:gap-5">
          <div className="space-y-3 md:space-y-4">
            {Array.from({ length: laneRows }, (_, index) => (
              <ParrillaSlot
                key={`left-slot-${index}`}
                row={leftLane[index] ?? null}
              />
            ))}
          </div>

          <div className="space-y-3 pt-6 md:space-y-4 md:pt-8">
            {Array.from({ length: laneRows }, (_, index) => (
              <ParrillaSlot
                key={`right-slot-${index}`}
                row={rightLane[index] ?? null}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ParrillaSlot({ row }: { row: QualyRow | null }) {
  if (!row) {
    return (
      <div className="relative h-24 rounded-xl border-2 border-dashed border-rks-line/60 bg-black/20" />
    );
  }

  return (
    <div className="relative h-24 rounded-xl border-2 border-rks-blue/45 bg-gradient-to-br from-rks-surface/90 to-black/50 p-2.5 shadow-md shadow-black/25">
      <div className="absolute left-2 right-2 top-1.5 h-1 rounded bg-white/15" />

      <div className="flex h-full flex-col justify-end">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="inline-flex min-w-9 items-center justify-center rounded-lg bg-rks-blue/20 px-2 py-0.5 text-xs font-bold text-rks-blue md:text-sm">
            P{row.pos}
          </span>
        </div>

        <p className="truncate text-xs font-semibold text-zinc-100 md:text-sm">{row.piloto}</p>
        <p className="text-[11px] text-zinc-400">{formatLapTime(row.tiempoFinal)}</p>
      </div>
    </div>
  );
}

function RaceRowItem({
  row,
  fastestRaceLap,
  onOpenPilot,
  onOpenSanction,
}: {
  row: RaceRow;
  fastestRaceLap: { pilotoId: number; tiempo: number } | null;
  onOpenPilot: (pilotId: number) => void;
  onOpenSanction: (detail: SanctionDetail) => void;
}) {
  const sanctions = row.sanciones
    .map((item) => formatSanctionLabel(item.tipo as "segundos" | "posiciones", item.valor))
    .join(" · ");

  const hasFastestLap =
    fastestRaceLap != null &&
    fastestRaceLap.pilotoId === row.pilotoId &&
    row.mejorVuelta != null &&
    row.mejorVuelta === fastestRaceLap.tiempo;

  return (
    <div className="grid grid-cols-[42px_minmax(0,1fr)_56px_88px_88px_92px_84px_70px] items-center gap-2 px-2 py-2 text-sm md:px-3">
      <p className="font-semibold text-zinc-100">{row.pos}</p>
      <button
        type="button"
        onClick={() => onOpenPilot(row.pilotoId)}
        className="truncate text-left text-zinc-100 underline-offset-2 hover:underline"
      >
        {row.piloto}
      </button>
      <p className="text-zinc-300">{row.kart ?? "—"}</p>
      <p className={`font-semibold ${hasFastestLap ? "text-rks-amber" : "text-zinc-100"}`}>
        {formatLapTime(row.mejorVuelta)}
      </p>
      <p className="text-zinc-100">{formatLapTime(row.ultimaVuelta)}</p>
      <p className="font-semibold text-zinc-100">{formatLapTime(row.tiempoTotal)}</p>
      <p className="text-zinc-200">{row.gap}</p>

      {row.sanciones.length > 0 ? (
        <button
          type="button"
          onClick={() =>
            onOpenSanction({
              pilotoId: row.pilotoId,
              sesion: ENTRENO_CARRERA_SESSION,
            })
          }
          className="rounded-lg border border-rks-amber/60 bg-rks-amber/10 px-2 py-1 text-[11px] font-semibold text-rks-amber"
        >
          {sanctions}
        </button>
      ) : (
        <span className="text-xs text-zinc-500">—</span>
      )}
    </div>
  );
}

function RaceRowItemMobile({
  row,
  fastestRaceLap,
  onOpenPilot,
  onOpenSanction,
}: {
  row: RaceRow;
  fastestRaceLap: { pilotoId: number; tiempo: number } | null;
  onOpenPilot: (pilotId: number) => void;
  onOpenSanction: (detail: SanctionDetail) => void;
}) {
  const sanctions = row.sanciones
    .map((item) => formatSanctionLabel(item.tipo as "segundos" | "posiciones", item.valor))
    .join(" · ");

  const hasFastestLap =
    fastestRaceLap != null &&
    fastestRaceLap.pilotoId === row.pilotoId &&
    row.mejorVuelta != null &&
    row.mejorVuelta === fastestRaceLap.tiempo;

  return (
    <article className="rounded-xl border border-rks-line/70 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onOpenPilot(row.pilotoId)}
          className="truncate text-left text-sm font-bold text-zinc-100 underline-offset-2 hover:underline"
        >
          P{row.pos} · {row.piloto}
        </button>
        <span className="text-xs text-zinc-400">Kart {row.kart ?? "—"}</span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-300">
        <p>Mejor: <span className={hasFastestLap ? "font-semibold text-rks-amber" : "font-semibold text-zinc-100"}>{formatLapTime(row.mejorVuelta)}</span></p>
        <p>Última: <span className="font-semibold text-zinc-100">{formatLapTime(row.ultimaVuelta)}</span></p>
        <p>Total: <span className="font-semibold text-zinc-100">{formatLapTime(row.tiempoTotal)}</span></p>
        <p>Gap: <span className="font-semibold text-zinc-100">{row.gap}</span></p>
      </div>

      {row.sanciones.length > 0 ? (
        <button
          type="button"
          onClick={() =>
            onOpenSanction({
              pilotoId: row.pilotoId,
              sesion: ENTRENO_CARRERA_SESSION,
            })
          }
          className="mt-2 rounded-lg border border-rks-amber/60 bg-rks-amber/10 px-2 py-1 text-xs font-semibold text-rks-amber"
        >
          {sanctions}
        </button>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">Sin sanción</p>
      )}
    </article>
  );
}

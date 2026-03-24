"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { formatLapTime, formatSanctionLabel } from "@/lib/entrenamiento";
import type { PublicEntrenamientoSnapshot } from "@/lib/public-entrenamiento";

import { BottomNav } from "./bottom-nav";

type TrainingRaceScreenProps = {
  initialSnapshot: PublicEntrenamientoSnapshot;
};

type SanctionDetail = {
  piloto: string;
  label: string;
  reason: string;
  lapNumber: number | null;
};

export function TrainingRaceScreen({ initialSnapshot }: TrainingRaceScreenProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [selectedPilotId, setSelectedPilotId] = useState<number | null>(null);
  const [selectedSanction, setSelectedSanction] = useState<SanctionDetail | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/public/entrenamiento", { cache: "no-store" });

    if (!response.ok) {
      return;
    }

    const next = (await response.json()) as PublicEntrenamientoSnapshot;
    setSnapshot(next);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) {
        return;
      }

      await refresh();
    };

    run();
    const interval = setInterval(run, 2500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refresh]);

  const selectedLaps = useMemo(() => {
    if (selectedPilotId == null) {
      return null;
    }

    return snapshot.raceLapSummary.find((row) => row.pilotoId === selectedPilotId) ?? null;
  }, [selectedPilotId, snapshot.raceLapSummary]);

  return (
    <>
      <div className="relative min-h-screen overflow-x-hidden bg-[var(--background)]">
        <div className="pointer-events-none fixed inset-0 z-0 bg-[var(--background)]" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-neon-lines-blue opacity-35 animate-neon-lines" />

        <main className="relative z-10 mx-auto w-full max-w-5xl space-y-4 px-4 pb-28 pt-6 sm:pt-8">
          <section className="rounded-3xl border border-rks-line/70 bg-gradient-to-br from-black via-rks-surface to-rks-blue-deep/25 p-5 shadow-2xl shadow-rks-blue/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rks-blue/90">Entrenamiento</p>
                <h1 className="mt-2 text-3xl font-black uppercase text-zinc-100 sm:text-4xl">Carrera</h1>
                <p className="mt-1 text-sm text-zinc-300">8 minutos · actualización 2.5s</p>
              </div>
              <Link href="/entrenamiento" className="h-10 rounded-xl border border-rks-line/70 bg-black/30 px-3 text-sm font-semibold text-zinc-200 inline-flex items-center">
                Volver
              </Link>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-rks-line/70 bg-rks-surface/80 shadow-xl shadow-black/25">
            <div className="grid grid-cols-[42px_minmax(0,1fr)_56px_90px_90px_84px_84px_110px] gap-2 border-b border-rks-line/70 bg-black/25 px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400 md:px-3 md:text-xs">
              <p>Pos</p>
              <p>Piloto</p>
              <p>Kart</p>
              <p>Mejor</p>
              <p>Última</p>
              <p>Gap</p>
              <p>Laps</p>
              <p>⚠️</p>
            </div>

            <div className="divide-y divide-rks-line/60">
              {snapshot.raceRows.map((row) => {
                const isBestLap =
                  snapshot.fastestRaceLap != null &&
                  snapshot.fastestRaceLap.pilotoId === row.pilotoId &&
                  snapshot.fastestRaceLap.tiempo === row.mejorVuelta;

                const sanctions = row.sanciones
                  .map((item) => formatSanctionLabel(item.tipo as "segundos" | "posiciones", item.valor))
                  .join(" · ");

                return (
                  <div key={row.pilotoId} className="grid grid-cols-[42px_minmax(0,1fr)_56px_90px_90px_84px_84px_110px] items-center gap-2 px-2 py-2 text-sm md:px-3">
                    <p className="font-semibold text-zinc-100">{row.pos}</p>
                    <button
                      type="button"
                      onClick={() => setSelectedPilotId(row.pilotoId)}
                      className="truncate text-left text-zinc-100 underline-offset-2 hover:underline"
                    >
                      {row.piloto}
                    </button>
                    <p className="text-zinc-300">{row.kart ?? "—"}</p>
                    <p className={`font-semibold ${isBestLap ? "text-rks-blue" : "text-zinc-100"}`}>{formatLapTime(row.mejorVuelta)}</p>
                    <p className="text-zinc-100">{formatLapTime(row.ultimaVuelta)}</p>
                    <p className="text-zinc-200">{row.gap}</p>
                    <p className="text-zinc-200">{row.laps}</p>
                    {row.sanciones.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {row.sanciones.map((sanction) => {
                          const label = formatSanctionLabel(sanction.tipo as "segundos" | "posiciones", sanction.valor);

                          return (
                            <button
                              key={sanction.id}
                              type="button"
                              onClick={() =>
                                setSelectedSanction({
                                  piloto: row.piloto,
                                  label,
                                  reason: sanction.motivo,
                                  lapNumber: sanction.vuelta,
                                })
                              }
                              className="rounded-full border border-rks-blue/60 bg-rks-blue/15 px-2 py-1 text-[11px] font-semibold text-rks-blue"
                              title={sanctions}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500">—</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </main>

        {selectedLaps ? (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedPilotId(null)}>
            <div className="w-full max-w-lg rounded-2xl border border-rks-line/70 bg-rks-surface p-4 shadow-2xl shadow-black/40" onClick={(event) => event.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-lg font-bold text-zinc-100">Vueltas · {selectedLaps.piloto}</h4>
                <button type="button" onClick={() => setSelectedPilotId(null)} className="h-9 rounded-lg border border-rks-line bg-black/25 px-3 text-sm text-zinc-300">
                  Cerrar
                </button>
              </div>

              <div className="mb-3 grid grid-cols-3 gap-2 rounded-xl border border-rks-line/70 bg-black/20 p-3 text-xs md:text-sm">
                <p className="text-zinc-300">Total laps: <span className="font-semibold text-zinc-100">{selectedLaps.laps.length}</span></p>
                <p className="text-zinc-300">Best: <span className="font-semibold text-zinc-100">{formatLapTime(selectedLaps.laps.find((lap) => lap.esMejor)?.tiempo ?? null)}</span></p>
                <p className="text-zinc-300">Last: <span className="font-semibold text-zinc-100">{formatLapTime(selectedLaps.laps[selectedLaps.laps.length - 1]?.tiempo ?? null)}</span></p>
              </div>

              <div className="max-h-72 overflow-auto rounded-xl border border-rks-line/70">
                {selectedLaps.laps.length === 0 ? (
                  <p className="p-4 text-sm text-zinc-400">Sin vueltas registradas.</p>
                ) : (
                  selectedLaps.laps.map((lap) => (
                    <div
                      key={lap.numero}
                      className={`flex items-center justify-between border-b border-rks-line/50 px-4 py-2 text-sm ${
                        lap.esMejor ? "bg-rks-blue/15 text-rks-blue" : "text-zinc-200"
                      }`}
                    >
                      <span>Vuelta {lap.numero}</span>
                      <span className="font-semibold">{formatLapTime(lap.tiempo)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}

        {selectedSanction ? (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedSanction(null)}>
            <div className="w-full max-w-md rounded-2xl border border-rks-line/70 bg-rks-surface p-4 shadow-2xl shadow-black/40" onClick={(event) => event.stopPropagation()}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h4 className="text-lg font-bold text-zinc-100">{selectedSanction.label}</h4>
                <button type="button" onClick={() => setSelectedSanction(null)} className="h-9 rounded-lg border border-rks-line bg-black/25 px-3 text-sm text-zinc-300">
                  Cerrar
                </button>
              </div>
              <p className="text-sm text-zinc-400">{selectedSanction.piloto}</p>
              <p className="mt-2 text-sm text-zinc-200">Motivo: {selectedSanction.reason}</p>
              <p className="mt-1 text-sm text-zinc-200">
                Vuelta: {selectedSanction.lapNumber != null ? selectedSanction.lapNumber : "No registrada"}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <BottomNav />
    </>
  );
}

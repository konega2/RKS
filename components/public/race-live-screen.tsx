"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  formatLapTime,
  formatSanctionLabel,
  type CarreraSnapshot,
  type CarreraSanctionInput,
  type CarreraSanctionType,
} from "@/lib/carrera";

import { BottomNav } from "./bottom-nav";

type RaceLiveScreenProps = {
  initialSnapshot: CarreraSnapshot;
};

type SanctionDetail = {
  piloto: string;
  label: string;
  reason: string;
  lapNumber: number | null;
};

export function RaceLiveScreen({ initialSnapshot }: RaceLiveScreenProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [selectedPilotId, setSelectedPilotId] = useState<number | null>(null);
  const [selectedSanction, setSelectedSanction] = useState<SanctionDetail | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/public/carrera", { cache: "no-store" });

    if (!response.ok) {
      return;
    }

    const next = (await response.json()) as CarreraSnapshot;
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

  const selectedPilotLaps = useMemo(() => {
    if (selectedPilotId == null) {
      return null;
    }

    return snapshot.raceLaps.find((pilot) => pilot.pilotoId === selectedPilotId) ?? null;
  }, [selectedPilotId, snapshot.raceLaps]);

  const selectedPilotRow = useMemo(() => {
    if (selectedPilotId == null) {
      return null;
    }

    return snapshot.raceRows.find((row) => row.pilotoId === selectedPilotId) ?? null;
  }, [selectedPilotId, snapshot.raceRows]);

  const leaderLaps = snapshot.raceRows[0]?.laps ?? 0;

  return (
    <>
      <div className="relative min-h-screen overflow-x-hidden bg-[var(--background)]">
        <div className="pointer-events-none fixed inset-0 z-0 bg-[var(--background)]" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-neon-lines-blue opacity-35 animate-neon-lines" />

        <main className="relative z-10 mx-auto w-full max-w-6xl space-y-4 px-4 pb-28 pt-6 sm:pt-8">
          <section className="rounded-3xl border border-rks-line/70 bg-gradient-to-br from-black via-rks-surface to-rks-blue-deep/25 p-5 shadow-2xl shadow-rks-blue/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rks-blue/90">CARRERA EN CURSO</p>
                <h1 className="mt-2 text-3xl font-black uppercase text-zinc-100 sm:text-4xl">Live timing</h1>
                <p className="mt-1 text-sm text-zinc-300">Vuelta líder: {leaderLaps}/{snapshot.targetLaps} · actualización 2.5s</p>
              </div>
              <Link href="/carrera" className="inline-flex h-10 items-center rounded-xl border border-rks-line/70 bg-black/30 px-3 text-sm font-semibold text-zinc-200">
                Volver
              </Link>
            </div>
          </section>

          <section className="hidden overflow-hidden rounded-2xl border border-rks-line/70 bg-rks-surface/80 shadow-xl shadow-black/25 md:block">
            <div className="sticky top-0 z-10 grid grid-cols-[42px_minmax(0,1fr)_56px_90px_96px_90px_170px] gap-2 border-b border-rks-line/70 bg-black/85 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-zinc-400 backdrop-blur-md">
              <p>Pos</p>
              <p>Piloto</p>
              <p>Kart</p>
              <p>Última vuelta</p>
              <p>Mejor vuelta</p>
              <p>Gap</p>
              <p>⚠️</p>
            </div>

            <div className="divide-y divide-rks-line/60">
              {snapshot.raceRows.map((row) => {
                const isBestLap =
                  snapshot.fastestLap != null &&
                  snapshot.fastestLap.pilotoId === row.pilotoId &&
                  snapshot.fastestLap.tiempo === row.mejorVuelta;

                return (
                  <div key={`race-desktop-${row.pilotoId}`} className="grid grid-cols-[42px_minmax(0,1fr)_56px_90px_96px_90px_170px] items-center gap-2 px-3 py-2 text-sm">
                    <p className="font-semibold text-zinc-100">{row.pos}</p>
                    <button
                      type="button"
                      onClick={() => setSelectedPilotId(row.pilotoId)}
                      className="truncate text-left text-zinc-100 underline-offset-2 hover:underline"
                    >
                      {row.piloto}
                    </button>
                    <p className="text-zinc-300">{row.kart ?? "—"}</p>
                    <p className="text-zinc-100">{formatLapTime(row.ultimaVuelta)}</p>
                    <p className={`font-semibold ${isBestLap ? "text-rks-blue" : "text-zinc-100"}`}>{formatLapTime(row.mejorVuelta)}</p>
                    <p className="text-zinc-200">{row.gap}</p>
                    <SanctionsCell
                      piloto={row.piloto}
                      sanctions={row.sanciones}
                      onOpen={(detail) => setSelectedSanction(detail)}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-2 md:hidden">
            {snapshot.raceRows.map((row) => {
              const isBestLap =
                snapshot.fastestLap != null &&
                snapshot.fastestLap.pilotoId === row.pilotoId &&
                snapshot.fastestLap.tiempo === row.mejorVuelta;

              return (
                <article key={`race-mobile-${row.pilotoId}`} className="rounded-2xl border border-rks-line/70 bg-rks-surface/80 p-3 shadow-xl shadow-black/25">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-lg font-black text-zinc-100">P{row.pos}</p>
                    <p className="rounded-full border border-rks-line/70 bg-black/25 px-2 py-1 text-xs font-semibold text-zinc-300">Kart {row.kart ?? "—"}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPilotId(row.pilotoId)}
                    className="mt-2 block w-full truncate text-left text-base font-bold text-zinc-100 underline-offset-2 hover:underline"
                  >
                    {row.piloto}
                  </button>

                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <p className="rounded-lg border border-rks-line/70 bg-black/20 p-2 text-zinc-300">Última<br /><span className="text-sm font-semibold text-zinc-100">{formatLapTime(row.ultimaVuelta)}</span></p>
                    <p className="rounded-lg border border-rks-line/70 bg-black/20 p-2 text-zinc-300">Mejor<br /><span className={`text-sm font-semibold ${isBestLap ? "text-rks-blue" : "text-zinc-100"}`}>{formatLapTime(row.mejorVuelta)}</span></p>
                    <p className="rounded-lg border border-rks-line/70 bg-black/20 p-2 text-zinc-300">Gap<br /><span className="text-sm font-semibold text-zinc-100">{row.gap}</span></p>
                  </div>

                  <div className="mt-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">⚠️ Sanciones</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {row.sanciones.length === 0 ? (
                        <span className="text-xs text-zinc-500">—</span>
                      ) : (
                        row.sanciones.map((sanction) => {
                          const label = formatSanctionLabel(sanction.tipo as CarreraSanctionType, sanction.valor);

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
                            >
                              {label}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </main>

        {selectedPilotLaps && selectedPilotRow ? (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedPilotId(null)}>
            <div className="w-full max-w-lg rounded-2xl border border-rks-line/70 bg-rks-surface p-4 shadow-2xl shadow-black/40" onClick={(event) => event.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-lg font-bold text-zinc-100">Vueltas · {selectedPilotLaps.piloto}</h4>
                <button type="button" onClick={() => setSelectedPilotId(null)} className="h-9 rounded-lg border border-rks-line bg-black/25 px-3 text-sm text-zinc-300">
                  Cerrar
                </button>
              </div>

              <div className="mb-3 grid grid-cols-3 gap-2 rounded-xl border border-rks-line/70 bg-black/20 p-3 text-xs md:text-sm">
                <p className="text-zinc-300">Total laps: <span className="font-semibold text-zinc-100">{selectedPilotLaps.laps.length}</span></p>
                <p className="text-zinc-300">Best: <span className="font-semibold text-zinc-100">{formatLapTime(selectedPilotRow.mejorVuelta)}</span></p>
                <p className="text-zinc-300">Last: <span className="font-semibold text-zinc-100">{formatLapTime(selectedPilotRow.ultimaVuelta)}</span></p>
              </div>

              <div className="mb-3 rounded-xl border border-rks-line/70 bg-black/20 px-3 py-2 text-sm text-zinc-200">
                Tiempo total: <span className="font-semibold">{formatLapTime(selectedPilotLaps.totalTime)}</span>
              </div>

              <div className="max-h-72 overflow-auto rounded-xl border border-rks-line/70">
                {selectedPilotLaps.laps.length === 0 ? (
                  <p className="p-4 text-sm text-zinc-400">Sin vueltas registradas.</p>
                ) : (
                  selectedPilotLaps.laps.map((lap) => (
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

function SanctionsCell({
  piloto,
  sanctions,
  onOpen,
}: {
  piloto: string;
  sanctions: CarreraSanctionInput[];
  onOpen: (detail: SanctionDetail) => void;
}) {
  if (sanctions.length === 0) {
    return <p className="text-xs text-zinc-500">—</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {sanctions.map((sanction) => {
        const label = formatSanctionLabel(sanction.tipo as CarreraSanctionType, sanction.valor);

        return (
          <button
            key={sanction.id}
            type="button"
            onClick={() =>
              onOpen({
                piloto,
                label,
                reason: sanction.motivo,
                lapNumber: sanction.vuelta,
              })
            }
            className="rounded-full border border-rks-blue/60 bg-rks-blue/15 px-2 py-1 text-[11px] font-semibold text-rks-blue"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

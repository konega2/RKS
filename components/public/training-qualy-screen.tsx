"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { formatLapTime } from "@/lib/entrenamiento";
import type { PublicEntrenamientoSnapshot } from "@/lib/public-entrenamiento";

import { BottomNav } from "./bottom-nav";

type TrainingQualyScreenProps = {
  initialSnapshot: PublicEntrenamientoSnapshot;
};

type SanctionListDetail = {
  piloto: string;
  sanciones: Array<{
    id: number;
    motivo: string;
    vuelta: number | null;
    valor: number;
  }>;
};

export function TrainingQualyScreen({ initialSnapshot }: TrainingQualyScreenProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [selectedPilotId, setSelectedPilotId] = useState<number | null>(null);
  const [selectedSanction, setSelectedSanction] = useState<SanctionListDetail | null>(null);

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

  const selectedRow = useMemo(() => {
    if (selectedPilotId == null) {
      return null;
    }

    return snapshot.qualyRows.find((row) => row.pilotoId === selectedPilotId) ?? null;
  }, [selectedPilotId, snapshot.qualyRows]);

  const selectedPilotLaps = useMemo(() => {
    if (selectedPilotId == null) {
      return null;
    }

    return snapshot.qualyLapSummary.find((pilot) => pilot.pilotoId === selectedPilotId) ?? null;
  }, [selectedPilotId, snapshot.qualyLapSummary]);

  return (
    <>
      <div className="relative min-h-screen overflow-x-hidden bg-[var(--background)]">
        <div className="pointer-events-none fixed inset-0 z-0 bg-[var(--background)]" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-neon-lines-blue opacity-35 animate-neon-lines" />

        <main className="relative z-10 mx-auto w-full max-w-4xl space-y-4 px-4 pb-28 pt-6 sm:pt-8">
          <section className="rounded-3xl border border-rks-line/70 bg-gradient-to-br from-black via-rks-surface to-rks-blue-deep/25 p-5 shadow-2xl shadow-rks-blue/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rks-blue/90">Entrenamiento</p>
                <h1 className="mt-2 text-3xl font-black uppercase text-zinc-100 sm:text-4xl">Qualy</h1>
                <p className="mt-1 text-sm text-zinc-300">1 vuelta por piloto · actualización 2.5s</p>
              </div>
              <Link href="/entrenamiento" className="h-10 rounded-xl border border-rks-line/70 bg-black/30 px-3 text-sm font-semibold text-zinc-200 inline-flex items-center">
                Volver
              </Link>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-rks-line/70 bg-rks-surface/80 shadow-xl shadow-black/25">
            <div className="grid grid-cols-[44px_minmax(0,1fr)_96px_120px] gap-2 border-b border-rks-line/70 bg-black/25 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
              <p>Pos</p>
              <p>Piloto</p>
              <p>Tiempo</p>
              <p>⚠️</p>
            </div>

            <div className="divide-y divide-rks-line/60">
              {snapshot.qualyRows.map((row) => (
                <div key={row.pilotoId} className="grid grid-cols-[44px_minmax(0,1fr)_96px_120px] items-center gap-2 px-3 py-2 text-sm">
                  <p className="font-semibold text-zinc-100">{row.pos}</p>
                  <button
                    type="button"
                    onClick={() => setSelectedPilotId(row.pilotoId)}
                    className="truncate text-left text-zinc-100 underline-offset-2 hover:underline"
                  >
                    {row.piloto}
                  </button>
                  <p className="font-semibold text-zinc-100">{formatLapTime(row.tiempoFinal)}</p>
                  {row.sancionSegundos > 0 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedSanction({
                          piloto: row.piloto,
                          sanciones: row.sanciones.map((item) => ({
                            id: item.id,
                            motivo: item.motivo,
                            vuelta: item.vuelta,
                            valor: item.valor,
                          })),
                        })
                      }
                      className="text-left text-xs font-semibold text-rks-blue underline-offset-2 hover:underline"
                    >
                      +{row.sancionSegundos}s {formatLapTime(row.tiempoFinal)}
                    </button>
                  ) : (
                    <p className="text-xs text-zinc-500">—</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </main>

        {selectedRow && selectedPilotLaps ? (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedPilotId(null)}>
            <div className="w-full max-w-lg rounded-2xl border border-rks-line/70 bg-rks-surface p-4 shadow-2xl shadow-black/40" onClick={(event) => event.stopPropagation()}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h4 className="text-lg font-bold text-zinc-100">{selectedRow.piloto}</h4>
                <button type="button" onClick={() => setSelectedPilotId(null)} className="h-9 rounded-lg border border-rks-line bg-black/25 px-3 text-sm text-zinc-300">
                  Cerrar
                </button>
              </div>

              <div className="mb-3 space-y-2 rounded-xl border border-rks-line/70 bg-black/20 p-3 text-sm">
                <p className="text-zinc-200">Tiempo original: <span className="font-semibold">{formatLapTime(selectedRow.tiempoOriginal)}</span></p>
                <p className="text-zinc-200">Penalización: <span className="font-semibold">+{selectedRow.sancionSegundos.toFixed(3)}s</span></p>
                <p className="text-zinc-100">Tiempo final: <span className="font-semibold">{formatLapTime(selectedRow.tiempoFinal)}</span></p>
              </div>

              <div className="mb-3 grid grid-cols-3 gap-2 rounded-xl border border-rks-line/70 bg-black/20 p-3 text-xs md:text-sm">
                <p className="text-zinc-300">Total laps: <span className="font-semibold text-zinc-100">{selectedPilotLaps.laps.length}</span></p>
                <p className="text-zinc-300">Best: <span className="font-semibold text-zinc-100">{formatLapTime(selectedRow.tiempoFinal)}</span></p>
                <p className="text-zinc-300">Last: <span className="font-semibold text-zinc-100">{formatLapTime(selectedRow.tiempoOriginal)}</span></p>
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
                      <span>
                        Vuelta {lap.numero}
                        {lap.esMejor ? " · BEST" : ""}
                      </span>
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
                <h4 className="text-lg font-bold text-zinc-100">Sanciones · {selectedSanction.piloto}</h4>
                <button type="button" onClick={() => setSelectedSanction(null)} className="h-9 rounded-lg border border-rks-line bg-black/25 px-3 text-sm text-zinc-300">
                  Cerrar
                </button>
              </div>

              {selectedSanction.sanciones.length === 0 ? (
                <p className="text-sm text-zinc-400">Sin sanciones aplicadas.</p>
              ) : (
                <ul className="space-y-2 text-sm text-zinc-200">
                  {selectedSanction.sanciones.map((item) => (
                    <li key={item.id} className="rounded-lg border border-rks-line/60 bg-black/20 p-2">
                      <p>Motivo: {item.motivo}</p>
                      <p>Vuelta: {item.vuelta != null ? item.vuelta : "No registrada"}</p>
                      <p>Sanción: +{item.valor}s</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <BottomNav />
    </>
  );
}

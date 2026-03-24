"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  formatLapTime,
  formatSanctionLabel,
  type QualySanctionType,
  type QualySnapshot,
} from "@/lib/qualy";

import { BottomNav } from "./bottom-nav";

type PublicQualyScreenProps = {
  initialSnapshot: QualySnapshot;
};

type SanctionDetail = {
  piloto: string;
  label: string;
  reason: string;
  lapNumber: number | null;
};

export function PublicQualyScreen({ initialSnapshot }: PublicQualyScreenProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [selectedPilotId, setSelectedPilotId] = useState<number | null>(null);
  const [selectedSanction, setSelectedSanction] = useState<SanctionDetail | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/public/qualy", { cache: "no-store" });

    if (!response.ok) {
      return;
    }

    const next = (await response.json()) as QualySnapshot;
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

    return snapshot.pilotLaps.find((pilot) => pilot.pilotoId === selectedPilotId) ?? null;
  }, [selectedPilotId, snapshot.pilotLaps]);

  const selectedPilotRow = useMemo(() => {
    if (selectedPilotId == null) {
      return null;
    }

    return snapshot.rows.find((row) => row.pilotoId === selectedPilotId) ?? null;
  }, [selectedPilotId, snapshot.rows]);

  return (
    <>
      <div className="relative min-h-screen overflow-x-hidden bg-[var(--background)]">
        <div className="pointer-events-none fixed inset-0 z-0 bg-[var(--background)]" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-neon-lines-blue opacity-35 animate-neon-lines" />

        <main className="relative z-10 mx-auto w-full max-w-5xl space-y-4 px-4 pb-28 pt-6 sm:pt-8">
          <section className="rounded-3xl border border-rks-line/70 bg-gradient-to-br from-black via-rks-surface to-rks-blue-deep/25 p-5 shadow-2xl shadow-rks-blue/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rks-blue/90">Qualy oficial</p>
                <h1 className="mt-2 text-3xl font-black uppercase text-zinc-100 sm:text-4xl">Live timing</h1>
                <p className="mt-1 text-sm text-zinc-300">Mejor vuelta · actualización 2.5s</p>
              </div>
              <Link href="/" className="h-10 rounded-xl border border-rks-line/70 bg-black/30 px-3 text-sm font-semibold text-zinc-200 inline-flex items-center">
                Volver
              </Link>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-rks-line/70 bg-rks-surface/80 shadow-xl shadow-black/25">
            <div className="grid grid-cols-[42px_minmax(0,1fr)_56px_90px_96px_84px_120px] gap-2 border-b border-rks-line/70 bg-black/25 px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400 md:px-3 md:text-xs">
              <p>Pos</p>
              <p>Piloto</p>
              <p>Kart</p>
              <p>Última</p>
              <p>Mejor</p>
              <p>Gap</p>
              <p>⚠️</p>
            </div>

            <div className="divide-y divide-rks-line/60">
              {snapshot.rows.map((row) => {
                const isFastest =
                  snapshot.fastestLap != null &&
                  snapshot.fastestLap.pilotoId === row.pilotoId &&
                  row.mejorVueltaFinal != null &&
                  row.mejorVueltaFinal === snapshot.fastestLap.tiempo;

                return (
                  <div key={row.pilotoId} className="grid grid-cols-[42px_minmax(0,1fr)_56px_90px_96px_84px_120px] items-center gap-2 px-2 py-2 text-sm md:px-3">
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
                    <p className={`font-semibold ${isFastest ? "text-rks-blue" : "text-zinc-100"}`}>
                      {formatLapTime(row.mejorVueltaFinal)}
                    </p>
                    <p className="text-zinc-200">{row.gap}</p>
                    {row.sanciones.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {row.sanciones.map((sanction) => {
                          const label = formatSanctionLabel(sanction.tipo as QualySanctionType, sanction.valor);

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

        {selectedPilotLaps && selectedPilotRow ? (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedPilotId(null)}>
            <div className="w-full max-w-xl rounded-2xl border border-rks-line/70 bg-rks-surface p-4 shadow-2xl shadow-black/40" onClick={(event) => event.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-lg font-bold text-zinc-100">Vueltas · {selectedPilotLaps.piloto}</h4>
                <button type="button" onClick={() => setSelectedPilotId(null)} className="h-9 rounded-lg border border-rks-line bg-black/25 px-3 text-sm text-zinc-300">
                  Cerrar
                </button>
              </div>

              <div className="mb-3 grid grid-cols-3 gap-2 rounded-xl border border-rks-line/70 bg-black/20 p-3 text-xs md:text-sm">
                <p className="text-zinc-300">Total laps: <span className="font-semibold text-zinc-100">{selectedPilotLaps.laps.length}</span></p>
                <p className="text-zinc-300">Best: <span className="font-semibold text-zinc-100">{formatLapTime(selectedPilotRow.mejorVueltaFinal)}</span></p>
                <p className="text-zinc-300">Last: <span className="font-semibold text-zinc-100">{formatLapTime(selectedPilotRow.ultimaVuelta)}</span></p>
              </div>

              <div className="max-h-80 overflow-auto rounded-xl border border-rks-line/70">
                {selectedPilotLaps.laps.length === 0 ? (
                  <p className="p-4 text-sm text-zinc-400">Sin vueltas registradas.</p>
                ) : (
                  selectedPilotLaps.laps.map((lap) => (
                    <div
                      key={lap.id}
                      className={`flex items-center justify-between border-b border-rks-line/50 px-4 py-2 text-sm ${
                        lap.isDeleted
                          ? "bg-red-950/25 text-red-300"
                          : lap.isBestFinal
                            ? "bg-rks-blue/15 text-rks-blue"
                            : "text-zinc-200"
                      }`}
                    >
                      <span>
                        V{lap.numero}
                        {lap.isDeleted ? " · ❌ eliminada" : ""}
                        {lap.isBestFinal ? " · BEST" : ""}
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

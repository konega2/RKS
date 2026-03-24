"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { PublicResultadosSnapshot } from "@/lib/public-resultados";

import { BottomNav } from "./bottom-nav";

type PublicResultsScreenProps = {
  initialSnapshot: PublicResultadosSnapshot;
};

const PODIUM_ORDER = [2, 1, 3] as const;

export function PublicResultsScreen({ initialSnapshot }: PublicResultsScreenProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [revealedPositions, setRevealedPositions] = useState<number[]>([]);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/public/resultados", { cache: "no-store" });

    if (!response.ok) {
      return;
    }

    const next = (await response.json()) as PublicResultadosSnapshot;
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
    const interval = setInterval(run, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refresh]);

  useEffect(() => {
    const revealOrder = [3, 2, 1];
    const timers = revealOrder.map((pos, index) =>
      setTimeout(() => {
        setRevealedPositions((prev) => (prev.includes(pos) ? prev : [...prev, pos]));
      }, index * 550 + 180),
    );

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const podiumByPosition = useMemo(
    () => new Map(snapshot.podium.map((driver) => [driver.posicion, driver])),
    [snapshot.podium],
  );

  return (
    <>
      <div className="relative min-h-screen overflow-x-hidden bg-[var(--background)]">
        <div className="pointer-events-none fixed inset-0 z-0 bg-[var(--background)]" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-neon-lines-blue opacity-40 animate-neon-lines" />

        <main className="relative z-10 mx-auto w-full max-w-6xl space-y-4 px-4 pb-28 pt-6 sm:pt-8">
          <section className="rounded-3xl border border-rks-line/70 bg-gradient-to-br from-black via-rks-surface to-rks-blue-deep/25 p-5 shadow-2xl shadow-rks-blue/10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rks-blue/90">Resultados oficiales</p>
            <h1 className="mt-2 text-3xl font-black uppercase text-zinc-100 sm:text-4xl">Carrera final</h1>
            <p className="mt-1 text-sm text-zinc-300">Podio y clasificación final con puntuación.</p>
          </section>

          <section className="rounded-2xl border border-rks-line/70 bg-rks-surface/80 p-4 shadow-xl shadow-black/25 md:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rks-blue/90">🏆 Podio</p>

            {snapshot.podium.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-rks-line/70 bg-black/25 p-4 text-sm text-zinc-400">
                Aún no hay resultados finales guardados.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 items-end gap-3 md:grid-cols-3">
                {PODIUM_ORDER.map((pos) => {
                  const driver = podiumByPosition.get(pos);
                  const isFirst = pos === 1;
                  const isVisible = revealedPositions.includes(pos);
                  const ordinal = pos === 1 ? "1st" : pos === 2 ? "2nd" : "3rd";

                  return (
                    <article
                      key={`podium-${pos}`}
                      className={`podium-card-base relative overflow-hidden rounded-2xl border p-4 shadow-xl ${
                        isVisible ? "podium-card-enter" : "opacity-0 translate-y-10 scale-[0.9]"
                      } ${
                        isFirst
                          ? "order-first min-h-[230px] md:order-none md:-translate-y-5 border-rks-blue/70 bg-rks-blue/15 shadow-[0_0_35px_rgba(31,94,255,0.4)]"
                          : "min-h-[185px] border-rks-line/70 bg-black/25 shadow-black/25"
                      }`}
                    >
                      {isFirst ? (
                        <div className="podium-glow pointer-events-none absolute inset-0" />
                      ) : null}

                      <p className={`relative z-10 text-xs font-semibold uppercase tracking-[0.14em] ${isFirst ? "text-rks-blue" : "text-zinc-400"}`}>
                        {pos === 1 ? "🥇" : pos === 2 ? "🥈" : "🥉"} {ordinal}
                      </p>

                      {driver ? (
                        <>
                          <p className={`relative z-10 mt-2 truncate font-black uppercase ${isFirst ? "text-3xl text-zinc-100" : "text-xl text-zinc-100"}`}>
                            {driver.piloto}
                          </p>

                          <p className={`relative z-10 mt-1 text-xs uppercase tracking-[0.14em] ${isFirst ? "text-rks-blue/90" : "text-zinc-500"}`}>
                            Posición final P{pos}
                          </p>

                          <div className="relative z-10 mt-3 grid grid-cols-2 gap-2 text-xs md:text-sm">
                            <p className="rounded-lg border border-rks-line/70 bg-black/20 px-2 py-1 text-zinc-300">Kart <span className="font-semibold text-zinc-100">{driver.kart ?? "—"}</span></p>
                            <p className="rounded-lg border border-rks-line/70 bg-black/20 px-2 py-1 text-zinc-300">Puntos <span className="font-semibold text-zinc-100">{driver.puntos}</span></p>
                          </div>

                          <div className={`absolute inset-x-0 bottom-0 ${isFirst ? "h-11" : pos === 2 ? "h-8" : "h-6"} border-t border-rks-line/60 bg-black/35`} />
                        </>
                      ) : (
                        <>
                          <p className="relative z-10 mt-2 text-sm text-zinc-500">Sin piloto asignado.</p>
                          <div className={`absolute inset-x-0 bottom-0 ${isFirst ? "h-11" : pos === 2 ? "h-8" : "h-6"} border-t border-rks-line/60 bg-black/35`} />
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-rks-line/70 bg-rks-surface/80 p-4 shadow-xl shadow-black/25 md:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rks-blue/90">📊 Clasificación completa</p>

            {snapshot.rows.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-rks-line/70 bg-black/25 p-4 text-sm text-zinc-400">
                Sin clasificación final disponible.
              </p>
            ) : (
              <>
                <div className="mt-3 space-y-2 md:hidden">
                  {snapshot.rows.map((row) => (
                    <article
                      key={`result-mobile-${row.pilotoId}`}
                      className={`rounded-2xl border p-3 shadow-lg ${
                        row.posicion <= 3 ? "border-rks-blue/50 bg-rks-blue/10" : "border-rks-line/70 bg-black/25"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-lg font-black text-zinc-100">P{row.posicion}</p>
                        <p className="rounded-full border border-rks-line/70 bg-black/20 px-2 py-1 text-xs font-semibold text-zinc-300">{row.puntos} pts</p>
                      </div>
                      <p className="mt-1 truncate text-base font-bold text-zinc-100">{row.piloto}</p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <p className="rounded-lg border border-rks-line/70 bg-black/20 p-2 text-zinc-300">Kart<br /><span className="font-semibold text-zinc-100">{row.kart ?? "—"}</span></p>
                        <p className="rounded-lg border border-rks-line/70 bg-black/20 p-2 text-zinc-300">Tiempo<br /><span className="font-semibold text-zinc-100">{row.tiempo}</span></p>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-3 hidden overflow-hidden rounded-xl border border-rks-line/70 md:block">
                  <div className="sticky top-0 z-10 grid grid-cols-[64px_minmax(0,1fr)_80px_140px_90px] gap-2 border-b border-rks-line/70 bg-black/85 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-zinc-400 backdrop-blur-md">
                    <p>Pos</p>
                    <p>Piloto</p>
                    <p>Kart</p>
                    <p>Tiempo / Resultado</p>
                    <p>Puntos</p>
                  </div>

                  <div className="divide-y divide-rks-line/60">
                    {snapshot.rows.map((row) => (
                      <div key={`result-desktop-${row.pilotoId}`} className="grid grid-cols-[64px_minmax(0,1fr)_80px_140px_90px] items-center gap-2 px-3 py-2 text-sm">
                        <p className="font-semibold text-zinc-100">{row.posicion}</p>
                        <p className="truncate text-zinc-100">{row.piloto}</p>
                        <p className="text-zinc-300">{row.kart ?? "—"}</p>
                        <p className="font-medium text-zinc-200">{row.tiempo}</p>
                        <p className="font-semibold text-rks-blue">{row.puntos}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        </main>
      </div>

      <BottomNav />
    </>
  );
}

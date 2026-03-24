"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { PublicPreCarreraSnapshot } from "@/lib/public-precarrera";

import { BottomNav } from "./bottom-nav";

type PreCarreraScreenProps = {
  initialSnapshot: PublicPreCarreraSnapshot;
};

export function PreCarreraScreen({ initialSnapshot }: PreCarreraScreenProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [search, setSearch] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/public/pre-carrera", { cache: "no-store" });

    if (!response.ok) {
      return;
    }

    const next = (await response.json()) as PublicPreCarreraSnapshot;
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

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return snapshot.rows;
    }

    return snapshot.rows.filter((row) => row.piloto.toLowerCase().includes(query));
  }, [search, snapshot.rows]);

  return (
    <>
      <div className="relative min-h-screen overflow-x-hidden bg-[var(--background)]">
        <div className="pointer-events-none fixed inset-0 z-0 bg-[var(--background)]" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-neon-lines-blue opacity-40 animate-neon-lines" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-neon-lines-blue-soft opacity-30 animate-neon-lines [animation-duration:20s]" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-black/20 via-transparent to-black/45" />

        <main className="relative z-10 mx-auto w-full max-w-4xl space-y-4 px-4 pb-28 pt-6 sm:pt-8">
          <section className="rounded-3xl border border-rks-line/70 bg-gradient-to-br from-black via-rks-surface to-rks-blue-deep/30 p-5 shadow-2xl shadow-rks-blue/10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rks-blue/90">Pre-carrera</p>
            <h1 className="mt-2 text-3xl font-black uppercase text-zinc-100 sm:text-4xl">Karts y lastre</h1>
            <p className="mt-2 text-sm text-zinc-300">Consulta rápida de asignaciones por piloto.</p>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar piloto..."
              className="mt-4 h-12 w-full rounded-2xl border border-rks-line bg-black/35 px-4 text-base text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-rks-blue focus:ring-2 focus:ring-rks-blue/35"
            />
          </section>

          <section className="space-y-2 md:hidden">
            {filteredRows.map((row) => (
              <article
                key={row.pilotoId}
                className="rounded-2xl border border-rks-line/70 bg-gradient-to-r from-rks-surface/90 to-black/50 p-4 shadow-lg shadow-black/30"
              >
                <p className="text-base font-bold text-zinc-100">{row.piloto}</p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-rks-blue/40 bg-rks-blue/10 p-3 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-300">Kart</p>
                    <p className="mt-1 text-2xl font-black text-rks-blue">{row.kart ?? "—"}</p>
                  </div>

                  <div className="rounded-xl border border-rks-line/70 bg-black/25 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Lastre</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-100">{row.lastreLabel}</p>
                  </div>
                </div>

                {(!row.hasKart || !row.hasWeight) ? (
                  <div className="mt-3 rounded-xl border border-red-500/35 bg-red-950/20 px-3 py-2 text-xs font-semibold text-red-300">
                    {!row.hasKart ? "⚠ Sin kart asignado" : ""}
                    {!row.hasKart && !row.hasWeight ? " · " : ""}
                    {!row.hasWeight ? "⚠ Sin peso registrado" : ""}
                  </div>
                ) : null}
              </article>
            ))}

            {filteredRows.length === 0 ? (
              <p className="rounded-2xl border border-rks-line/70 bg-black/25 p-4 text-sm text-zinc-400">
                No hay pilotos que coincidan con la búsqueda.
              </p>
            ) : null}
          </section>

          <section className="hidden overflow-hidden rounded-2xl border border-rks-line/70 bg-rks-surface/80 shadow-xl shadow-black/25 md:block">
            <div className="grid grid-cols-[minmax(0,1.3fr)_120px_minmax(0,1fr)_220px] gap-3 border-b border-rks-line/70 bg-black/25 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
              <p>Piloto</p>
              <p>Kart</p>
              <p>Lastre</p>
              <p>Estado</p>
            </div>

            <div className="divide-y divide-rks-line/60">
              {filteredRows.map((row) => (
                <div key={row.pilotoId} className="grid grid-cols-[minmax(0,1.3fr)_120px_minmax(0,1fr)_220px] items-center gap-3 px-4 py-3">
                  <p className="truncate font-semibold text-zinc-100">{row.piloto}</p>
                  <p className="text-2xl font-black text-rks-blue">{row.kart ?? "—"}</p>
                  <p className="font-semibold text-zinc-200">{row.lastreLabel}</p>
                  {(!row.hasKart || !row.hasWeight) ? (
                    <p className="text-xs font-semibold text-red-300">
                      {!row.hasKart ? "Sin kart" : ""}
                      {!row.hasKart && !row.hasWeight ? " · " : ""}
                      {!row.hasWeight ? "Sin peso" : ""}
                    </p>
                  ) : (
                    <p className="text-xs font-semibold text-emerald-300">OK</p>
                  )}
                </div>
              ))}

              {filteredRows.length === 0 ? (
                <p className="p-4 text-sm text-zinc-400">No hay pilotos que coincidan con la búsqueda.</p>
              ) : null}
            </div>
          </section>
        </main>
      </div>

      <BottomNav />
    </>
  );
}

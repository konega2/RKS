import Link from "next/link";

import { BottomNav } from "./bottom-nav";

export function RaceHomeScreen() {
  return (
    <>
      <div className="relative min-h-screen overflow-x-hidden bg-[var(--background)]">
        <div className="pointer-events-none fixed inset-0 z-0 bg-[var(--background)]" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-neon-lines-blue opacity-35 animate-neon-lines" />

        <main className="relative z-10 mx-auto w-full max-w-3xl space-y-4 px-4 pb-28 pt-6 sm:pt-8">
          <section className="rounded-3xl border border-rks-line/70 bg-gradient-to-br from-black via-rks-surface to-rks-blue-deep/25 p-5 shadow-2xl shadow-rks-blue/10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rks-blue/90">Carrera final</p>
            <h1 className="mt-2 text-3xl font-black uppercase text-zinc-100 sm:text-4xl">Sección pública</h1>
            <p className="mt-2 text-sm text-zinc-300">Selecciona qué vista quieres mostrar.</p>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/carrera/parrilla"
              className="group rounded-3xl border border-rks-line/70 bg-gradient-to-br from-rks-surface/85 to-black/50 p-6 shadow-xl shadow-black/30 transition duration-300 hover:-translate-y-0.5 hover:border-rks-blue/60 hover:shadow-[0_0_20px_rgba(31,94,255,0.25)]"
            >
              <p className="text-3xl" aria-hidden="true">🏁</p>
              <h2 className="mt-3 text-2xl font-black uppercase text-zinc-100">Parrilla de salida</h2>
              <p className="mt-1 text-sm text-zinc-400">Orden oficial según qualy</p>
            </Link>

            <Link
              href="/carrera/directo"
              className="group rounded-3xl border border-rks-line/70 bg-gradient-to-br from-rks-surface/85 to-black/50 p-6 shadow-xl shadow-black/30 transition duration-300 hover:-translate-y-0.5 hover:border-rks-blue/60 hover:shadow-[0_0_20px_rgba(31,94,255,0.25)]"
            >
              <p className="text-3xl" aria-hidden="true">🔴</p>
              <h2 className="mt-3 text-2xl font-black uppercase text-zinc-100">Directo</h2>
              <p className="mt-1 text-sm text-zinc-400">Live timing carrera final · 20 vueltas</p>
            </Link>
          </section>
        </main>
      </div>

      <BottomNav />
    </>
  );
}

import Link from "next/link";

import { BottomNav } from "./bottom-nav";

export function TrainingHomeScreen() {
  return (
    <>
      <div className="relative min-h-screen overflow-x-hidden bg-[var(--background)]">
        <div className="pointer-events-none fixed inset-0 z-0 bg-[var(--background)]" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-neon-lines-blue opacity-35 animate-neon-lines" />

        <main className="relative z-10 mx-auto w-full max-w-3xl space-y-4 px-4 pb-28 pt-6 sm:pt-8">
          <section className="rounded-3xl border border-rks-line/70 bg-gradient-to-br from-black via-rks-surface to-rks-blue-deep/25 p-5 shadow-2xl shadow-rks-blue/10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rks-blue/90">Entrenamiento</p>
            <h1 className="mt-2 text-3xl font-black uppercase text-zinc-100 sm:text-4xl">Live timing</h1>
            <p className="mt-2 text-sm text-zinc-300">Selecciona sesión para ver tiempos en directo.</p>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/entrenamiento/qualy"
              className="group rounded-3xl border border-rks-line/70 bg-gradient-to-br from-rks-surface/85 to-black/50 p-6 shadow-xl shadow-black/30 transition duration-300 hover:-translate-y-0.5 hover:border-rks-blue/60 hover:shadow-[0_0_20px_rgba(31,94,255,0.25)]"
            >
              <p className="text-3xl" aria-hidden="true">🟡</p>
              <h2 className="mt-3 text-2xl font-black uppercase text-zinc-100">Qualy</h2>
              <p className="mt-1 text-sm text-zinc-400">1 vuelta por piloto</p>
            </Link>

            <Link
              href="/entrenamiento/carrera"
              className="group rounded-3xl border border-rks-line/70 bg-gradient-to-br from-rks-surface/85 to-black/50 p-6 shadow-xl shadow-black/30 transition duration-300 hover:-translate-y-0.5 hover:border-rks-blue/60 hover:shadow-[0_0_20px_rgba(31,94,255,0.25)]"
            >
              <p className="text-3xl" aria-hidden="true">🟢</p>
              <h2 className="mt-3 text-2xl font-black uppercase text-zinc-100">Carrera</h2>
              <p className="mt-1 text-sm text-zinc-400">8 minutos · clasificación en vivo</p>
            </Link>
          </section>
        </main>
      </div>

      <BottomNav />
    </>
  );
}

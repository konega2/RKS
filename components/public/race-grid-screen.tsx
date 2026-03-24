import Link from "next/link";

import { formatLapTime, type CarreraSnapshot } from "@/lib/carrera";

import { BottomNav } from "./bottom-nav";

type RaceGridScreenProps = {
  initialSnapshot: CarreraSnapshot;
};

export function RaceGridScreen({ initialSnapshot }: RaceGridScreenProps) {
  const rows = initialSnapshot.startingGrid;

  const leftLane = rows.filter((row) => row.pos % 2 === 1);
  const rightLane = rows.filter((row) => row.pos % 2 === 0);
  const laneRows = Math.max(leftLane.length, rightLane.length);

  return (
    <>
      <div className="relative min-h-screen overflow-x-hidden bg-[var(--background)]">
        <div className="pointer-events-none fixed inset-0 z-0 bg-[var(--background)]" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-neon-lines-blue opacity-35 animate-neon-lines" />

        <main className="relative z-10 mx-auto w-full max-w-5xl space-y-4 px-4 pb-28 pt-6 sm:pt-8">
          <section className="rounded-3xl border border-rks-line/70 bg-gradient-to-br from-black via-rks-surface to-rks-blue-deep/25 p-5 shadow-2xl shadow-rks-blue/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rks-blue/90">Carrera final</p>
                <h1 className="mt-2 text-3xl font-black uppercase text-zinc-100 sm:text-4xl">Parrilla de salida</h1>
                <p className="mt-1 text-sm text-zinc-300">Basada en qualy oficial</p>
              </div>
              <Link href="/carrera" className="inline-flex h-10 items-center rounded-xl border border-rks-line/70 bg-black/30 px-3 text-sm font-semibold text-zinc-200">
                Volver
              </Link>
            </div>
          </section>

          {rows.length === 0 ? (
            <section className="rounded-2xl border border-rks-line/70 bg-rks-surface/80 p-4 text-sm text-zinc-300 shadow-xl shadow-black/25">
              No hay resultados de qualy oficial para generar parrilla.
            </section>
          ) : (
            <>
              <section className="space-y-2 md:hidden">
                {rows.map((row) => (
                  <article
                    key={row.pilotoId}
                    className={`rounded-2xl border p-4 shadow-xl shadow-black/25 ${
                      row.pos === 1
                        ? "border-rks-blue/70 bg-rks-blue/15"
                        : "border-rks-line/70 bg-rks-surface/80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className={`text-2xl font-black ${row.pos === 1 ? "text-rks-blue" : "text-zinc-100"}`}>P{row.pos}</p>
                      <p className="rounded-full border border-rks-line/70 bg-black/25 px-2 py-1 text-xs font-semibold text-zinc-300">Kart {row.kart ?? "—"}</p>
                    </div>
                    <p className="mt-2 truncate text-lg font-bold text-zinc-100">{row.piloto}</p>
                    <p className="mt-1 text-sm text-zinc-400">Qualy: {formatLapTime(row.tiempoQualy)}</p>
                  </article>
                ))}
              </section>

              <section className="hidden rounded-2xl border border-rks-line/70 bg-rks-surface/80 p-5 shadow-xl shadow-black/25 md:block">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    {Array.from({ length: laneRows }, (_, index) => (
                      <GridSlot key={`public-grid-left-${index}`} row={leftLane[index] ?? null} />
                    ))}
                  </div>

                  <div className="space-y-4 pt-8">
                    {Array.from({ length: laneRows }, (_, index) => (
                      <GridSlot key={`public-grid-right-${index}`} row={rightLane[index] ?? null} />
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      <BottomNav />
    </>
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
    return <div className="h-[92px] rounded-2xl border border-dashed border-rks-line/60 bg-black/10" />;
  }

  const isPole = row.pos === 1;

  return (
    <article
      className={`rounded-2xl border p-4 shadow-lg ${
        isPole
          ? "border-rks-blue/70 bg-rks-blue/15 shadow-rks-blue/20"
          : "border-rks-line/70 bg-black/25 shadow-black/30"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={`text-xl font-black ${isPole ? "text-rks-blue" : "text-zinc-100"}`}>P{row.pos}</p>
        <p className="rounded-full border border-rks-line/70 bg-black/25 px-2 py-1 text-xs font-semibold text-zinc-300">Kart {row.kart ?? "—"}</p>
      </div>

      <p className="mt-2 truncate text-base font-bold text-zinc-100">{row.piloto}</p>
      <p className="mt-1 text-sm text-zinc-400">Qualy: {formatLapTime(row.tiempoQualy)}</p>
    </article>
  );
}

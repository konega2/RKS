type HeroSectionProps = {
  eventTitle: string;
  statusTitle: "EN CURSO" | "SIGUIENTE";
  statusValue: string;
  statusSubline?: string;
};

export function HeroSection({
  eventTitle,
  statusTitle,
  statusValue,
  statusSubline,
}: HeroSectionProps) {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden rounded-3xl border border-rks-line/70 bg-gradient-to-br from-black via-rks-surface to-rks-blue-deep/45 p-5 shadow-[0_0_45px_rgba(31,94,255,0.2)] md:p-7"
    >
      <div className="pointer-events-none absolute -left-14 -top-16 h-44 w-44 rounded-full bg-rks-blue/30 blur-3xl motion-safe:animate-pulse" />
      <div className="pointer-events-none absolute -right-16 -bottom-20 h-52 w-52 rounded-full bg-rks-blue-deep/45 blur-3xl motion-safe:animate-pulse" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background:linear-gradient(120deg,transparent_15%,rgba(255,255,255,0.08)_40%,transparent_65%)]" />

      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rks-blue/90">
          {eventTitle}
        </p>

        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-rks-blue md:text-base">
          {statusTitle}
        </p>
        <h1 className="mt-1 text-4xl font-black uppercase leading-[1.02] tracking-[0.06em] text-white sm:text-5xl md:text-6xl">
          {statusValue}
        </h1>
        {statusSubline ? (
          <p className="mt-3 max-w-2xl text-sm font-medium text-zinc-300 md:text-base">{statusSubline}</p>
        ) : null}
      </div>
    </section>
  );
}

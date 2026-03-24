type InfoCardProps = {
  icon: string;
  title: string;
  value: string;
  accent?: "blue" | "neutral";
};

export function InfoCard({ icon, title, value, accent = "blue" }: InfoCardProps) {
  return (
    <article className="rounded-2xl border border-rks-line/70 bg-gradient-to-br from-black/35 to-rks-surface/80 p-4 shadow-lg shadow-black/25 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-rks-blue/60">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">{title}</p>
        <span className="text-lg" aria-hidden="true">
          {icon}
        </span>
      </div>
      <p className={`mt-2 text-xl font-black ${accent === "blue" ? "text-rks-blue" : "text-zinc-100"}`}>
        {value}
      </p>
    </article>
  );
}

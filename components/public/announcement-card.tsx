type AnnouncementCardProps = {
  message: string;
  createdAt: string;
};

export function AnnouncementCard({ message, createdAt }: AnnouncementCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-rks-line/70 bg-gradient-to-r from-black/45 via-rks-surface/85 to-black/45 p-4 shadow-xl shadow-black/30 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-rks-blue/60 hover:shadow-[0_0_24px_rgba(31,94,255,0.2)]">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-rks-blue/80" />

      <div className="pl-2">
        <p className="text-sm leading-relaxed text-zinc-100 md:text-[15px]">{message}</p>
        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-rks-blue/80" />
          <p>{formatDateTime(createdAt)}</p>
        </div>
      </div>
    </article>
  );
}

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

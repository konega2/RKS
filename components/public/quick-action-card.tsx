type QuickActionCardProps = {
  icon: string;
  label: string;
  href: string;
};

export function QuickActionCard({ icon, label, href }: QuickActionCardProps) {
  return (
    <a
      href={href}
      className="group rounded-2xl border border-rks-line/70 bg-gradient-to-br from-rks-surface/85 to-black/45 p-4 text-center shadow-xl shadow-black/30 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-rks-blue/60 hover:shadow-[0_0_20px_rgba(31,94,255,0.25)] active:scale-[0.98]"
    >
      <p className="text-2xl" aria-hidden="true">
        {icon}
      </p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-200 md:text-sm">
        {label}
      </p>
    </a>
  );
}

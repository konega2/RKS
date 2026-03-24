"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/live-timing",
    label: "Live",
    icon: "📶",
  },
  {
    href: "/pre-carrera",
    label: "Pre-carrera",
    icon: "🏎️",
  },
  {
    href: "/entrenamiento",
    label: "Entrenamiento",
    icon: "🏋️",
  },
  {
    href: "/",
    label: "Inicio",
    icon: "🏠",
  },
  {
    href: "/qualy",
    label: "Qualy",
    icon: "🕒",
  },
  {
    href: "/carrera",
    label: "Carrera",
    icon: "🏁",
  },
  {
    href: "/resultados",
    label: "Resultados",
    icon: "🏆",
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto w-full max-w-[980px] border-t border-rks-line/70 bg-black/90 backdrop-blur-xl">
        <ul className="grid grid-cols-7 gap-1 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-1.5">
          {navItems.map((item) => (
            <li key={item.href} className="relative">
              <NavLink href={item.href} label={item.label} icon={item.icon} active={isActive(item.href)} />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`group flex h-14 w-full flex-col items-center justify-center rounded-xl border text-[10px] font-semibold leading-tight transition duration-200 active:scale-[0.97] sm:h-14 ${
        active
          ? "border-rks-blue/70 bg-rks-blue/20 text-white shadow-[0_0_18px_rgba(31,94,255,0.35)]"
          : "border-rks-line/60 bg-black/35 text-zinc-300 hover:border-rks-line/80 hover:bg-black/45 hover:text-zinc-100"
      }`}
    >
      <span
        className={`text-xl sm:text-xl ${active ? "drop-shadow-[0_0_10px_rgba(31,94,255,0.6)]" : ""}`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="hidden text-[10px] sm:block">{label}</span>
    </Link>
  );
}

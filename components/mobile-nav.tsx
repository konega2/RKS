"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin/pilotos", label: "Pilotos", icon: "🧑" },
  { href: "/admin/precarrera", label: "Pre-carrera", icon: "🏁" },
  { href: "/admin/entrenamiento", label: "Entrenamiento", icon: "🏋️" },
  { href: "/admin/qualy", label: "Qualy", icon: "⏱️" },
  { href: "/admin/carrera", label: "Carrera", icon: "🏎️" },
  { href: "/admin/evento", label: "Evento", icon: "📢" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-rks-line/70 bg-gradient-to-t from-rks-surface via-black/95 to-black/80 backdrop-blur">
      <div className="mx-auto max-w-3xl px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 md:px-3 md:pb-2 md:pt-2.5">
        <ul className="grid grid-cols-6 gap-1.5 md:gap-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-label={item.label}
                  title={item.label}
                  className={`flex h-10 items-center justify-center rounded-xl border px-1 transition md:h-11 ${
                    isActive
                      ? "border-rks-blue/70 bg-gradient-to-r from-rks-blue to-rks-blue-deep text-white shadow-[0_0_18px_rgba(31,94,255,0.4)]"
                      : "border-rks-line/70 bg-zinc-950/90 text-zinc-300 hover:border-rks-amber/30 hover:bg-zinc-900"
                  }`}
                >
                  <span className="text-lg leading-none md:text-xl" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="sr-only">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

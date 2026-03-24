import { type ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-lg shadow-black/20 ${className}`}
    >
      {children}
    </section>
  );
}

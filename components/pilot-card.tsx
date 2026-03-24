import Image from "next/image";
import Link from "next/link";

import { Card } from "@/components/card";

type PilotCardProps = {
  id: number;
  nombre: string;
  apellidos: string;
  socio: boolean;
  foto?: string | null;
};

export function PilotCard({
  id,
  nombre,
  apellidos,
  socio,
  foto,
}: PilotCardProps) {
  return (
    <Link href={`/admin/pilotos/${id}`} className="block">
      <Card className="group overflow-hidden rounded-2xl border-zinc-800/90 p-0 shadow-lg shadow-black/30 transition duration-300 md:hover:scale-[1.02] md:hover:border-amber-500/60 md:hover:shadow-amber-900/25">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-950">
          {foto ? (
            <Image
              src={`/uploads/${foto}`}
              alt={`Foto de ${nombre} ${apellidos}`}
              fill
              className="object-cover transition duration-300 md:group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 text-4xl font-bold text-zinc-500">
              {nombre.charAt(0)}
              {apellidos.charAt(0)}
            </div>
          )}

          {socio ? (
            <span className="absolute right-3 top-3 rounded-full border border-amber-400/40 bg-amber-500/90 px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] text-zinc-950">
              SOCIO
            </span>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent p-4 pt-12">
            <h3 className="line-clamp-2 text-center text-sm font-bold uppercase tracking-[0.18em] text-zinc-100 md:text-base">
              {nombre} {apellidos}
            </h3>
          </div>
        </div>
      </Card>
    </Link>
  );
}

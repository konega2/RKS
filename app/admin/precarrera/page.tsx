import Link from "next/link";

import { PreCarreraBoard } from "@/components/pre-carrera-board";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PreCarreraPage() {
  let pilots: Array<{
    id: number;
    nombre: string;
    apellidos: string;
    preCarrera: {
      peso: number | null;
      kart: number | null;
      lastre: number | null;
      verificado: boolean;
    } | null;
  }> = [];

  try {
    pilots = await prisma.piloto.findMany({
      orderBy: [{ nombre: "asc" }, { apellidos: "asc" }],
      include: {
        preCarrera: true,
      },
    });
  } catch (error) {
    console.error("PreCarreraPage query failed", error);
    pilots = [];
  }

  const boardKey = pilots
    .map(
      (pilot) =>
        `${pilot.id}:${pilot.preCarrera?.peso ?? "null"}:${pilot.preCarrera?.kart ?? "null"}:${pilot.preCarrera?.lastre ?? "null"}`,
    )
    .join("|");

  return (
    <section className="mx-auto w-full max-w-6xl space-y-5 md:space-y-6">
      {pilots.length === 0 ? (
        <div className="rounded-2xl border border-rks-line/70 bg-rks-surface/80 p-6 text-center shadow-lg shadow-black/20">
          <h2 className="text-xl font-bold text-zinc-100">No hay pilotos cargados</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Crea pilotos antes de gestionar pre-carrera.
          </p>
          <Link
            href="/admin/pilotos/new"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-rks-blue px-4 text-sm font-semibold text-white"
          >
            Crear piloto
          </Link>
        </div>
      ) : (
        <PreCarreraBoard
          key={boardKey}
          pilots={pilots.map((pilot) => ({
            id: pilot.id,
            nombre: pilot.nombre,
            apellidos: pilot.apellidos,
            peso: pilot.preCarrera?.peso ?? null,
            kart: pilot.preCarrera?.kart ?? null,
            verificado: pilot.preCarrera?.verificado ?? false,
          }))}
        />
      )}
    </section>
  );
}

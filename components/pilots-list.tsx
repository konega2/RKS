"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { PilotCard } from "@/components/pilot-card";

type PilotsListProps = {
  pilotos: PilotListItem[];
};

export type PilotListItem = {
  id: number;
  nombre: string;
  apellidos: string;
  dorsal: number | null;
  socio: boolean;
  entrenamiento: boolean;
  foto: string | null;
};

type BinaryFilter = "all" | "yes" | "no";

export function PilotsList({ pilotos }: PilotsListProps) {
  const [search, setSearch] = useState("");
  const [socioFilter, setSocioFilter] = useState<BinaryFilter>("all");
  const [entrenamientoFilter, setEntrenamientoFilter] =
    useState<BinaryFilter>("all");

  const filteredPilots = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return pilotos.filter((pilot) => {
      const fullName = `${pilot.nombre} ${pilot.apellidos}`.toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 || fullName.includes(normalizedSearch);

      const matchesSocio =
        socioFilter === "all" ||
        (socioFilter === "yes" ? pilot.socio : !pilot.socio);

      const matchesEntrenamiento =
        entrenamientoFilter === "all" ||
        (entrenamientoFilter === "yes"
          ? pilot.entrenamiento
          : !pilot.entrenamiento);

      return matchesSearch && matchesSocio && matchesEntrenamiento;
    });
  }, [entrenamientoFilter, pilotos, search, socioFilter]);

  return (
    <section className="space-y-5 md:space-y-8">
      <div className="rounded-2xl border border-rks-line/80 bg-gradient-to-r from-rks-surface/95 via-zinc-950 to-zinc-950 p-3 shadow-lg shadow-black/20 md:p-5">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rks-amber/85">
              Gestión de pilotos
            </p>
            <h2 className="mt-1 text-2xl font-bold uppercase tracking-[0.08em] text-zinc-100 md:text-3xl">
              Pilotos confirmados
            </h2>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_200px_auto] md:items-center">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o apellidos"
            className="h-12 w-full rounded-xl border border-rks-line bg-zinc-950/90 px-4 text-base text-zinc-100 outline-none ring-rks-blue placeholder:text-zinc-500 focus:ring-2"
          />

          <select
            value={socioFilter}
            onChange={(event) => setSocioFilter(event.target.value as BinaryFilter)}
            className="h-11 rounded-xl border border-rks-line bg-zinc-950/90 px-3 text-sm text-zinc-200"
          >
            <option value="all">Socio: Todos</option>
            <option value="yes">Socio: Sí</option>
            <option value="no">Socio: No</option>
          </select>

          <select
            value={entrenamientoFilter}
            onChange={(event) =>
              setEntrenamientoFilter(event.target.value as BinaryFilter)
            }
            className="h-11 rounded-xl border border-rks-line bg-zinc-950/90 px-3 text-sm text-zinc-200"
          >
            <option value="all">Entreno: Todos</option>
            <option value="yes">Entreno: Sí</option>
            <option value="no">Entreno: No</option>
          </select>

          <Link
            href="/admin/pilotos/new"
            className="flex h-12 items-center justify-center rounded-xl bg-rks-amber px-5 text-base font-bold text-zinc-950 transition hover:brightness-110"
          >
            + Añadir piloto
          </Link>
        </div>
      </div>

      <div>
        <p className="text-sm text-zinc-400/90">
          {filteredPilots.length} piloto{filteredPilots.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 xl:grid-cols-4 xl:gap-8">
        {filteredPilots.map((pilot) => (
          <PilotCard
            key={pilot.id}
            id={pilot.id}
            nombre={pilot.nombre}
            apellidos={pilot.apellidos}
            socio={pilot.socio}
            foto={pilot.foto}
          />
        ))}
      </div>

      {filteredPilots.length === 0 ? (
        <div>
          <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
            No se encontraron pilotos con esos filtros.
          </p>
        </div>
      ) : null}
    </section>
  );
}

import Link from "next/link";

import { getQualySnapshot } from "@/app/admin/qualy/data";
import { QualyBoard } from "@/components/qualy-board";

export const dynamic = "force-dynamic";

export default async function QualyPage() {
  const snapshot = await getQualySnapshot();

  if (snapshot.pilots.length === 0) {
    return (
      <section className="mx-auto w-full max-w-6xl">
        <div className="rounded-2xl border border-rks-line/70 bg-rks-surface/80 p-6 text-center shadow-lg shadow-black/20">
          <h2 className="text-xl font-bold text-zinc-100">No hay pilotos cargados</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Crea pilotos antes de iniciar qualy oficial.
          </p>
          <Link
            href="/admin/pilotos/new"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-rks-blue px-4 text-sm font-semibold text-white"
          >
            Crear piloto
          </Link>
        </div>
      </section>
    );
  }

  return <QualyBoard initialSnapshot={snapshot} />;
}

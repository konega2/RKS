import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { deletePilotAction } from "@/app/admin/pilotos/actions";
import { Card } from "@/components/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PilotForm } from "@/components/pilot-form";
import { buildPilotInitialState } from "@/lib/pilot-form";
import { prisma } from "@/lib/prisma";

type EditPilotPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPilotPage({ params }: EditPilotPageProps) {
  const { id } = await params;
  const pilotoId = Number(id);

  if (!Number.isInteger(pilotoId) || pilotoId <= 0) {
    notFound();
  }

  let piloto: {
    id: number;
    nombre: string;
    apellidos: string;
    edad: number;
    dni: string;
    dorsal: number | null;
    socio: boolean;
    entrenamiento: boolean;
    foto: string | null;
  } | null = null;

  try {
    piloto = await prisma.piloto.findUnique({
      where: { id: pilotoId },
    });
  } catch (error) {
    console.error("EditPilotPage query failed", error);
    piloto = null;
  }

  if (!piloto) {
    notFound();
  }

  const state = buildPilotInitialState({
    id: String(piloto.id),
    nombre: piloto.nombre,
    apellidos: piloto.apellidos,
    edad: String(piloto.edad),
    dni: piloto.dni,
    dorsal: piloto.dorsal ? String(piloto.dorsal) : "",
    socio: piloto.socio ? "on" : "off",
    entrenamiento: piloto.entrenamiento ? "on" : "off",
  });
  const photoSrc = piloto.foto;

  return (
    <section className="relative mx-auto w-full max-w-6xl space-y-5 md:space-y-7">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,color-mix(in_oklab,var(--rks-blue)_22%,transparent),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,color-mix(in_oklab,var(--rks-blue)_15%,transparent)_60%,transparent_78%)]" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/pilotos"
          className="inline-flex h-10 items-center rounded-full border border-rks-line bg-rks-surface/70 px-4 text-sm font-medium text-zinc-200 transition hover:border-rks-blue hover:text-white"
        >
          ← Volver a pilotos
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rks-blue/80">
          Gestión de pilotos
        </p>
      </div>

      <Card className="overflow-hidden border-rks-line bg-rks-surface/85 p-0 shadow-2xl shadow-black/35">
        <div className="grid md:grid-cols-[280px_minmax(0,1fr)] md:items-stretch">
          <div className="relative aspect-square w-full md:aspect-auto md:h-full">
            {photoSrc ? (
              <Image
                src={photoSrc}
                alt={`Foto de ${piloto.nombre} ${piloto.apellidos}`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-rks-surface text-5xl font-black tracking-wide text-rks-blue">
                {piloto.nombre.charAt(0)}
                {piloto.apellidos.charAt(0)}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>

          <div className="space-y-5 bg-gradient-to-br from-rks-surface/95 via-rks-blue-deep/35 to-rks-surface/90 p-5 md:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rks-blue/85">
              Ficha de piloto
            </p>
            <h1 className="text-2xl font-black uppercase tracking-[0.04em] text-white md:text-4xl">
              {piloto.nombre} {piloto.apellidos}
            </h1>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex rounded-full border border-rks-blue/45 bg-rks-blue/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rks-blue">
                {piloto.dorsal ? `Dorsal #${piloto.dorsal}` : "Sin dorsal"}
              </span>
              {piloto.socio ? (
                <span className="inline-flex rounded-full border border-rks-blue/45 bg-rks-blue/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  Socio
                </span>
              ) : null}
              {piloto.entrenamiento ? (
                <span className="inline-flex rounded-full border border-rks-blue/45 bg-rks-blue/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  Entrenamiento
                </span>
              ) : null}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-rks-line/80 bg-rks-surface/70 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Edad
                </p>
                <p className="text-base font-semibold text-zinc-100">{piloto.edad} años</p>
              </div>
              <div className="rounded-xl border border-rks-line/80 bg-rks-surface/70 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  DNI
                </p>
                <p className="text-base font-semibold text-zinc-100">{piloto.dni}</p>
              </div>
              <div className="rounded-xl border border-rks-line/80 bg-rks-surface/70 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  ID piloto
                </p>
                <p className="text-base font-semibold text-zinc-100">#{piloto.id}</p>
              </div>
              <div className="rounded-xl border border-rks-line/80 bg-rks-surface/70 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Estado
                </p>
                <p className="text-base font-semibold text-zinc-100">Activo</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px] md:items-start">
        <Card className="border-rks-line bg-rks-surface/85 p-5 shadow-xl shadow-black/25">
          <div className="mb-4 border-b border-rks-line/70 pb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rks-blue/85">
              Datos del piloto
            </p>
            <p className="mt-1 text-sm text-zinc-400">Actualiza la información principal y la foto del perfil.</p>
          </div>
          <PilotForm
            formTitle="Editar piloto"
            submitLabel="Guardar cambios"
            defaultValues={state.values}
            currentPhoto={piloto.foto}
          />
        </Card>

        <Card className="border-rks-line bg-rks-surface/80 p-4 shadow-xl shadow-black/25">
          <form action={deletePilotAction} className="space-y-3">
            <input type="hidden" name="id" value={piloto.id} />
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
              Acción crítica
            </p>
            <p className="text-sm text-zinc-500">Elimina permanentemente el piloto y su foto asociada.</p>
            <ConfirmDialog
              message="¿Seguro que quieres eliminar este piloto? Esta acción no se puede deshacer."
              className="h-12 w-full rounded-xl border border-red-900/70 bg-red-950/40 px-4 text-sm font-semibold text-red-300 transition hover:bg-red-900/40"
            >
              Eliminar piloto
            </ConfirmDialog>
          </form>
        </Card>
      </div>
    </section>
  );
}

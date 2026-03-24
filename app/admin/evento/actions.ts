"use server";

import { revalidatePath } from "next/cache";

import {
  EVENT_PHASES,
  isEventPhase,
  normalizeScheduleHour,
} from "@/lib/evento";
import { prisma } from "@/lib/prisma";

export type EventoActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const initialState: EventoActionState = {
  status: "idle",
};

async function getEventoId() {
  const existing = await prisma.evento.findFirst({
    orderBy: [{ id: "asc" }],
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const created = await prisma.evento.create({
    data: {
      faseActual: "registro",
    },
    select: { id: true },
  });

  return created.id;
}

function success(message: string): EventoActionState {
  return { status: "success", message };
}

function error(message: string): EventoActionState {
  return { status: "error", message };
}

export async function setEventoFaseAction(
  prevState: EventoActionState = initialState,
  formData: FormData,
): Promise<EventoActionState> {
  void prevState;

  const fase = formData.get("fase")?.toString().trim() ?? "";
  if (!isEventPhase(fase)) {
    return error("Fase inválida.");
  }

  const eventoId = await getEventoId();

  await prisma.evento.update({
    where: { id: eventoId },
    data: { faseActual: fase },
  });

  revalidatePath("/admin/evento");

  return success(`Fase actual cambiada a ${fase.toUpperCase()}.`);
}

export async function saveHorariosAction(
  prevState: EventoActionState = initialState,
  formData: FormData,
): Promise<EventoActionState> {
  void prevState;

  const horarios = EVENT_PHASES.map((fase) => ({
    nombre: fase,
    hora: normalizeScheduleHour(formData.get(`${fase}Hora`)?.toString() ?? ""),
  }));

  const existing = await prisma.fase.findMany({
    where: {
      nombre: {
        in: [...EVENT_PHASES],
      },
    },
    select: {
      id: true,
      nombre: true,
    },
  });

  const existingByName = new Map<string, { id: number; nombre: string }>(
    existing.map((fase: { id: number; nombre: string }) => [fase.nombre, fase]),
  );

  await prisma.$transaction(
    horarios.map((item) => {
      const current = existingByName.get(item.nombre);

      if (current) {
        return prisma.fase.update({
          where: { id: current.id },
          data: { hora: item.hora },
        });
      }

      return prisma.fase.create({
        data: {
          nombre: item.nombre,
          hora: item.hora,
        },
      });
    }),
  );

  revalidatePath("/admin/evento");

  return success("Horarios guardados correctamente.");
}

export async function publishAnuncioAction(
  prevState: EventoActionState = initialState,
  formData: FormData,
): Promise<EventoActionState> {
  void prevState;

  const mensaje = formData.get("mensaje")?.toString().trim() ?? "";

  if (!mensaje) {
    return error("El anuncio no puede estar vacío.");
  }

  await prisma.anuncio.create({
    data: {
      mensaje,
    },
  });

  revalidatePath("/admin/evento");

  return success("Anuncio publicado.");
}

export async function deleteAnuncioAction(
  prevState: EventoActionState = initialState,
  formData: FormData,
): Promise<EventoActionState> {
  void prevState;

  const id = Number(formData.get("anuncioId")?.toString() ?? "");

  if (!Number.isInteger(id) || id <= 0) {
    return error("Anuncio inválido.");
  }

  await prisma.anuncio.delete({
    where: { id },
  });

  revalidatePath("/admin/evento");

  return success("Anuncio eliminado.");
}

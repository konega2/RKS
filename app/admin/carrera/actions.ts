"use server";

import { revalidatePath } from "next/cache";

import { CARRERA_FINAL_SESSION, computeCarreraSnapshot, computePoints, type CarreraSanctionType } from "@/lib/carrera";
import { prisma } from "@/lib/prisma";

export type CarreraActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const initialState: CarreraActionState = {
  status: "idle",
};

function parsePositiveInt(raw: FormDataEntryValue | null) {
  const parsed = Number(raw?.toString() ?? "");
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parsePositiveFloat(raw: FormDataEntryValue | null) {
  const normalized = raw?.toString().replace(",", ".").trim() ?? "";
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseSanctionType(raw: FormDataEntryValue | null): CarreraSanctionType | null {
  const type = raw?.toString();
  if (type === "segundos" || type === "posiciones") {
    return type;
  }

  return null;
}

async function ensurePilotExists(pilotoId: number) {
  const pilot = await prisma.piloto.findUnique({
    where: { id: pilotoId },
    select: { id: true },
  });

  return Boolean(pilot);
}

async function getCurrentLapNumber(pilotoId: number) {
  const lastLap = await prisma.vuelta.findFirst({
    where: {
      pilotoId,
      sesion: CARRERA_FINAL_SESSION,
    },
    orderBy: [{ numero: "desc" }, { createdAt: "desc" }],
    select: { numero: true },
  });

  return lastLap?.numero ?? null;
}

export async function addCarreraLapAction(
  prevState: CarreraActionState = initialState,
  formData: FormData,
): Promise<CarreraActionState> {
  void prevState;

  const pilotoId = parsePositiveInt(formData.get("pilotoId"));
  const tiempo = parsePositiveFloat(formData.get("tiempo"));

  if (!pilotoId || !tiempo) {
    return {
      status: "error",
      message: "Piloto y tiempo válidos son obligatorios.",
    };
  }

  if (!(await ensurePilotExists(pilotoId))) {
    return {
      status: "error",
      message: "Piloto no encontrado.",
    };
  }

  const lastLap = await prisma.vuelta.findFirst({
    where: {
      pilotoId,
      sesion: CARRERA_FINAL_SESSION,
    },
    orderBy: [{ numero: "desc" }],
    select: { numero: true },
  });

  const nextLapNumber = (lastLap?.numero ?? 0) + 1;

  await prisma.vuelta.create({
    data: {
      pilotoId,
      sesion: CARRERA_FINAL_SESSION,
      numero: nextLapNumber,
      tiempo,
    },
  });

  revalidatePath("/admin/carrera");

  return {
    status: "success",
    message: `Vuelta ${nextLapNumber} añadida en carrera final.`,
  };
}

export async function addCarreraSanctionAction(
  prevState: CarreraActionState = initialState,
  formData: FormData,
): Promise<CarreraActionState> {
  void prevState;

  const pilotoId = parsePositiveInt(formData.get("pilotoId"));
  const tipo = parseSanctionType(formData.get("tipo"));
  const valor = parsePositiveFloat(formData.get("valor"));
  const motivo = formData.get("motivo")?.toString().trim() ?? "";

  if (!pilotoId || !tipo || !valor || !motivo) {
    return {
      status: "error",
      message: "Completa todos los campos de sanción.",
    };
  }

  if (!(await ensurePilotExists(pilotoId))) {
    return {
      status: "error",
      message: "Piloto no encontrado.",
    };
  }

  const vuelta = await getCurrentLapNumber(pilotoId);

  await prisma.sancion.create({
    data: {
      pilotoId,
      sesion: CARRERA_FINAL_SESSION,
      tipo,
      valor,
      motivo,
      vuelta,
    },
  });

  revalidatePath("/admin/carrera");

  return {
    status: "success",
    message: "Sanción registrada en carrera final.",
  };
}

export async function updateCarreraLapAction(
  prevState: CarreraActionState = initialState,
  formData: FormData,
): Promise<CarreraActionState> {
  void prevState;

  const lapId = parsePositiveInt(formData.get("lapId"));
  const tiempo = parsePositiveFloat(formData.get("tiempo"));

  if (!lapId || !tiempo) {
    return {
      status: "error",
      message: "Datos de vuelta inválidos.",
    };
  }

  const lap = await prisma.vuelta.findUnique({
    where: { id: lapId },
    select: { id: true, sesion: true },
  });

  if (!lap || lap.sesion !== CARRERA_FINAL_SESSION) {
    return {
      status: "error",
      message: "La vuelta no existe en carrera final.",
    };
  }

  await prisma.vuelta.update({
    where: { id: lapId },
    data: { tiempo },
  });

  revalidatePath("/admin/carrera");

  return {
    status: "success",
    message: "Tiempo de vuelta actualizado.",
  };
}

export async function deleteCarreraLapAction(
  prevState: CarreraActionState = initialState,
  formData: FormData,
): Promise<CarreraActionState> {
  void prevState;

  const lapId = parsePositiveInt(formData.get("lapId"));

  if (!lapId) {
    return {
      status: "error",
      message: "Datos de vuelta inválidos.",
    };
  }

  const lap = await prisma.vuelta.findUnique({
    where: { id: lapId },
    select: { id: true, sesion: true },
  });

  if (!lap || lap.sesion !== CARRERA_FINAL_SESSION) {
    return {
      status: "error",
      message: "La vuelta no existe en carrera final.",
    };
  }

  await prisma.vuelta.delete({
    where: { id: lapId },
  });

  revalidatePath("/admin/carrera");

  return {
    status: "success",
    message: "Vuelta eliminada.",
  };
}

export async function updateCarreraSanctionAction(
  prevState: CarreraActionState = initialState,
  formData: FormData,
): Promise<CarreraActionState> {
  void prevState;

  const sancionId = parsePositiveInt(formData.get("sancionId"));
  const tipo = parseSanctionType(formData.get("tipo"));
  const valor = parsePositiveFloat(formData.get("valor"));
  const motivo = formData.get("motivo")?.toString().trim() ?? "";

  if (!sancionId || !tipo || !valor || !motivo) {
    return {
      status: "error",
      message: "Completa todos los campos de sanción.",
    };
  }

  const sancion = await prisma.sancion.findUnique({
    where: { id: sancionId },
    select: { id: true, sesion: true },
  });

  if (!sancion || sancion.sesion !== CARRERA_FINAL_SESSION) {
    return {
      status: "error",
      message: "La sanción no existe en carrera final.",
    };
  }

  await prisma.sancion.update({
    where: { id: sancionId },
    data: {
      tipo,
      valor,
      motivo,
    },
  });

  revalidatePath("/admin/carrera");

  return {
    status: "success",
    message: "Sanción actualizada.",
  };
}

export async function deleteCarreraSanctionAction(
  prevState: CarreraActionState = initialState,
  formData: FormData,
): Promise<CarreraActionState> {
  void prevState;

  const sancionId = parsePositiveInt(formData.get("sancionId"));

  if (!sancionId) {
    return {
      status: "error",
      message: "Datos de sanción inválidos.",
    };
  }

  const sancion = await prisma.sancion.findUnique({
    where: { id: sancionId },
    select: { id: true, sesion: true },
  });

  if (!sancion || sancion.sesion !== CARRERA_FINAL_SESSION) {
    return {
      status: "error",
      message: "La sanción no existe en carrera final.",
    };
  }

  await prisma.sancion.delete({
    where: { id: sancionId },
  });

  revalidatePath("/admin/carrera");

  return {
    status: "success",
    message: "Sanción eliminada.",
  };
}

export async function finalizeCarreraAction(
  prevState: CarreraActionState = initialState,
): Promise<CarreraActionState> {
  void prevState;

  const [pilots, laps, sanctions] = await Promise.all([
    prisma.piloto.findMany({
      include: {
        preCarrera: {
          select: {
            kart: true,
          },
        },
      },
    }),
    prisma.vuelta.findMany({
      where: {
        sesion: CARRERA_FINAL_SESSION,
      },
      orderBy: [{ createdAt: "asc" }, { numero: "asc" }],
    }),
    prisma.sancion.findMany({
      where: {
        sesion: CARRERA_FINAL_SESSION,
      },
      orderBy: [{ id: "asc" }],
    }),
  ]);

  const pilotBase = pilots.map((pilot: {
    id: number;
    nombre: string;
    apellidos: string;
    foto: string | null;
    preCarrera: { kart: number | null } | null;
  }) => ({
    id: pilot.id,
    nombre: pilot.nombre,
    apellidos: pilot.apellidos,
    foto: pilot.foto,
    kart: pilot.preCarrera?.kart ?? null,
  }));

  const raceComputation = computeCarreraSnapshot({
    pilots: pilotBase,
    laps,
    sanctions,
    replayLap: null,
  });

  const rows = raceComputation.rows;
  const totalPilots = rows.length;

  await prisma.$transaction([
    prisma.resultadoCarrera.deleteMany({}),
    ...rows.map((row) =>
      prisma.resultadoCarrera.create({
        data: {
          pilotoId: row.pilotoId,
          posicion: row.pos,
          puntos: computePoints(totalPilots, row.pos),
        },
      }),
    ),
  ]);

  revalidatePath("/admin/carrera");

  return {
    status: "success",
    message: "Resultados finales guardados con puntos automáticos.",
  };
}

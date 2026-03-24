"use server";

import { revalidatePath } from "next/cache";

import {
  ENTRENO_CARRERA_SESSION,
  ENTRENO_QUALY_SESSION,
  type EntrenoSession,
  type SanctionType,
} from "@/lib/entrenamiento";
import { prisma } from "@/lib/prisma";

export type EntrenamientoActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const initialState: EntrenamientoActionState = {
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

function parseSession(raw: FormDataEntryValue | null): EntrenoSession | null {
  const session = raw?.toString();
  if (session === ENTRENO_QUALY_SESSION || session === ENTRENO_CARRERA_SESSION) {
    return session;
  }

  return null;
}

function parseSanctionType(raw: FormDataEntryValue | null): SanctionType | null {
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

async function getCurrentLapNumber(pilotoId: number, sesion: EntrenoSession) {
  const lastLap = await prisma.vuelta.findFirst({
    where: {
      pilotoId,
      sesion,
    },
    orderBy: [{ numero: "desc" }, { createdAt: "desc" }],
    select: { numero: true },
  });

  return lastLap?.numero ?? null;
}

export async function setQualyLapAction(
  prevState: EntrenamientoActionState = initialState,
  formData: FormData,
): Promise<EntrenamientoActionState> {
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

  await prisma.vuelta.deleteMany({
    where: {
      pilotoId,
      sesion: ENTRENO_QUALY_SESSION,
    },
  });

  await prisma.vuelta.create({
    data: {
      pilotoId,
      sesion: ENTRENO_QUALY_SESSION,
      numero: 1,
      tiempo,
    },
  });

  revalidatePath("/admin/entrenamiento");

  return {
    status: "success",
    message: "Vuelta de qualy guardada.",
  };
}

export async function addRaceLapAction(
  prevState: EntrenamientoActionState = initialState,
  formData: FormData,
): Promise<EntrenamientoActionState> {
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
      sesion: ENTRENO_CARRERA_SESSION,
    },
    orderBy: [{ numero: "desc" }],
    select: { numero: true },
  });

  const nextLapNumber = (lastLap?.numero ?? 0) + 1;

  await prisma.vuelta.create({
    data: {
      pilotoId,
      sesion: ENTRENO_CARRERA_SESSION,
      numero: nextLapNumber,
      tiempo,
    },
  });

  revalidatePath("/admin/entrenamiento");

  return {
    status: "success",
    message: `Vuelta ${nextLapNumber} añadida en carrera.`,
  };
}

export async function updateLapAction(
  prevState: EntrenamientoActionState = initialState,
  formData: FormData,
): Promise<EntrenamientoActionState> {
  void prevState;

  const lapId = parsePositiveInt(formData.get("lapId"));
  const sesion = parseSession(formData.get("sesion"));
  const tiempo = parsePositiveFloat(formData.get("tiempo"));

  if (!lapId || !sesion || !tiempo) {
    return {
      status: "error",
      message: "Datos de vuelta inválidos.",
    };
  }

  const lap = await prisma.vuelta.findUnique({
    where: { id: lapId },
    select: { id: true, sesion: true },
  });

  if (!lap || lap.sesion !== sesion) {
    return {
      status: "error",
      message: "La vuelta no existe en esta sesión.",
    };
  }

  await prisma.vuelta.update({
    where: { id: lapId },
    data: { tiempo },
  });

  revalidatePath("/admin/entrenamiento");

  return {
    status: "success",
    message: "Tiempo de vuelta actualizado.",
  };
}

export async function deleteLapAction(
  prevState: EntrenamientoActionState = initialState,
  formData: FormData,
): Promise<EntrenamientoActionState> {
  void prevState;

  const lapId = parsePositiveInt(formData.get("lapId"));
  const sesion = parseSession(formData.get("sesion"));

  if (!lapId || !sesion) {
    return {
      status: "error",
      message: "Datos de vuelta inválidos.",
    };
  }

  const lap = await prisma.vuelta.findUnique({
    where: { id: lapId },
    select: { id: true, sesion: true },
  });

  if (!lap || lap.sesion !== sesion) {
    return {
      status: "error",
      message: "La vuelta no existe en esta sesión.",
    };
  }

  await prisma.vuelta.delete({
    where: { id: lapId },
  });

  revalidatePath("/admin/entrenamiento");

  return {
    status: "success",
    message: "Vuelta eliminada.",
  };
}

export async function addSanctionAction(
  prevState: EntrenamientoActionState = initialState,
  formData: FormData,
): Promise<EntrenamientoActionState> {
  void prevState;

  const pilotoId = parsePositiveInt(formData.get("pilotoId"));
  const sesion = parseSession(formData.get("sesion"));
  const tipo = parseSanctionType(formData.get("tipo"));
  const valor = parsePositiveFloat(formData.get("valor"));
  const motivo = formData.get("motivo")?.toString().trim() ?? "";

  if (!pilotoId || !sesion || !tipo || !valor || !motivo) {
    return {
      status: "error",
      message: "Completa todos los campos de sanción.",
    };
  }

  if (sesion === ENTRENO_QUALY_SESSION && tipo !== "segundos") {
    return {
      status: "error",
      message: "En qualy solo se permiten sanciones en segundos.",
    };
  }

  if (!(await ensurePilotExists(pilotoId))) {
    return {
      status: "error",
      message: "Piloto no encontrado.",
    };
  }

  const vuelta = await getCurrentLapNumber(pilotoId, sesion);

  await prisma.sancion.create({
    data: {
      pilotoId,
      sesion,
      tipo,
      valor,
      motivo,
      vuelta,
    },
  });

  revalidatePath("/admin/entrenamiento");

  return {
    status: "success",
    message: "Sanción registrada.",
  };
}

export async function updateSanctionAction(
  prevState: EntrenamientoActionState = initialState,
  formData: FormData,
): Promise<EntrenamientoActionState> {
  void prevState;

  const sancionId = parsePositiveInt(formData.get("sancionId"));
  const sesion = parseSession(formData.get("sesion"));
  const tipo = parseSanctionType(formData.get("tipo"));
  const valor = parsePositiveFloat(formData.get("valor"));
  const motivo = formData.get("motivo")?.toString().trim() ?? "";

  if (!sancionId || !sesion || !tipo || !valor || !motivo) {
    return {
      status: "error",
      message: "Completa todos los campos de sanción.",
    };
  }

  if (sesion === ENTRENO_QUALY_SESSION && tipo !== "segundos") {
    return {
      status: "error",
      message: "En qualy solo se permiten sanciones en segundos.",
    };
  }

  const sancion = await prisma.sancion.findUnique({
    where: { id: sancionId },
    select: { id: true, sesion: true },
  });

  if (!sancion || sancion.sesion !== sesion) {
    return {
      status: "error",
      message: "La sanción no existe en esta sesión.",
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

  revalidatePath("/admin/entrenamiento");

  return {
    status: "success",
    message: "Sanción actualizada.",
  };
}

export async function deleteSanctionAction(
  prevState: EntrenamientoActionState = initialState,
  formData: FormData,
): Promise<EntrenamientoActionState> {
  void prevState;

  const sancionId = parsePositiveInt(formData.get("sancionId"));
  const sesion = parseSession(formData.get("sesion"));

  if (!sancionId || !sesion) {
    return {
      status: "error",
      message: "Datos de sanción inválidos.",
    };
  }

  const sancion = await prisma.sancion.findUnique({
    where: { id: sancionId },
    select: { id: true, sesion: true },
  });

  if (!sancion || sancion.sesion !== sesion) {
    return {
      status: "error",
      message: "La sanción no existe en esta sesión.",
    };
  }

  await prisma.sancion.delete({
    where: { id: sancionId },
  });

  revalidatePath("/admin/entrenamiento");

  return {
    status: "success",
    message: "Sanción eliminada.",
  };
}

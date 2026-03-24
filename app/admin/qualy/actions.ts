"use server";

import { revalidatePath } from "next/cache";

import { QUALY_OFICIAL_SESSION, type QualySanctionType } from "@/lib/qualy";
import { prisma } from "@/lib/prisma";

export type QualyActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const initialState: QualyActionState = {
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

function parseSanctionType(raw: FormDataEntryValue | null): QualySanctionType | null {
  const type = raw?.toString();
  if (type === "segundos" || type === "eliminar_mejor_vuelta") {
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
      sesion: QUALY_OFICIAL_SESSION,
    },
    orderBy: [{ numero: "desc" }, { createdAt: "desc" }],
    select: { numero: true },
  });

  return lastLap?.numero ?? null;
}

export async function addQualyLapAction(
  prevState: QualyActionState = initialState,
  formData: FormData,
): Promise<QualyActionState> {
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
      sesion: QUALY_OFICIAL_SESSION,
    },
    orderBy: [{ numero: "desc" }],
    select: { numero: true },
  });

  const nextLapNumber = (lastLap?.numero ?? 0) + 1;

  await prisma.vuelta.create({
    data: {
      pilotoId,
      sesion: QUALY_OFICIAL_SESSION,
      numero: nextLapNumber,
      tiempo,
    },
  });

  revalidatePath("/admin/qualy");

  return {
    status: "success",
    message: `Vuelta ${nextLapNumber} añadida en qualy oficial.`,
  };
}

export async function addQualySanctionAction(
  prevState: QualyActionState = initialState,
  formData: FormData,
): Promise<QualyActionState> {
  void prevState;

  const pilotoId = parsePositiveInt(formData.get("pilotoId"));
  const tipo = parseSanctionType(formData.get("tipo"));
  const motivo = formData.get("motivo")?.toString().trim() ?? "";
  const valorRaw = formData.get("valor");

  if (!pilotoId || !tipo || !motivo) {
    return {
      status: "error",
      message: "Piloto, tipo y motivo son obligatorios.",
    };
  }

  if (!(await ensurePilotExists(pilotoId))) {
    return {
      status: "error",
      message: "Piloto no encontrado.",
    };
  }

  const vuelta = await getCurrentLapNumber(pilotoId);

  let valor = 1;

  if (tipo === "segundos") {
    const parsed = parsePositiveFloat(valorRaw);
    if (!parsed) {
      return {
        status: "error",
        message: "Indica un valor de segundos válido.",
      };
    }
    valor = parsed;
  }

  await prisma.sancion.create({
    data: {
      pilotoId,
      sesion: QUALY_OFICIAL_SESSION,
      tipo,
      valor,
      motivo,
      vuelta,
    },
  });

  revalidatePath("/admin/qualy");

  return {
    status: "success",
    message:
      tipo === "segundos"
        ? "Sanción por segundos aplicada."
        : "Sanción de eliminar mejor vuelta aplicada.",
  };
}

export async function updateQualyLapAction(
  prevState: QualyActionState = initialState,
  formData: FormData,
): Promise<QualyActionState> {
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

  if (!lap || lap.sesion !== QUALY_OFICIAL_SESSION) {
    return {
      status: "error",
      message: "La vuelta no existe en qualy oficial.",
    };
  }

  await prisma.vuelta.update({
    where: { id: lapId },
    data: { tiempo },
  });

  revalidatePath("/admin/qualy");

  return {
    status: "success",
    message: "Tiempo de vuelta actualizado.",
  };
}

export async function deleteQualyLapAction(
  prevState: QualyActionState = initialState,
  formData: FormData,
): Promise<QualyActionState> {
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

  if (!lap || lap.sesion !== QUALY_OFICIAL_SESSION) {
    return {
      status: "error",
      message: "La vuelta no existe en qualy oficial.",
    };
  }

  await prisma.vuelta.delete({
    where: { id: lapId },
  });

  revalidatePath("/admin/qualy");

  return {
    status: "success",
    message: "Vuelta eliminada.",
  };
}

export async function updateQualySanctionAction(
  prevState: QualyActionState = initialState,
  formData: FormData,
): Promise<QualyActionState> {
  void prevState;

  const sancionId = parsePositiveInt(formData.get("sancionId"));
  const tipo = parseSanctionType(formData.get("tipo"));
  const motivo = formData.get("motivo")?.toString().trim() ?? "";
  const valorRaw = formData.get("valor");

  if (!sancionId || !tipo || !motivo) {
    return {
      status: "error",
      message: "Completa todos los campos de sanción.",
    };
  }

  const sancion = await prisma.sancion.findUnique({
    where: { id: sancionId },
    select: { id: true, sesion: true },
  });

  if (!sancion || sancion.sesion !== QUALY_OFICIAL_SESSION) {
    return {
      status: "error",
      message: "La sanción no existe en qualy oficial.",
    };
  }

  let valor = 1;
  if (tipo === "segundos") {
    const parsed = parsePositiveFloat(valorRaw);
    if (!parsed) {
      return {
        status: "error",
        message: "Indica un valor de segundos válido.",
      };
    }
    valor = parsed;
  }

  await prisma.sancion.update({
    where: { id: sancionId },
    data: {
      tipo,
      valor,
      motivo,
    },
  });

  revalidatePath("/admin/qualy");

  return {
    status: "success",
    message: "Sanción actualizada.",
  };
}

export async function deleteQualySanctionAction(
  prevState: QualyActionState = initialState,
  formData: FormData,
): Promise<QualyActionState> {
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

  if (!sancion || sancion.sesion !== QUALY_OFICIAL_SESSION) {
    return {
      status: "error",
      message: "La sanción no existe en qualy oficial.",
    };
  }

  await prisma.sancion.delete({
    where: { id: sancionId },
  });

  revalidatePath("/admin/qualy");

  return {
    status: "success",
    message: "Sanción eliminada.",
  };
}

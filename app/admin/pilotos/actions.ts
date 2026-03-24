"use server";

import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  type PilotFormErrors,
  type PilotFormState,
  type PilotFormValues,
} from "@/lib/pilot-form";
import { prisma } from "@/lib/prisma";

const MAX_PHOTO_SIZE_BYTES = 4 * 1024 * 1024;

function parseValues(formData: FormData): PilotFormValues {
  return {
    id: formData.get("id")?.toString(),
    nombre: formData.get("nombre")?.toString().trim() ?? "",
    apellidos: formData.get("apellidos")?.toString().trim() ?? "",
    edad: formData.get("edad")?.toString().trim() ?? "",
    dni: formData.get("dni")?.toString().trim() ?? "",
    dorsal: formData.get("dorsal")?.toString().trim() ?? "",
    socio: formData.get("socio") === "on" ? "on" : "off",
    entrenamiento: formData.get("entrenamiento") === "on" ? "on" : "off",
  };
}

function validate(values: PilotFormValues): PilotFormErrors {
  const errors: PilotFormErrors = {};

  if (!values.nombre) {
    errors.nombre = "El nombre es obligatorio.";
  }

  if (!values.apellidos) {
    errors.apellidos = "Los apellidos son obligatorios.";
  }

  if (!values.edad) {
    errors.edad = "La edad es obligatoria.";
  }

  const parsedEdad = Number(values.edad);
  if (values.edad && (!Number.isInteger(parsedEdad) || parsedEdad <= 0)) {
    errors.edad = "La edad debe ser un número entero mayor que 0.";
  }

  if (!values.dni) {
    errors.dni = "El DNI es obligatorio.";
  }

  if (values.dorsal) {
    const parsedDorsal = Number(values.dorsal);
    if (!Number.isInteger(parsedDorsal) || parsedDorsal <= 0) {
      errors.dorsal = "El dorsal debe ser un número entero mayor que 0.";
    }
  }

  return errors;
}

async function ensureUploadsDir() {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  return uploadsDir;
}

async function saveUploadedPhoto(file: File): Promise<string> {
  const uploadsDir = await ensureUploadsDir();
  const extension = path.extname(file.name || "").toLowerCase();
  const safeExt = extension && extension.length <= 5 ? extension : ".jpg";
  const filename = `${Date.now()}-${randomUUID()}${safeExt}`;
  const filePath = path.join(uploadsDir, filename);
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  await writeFile(filePath, buffer);

  return filename;
}

async function removePhotoIfExists(filename?: string | null) {
  if (!filename) {
    return;
  }

  const filePath = path.join(process.cwd(), "public", "uploads", filename);
  try {
    await unlink(filePath);
  } catch {
    return;
  }
}

async function parsePhoto(formData: FormData) {
  const raw = formData.get("foto");
  if (!(raw instanceof File) || raw.size === 0) {
    return { filename: null, error: undefined as string | undefined };
  }

  if (!raw.type.startsWith("image/")) {
    return {
      filename: null,
      error: "La foto debe ser un archivo de imagen válido.",
    };
  }

  if (raw.size > MAX_PHOTO_SIZE_BYTES) {
    return {
      filename: null,
      error: "La foto supera el máximo permitido (4MB).",
    };
  }

  try {
    const filename = await saveUploadedPhoto(raw);
    return { filename, error: undefined as string | undefined };
  } catch {
    return {
      filename: null,
      error:
        "No se pudo guardar la foto en este entorno. En Vercel necesitas almacenamiento externo (por ejemplo Vercel Blob).",
    };
  }
}

export async function createPilotAction(
  _prevState: PilotFormState,
  formData: FormData,
): Promise<PilotFormState> {
  const values = parseValues(formData);
  const errors = validate(values);

  const { filename, error } = await parsePhoto(formData);
  if (error) {
    errors.foto = error;
  }

  if (Object.keys(errors).length > 0) {
    if (filename) {
      await removePhotoIfExists(filename);
    }

    return { values, errors };
  }

  try {
    await prisma.piloto.create({
      data: {
        nombre: values.nombre,
        apellidos: values.apellidos,
        edad: Number(values.edad),
        dni: values.dni,
        dorsal: values.dorsal ? Number(values.dorsal) : null,
        socio: values.socio === "on",
        entrenamiento: values.entrenamiento === "on",
        foto: filename,
      },
    });
  } catch {
    if (filename) {
      await removePhotoIfExists(filename);
    }

    return {
      values,
      errors: { form: "No se pudo crear el piloto. Intenta nuevamente." },
    };
  }

  revalidatePath("/admin/pilotos");
  redirect("/admin/pilotos");
}

export async function updatePilotAction(
  _prevState: PilotFormState,
  formData: FormData,
): Promise<PilotFormState> {
  const values = parseValues(formData);
  const errors = validate(values);

  const pilotoId = Number(values.id);
  if (!Number.isInteger(pilotoId) || pilotoId <= 0) {
    return {
      values,
      errors: { form: "Piloto inválido." },
    };
  }

  const currentPilot = await prisma.piloto.findUnique({
    where: { id: pilotoId },
    select: { foto: true },
  });

  if (!currentPilot) {
    return {
      values,
      errors: { form: "No se encontró el piloto." },
    };
  }

  const { filename, error } = await parsePhoto(formData);
  if (error) {
    errors.foto = error;
  }

  if (Object.keys(errors).length > 0) {
    if (filename) {
      await removePhotoIfExists(filename);
    }

    return { values, errors };
  }

  try {
    await prisma.piloto.update({
      where: { id: pilotoId },
      data: {
        nombre: values.nombre,
        apellidos: values.apellidos,
        edad: Number(values.edad),
        dni: values.dni,
        dorsal: values.dorsal ? Number(values.dorsal) : null,
        socio: values.socio === "on",
        entrenamiento: values.entrenamiento === "on",
        foto: filename ?? currentPilot.foto,
      },
    });

    if (filename && currentPilot.foto) {
      await removePhotoIfExists(currentPilot.foto);
    }
  } catch {
    if (filename) {
      await removePhotoIfExists(filename);
    }

    return {
      values,
      errors: { form: "No se pudo actualizar el piloto. Intenta nuevamente." },
    };
  }

  revalidatePath("/admin/pilotos");
  redirect("/admin/pilotos");
}

export async function deletePilotAction(formData: FormData) {
  const id = Number(formData.get("id")?.toString());

  if (!Number.isInteger(id) || id <= 0) {
    return;
  }

  const pilot = await prisma.piloto.findUnique({
    where: { id },
    select: { foto: true },
  });

  await prisma.piloto.deleteMany({
    where: { id },
  });

  if (pilot?.foto) {
    await removePhotoIfExists(pilot.foto);
  }

  revalidatePath("/admin/pilotos");
  redirect("/admin/pilotos");
}

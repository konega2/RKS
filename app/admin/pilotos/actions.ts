"use server";

import { del } from "@vercel/blob";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

async function removePhotoIfExists(photoUrl?: string | null) {
  if (!photoUrl) {
    return;
  }

  if (!photoUrl.startsWith("http://") && !photoUrl.startsWith("https://")) {
    return;
  }

  try {
    await del(photoUrl);
  } catch {
    return;
  }
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

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function logoutAction() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    await prisma.adminSession.deleteMany({
      where: { id: sessionId },
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}

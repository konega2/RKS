import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "admin_session";

export function validateAdminCredentials(username: string, password: string) {
  const adminUser = process.env.ADMIN_USER?.trim() || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD?.trim() || "admin123";

  return username.trim() === adminUser && password === adminPassword;
}

export async function createAdminSession() {
  try {
    return await prisma.adminSession.create({
      data: {},
      select: { id: true },
    });
  } catch (error) {
    console.error("createAdminSession failed", error);
    return null;
  }
}

export async function isAuthenticated() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return false;
  }

  try {
    const session = await prisma.adminSession.findUnique({
      where: { id: sessionId },
      select: { id: true },
    });

    return Boolean(session);
  } catch (error) {
    console.error("isAuthenticated failed", error);
    return false;
  }
}

export async function requireAdminSession() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/login");
  }
}

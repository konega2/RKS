import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "admin_session";

export function validateAdminCredentials(username: string, password: string) {
  const adminUser = process.env.ADMIN_USER;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUser || !adminPassword) {
    return false;
  }

  return username === adminUser && password === adminPassword;
}

export async function createAdminSession() {
  return prisma.adminSession.create({
    data: {},
    select: { id: true },
  });
}

export async function isAuthenticated() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return false;
  }

  const session = await prisma.adminSession.findUnique({
    where: { id: sessionId },
    select: { id: true },
  });

  return Boolean(session);
}

export async function requireAdminSession() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/login");
  }
}

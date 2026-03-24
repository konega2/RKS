"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  createAdminSession,
  SESSION_COOKIE_NAME,
  validateAdminCredentials,
} from "@/lib/auth";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = formData.get("username")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  if (!username || !password) {
    return { error: "Usuario y contraseña son obligatorios." };
  }

  const valid = validateAdminCredentials(username, password);

  if (!valid) {
    return { error: "Credenciales inválidas." };
  }

  const session = await createAdminSession();
  if (!session) {
    return { error: "No se pudo abrir sesión. Revisa conexión a base de datos en Vercel." };
  }

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/admin");
}

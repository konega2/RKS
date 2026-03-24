"use client";

import { useActionState } from "react";

import { loginAction, type LoginState } from "@/app/login/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium text-zinc-300">
          Usuario
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-base text-zinc-100 outline-none ring-blue-500 placeholder:text-zinc-500 focus:ring-2"
          placeholder="Ingresa tu usuario"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-zinc-300">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-base text-zinc-100 outline-none ring-blue-500 placeholder:text-zinc-500 focus:ring-2"
          placeholder="Ingresa tu contraseña"
        />
      </div>

      {state.error ? (
        <p className="rounded-lg border border-red-900 bg-red-950/60 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-blue-600 text-base font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Ingresando..." : "Iniciar sesión"}
      </button>
    </form>
  );
}

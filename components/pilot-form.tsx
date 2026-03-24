"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import {
  buildPilotInitialState,
  type PilotFormState,
} from "@/lib/pilot-form";

type PilotFormProps = {
  formTitle: string;
  submitLabel: string;
  action: (
    prevState: PilotFormState,
    formData: FormData,
  ) => Promise<PilotFormState>;
  defaultValues?: Partial<PilotFormState["values"]>;
  currentPhoto?: string | null;
};

export function PilotForm({
  formTitle,
  submitLabel,
  action,
  defaultValues,
  currentPhoto,
}: PilotFormProps) {
  const initialState = useMemo(
    () => buildPilotInitialState(defaultValues),
    [defaultValues],
  );
  const [state, formAction, pending] = useActionState(action, initialState);
  const [preview, setPreview] = useState<string | null>(
    currentPhoto ? `/uploads/${currentPhoto}` : null,
  );
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  return (
    <form action={formAction} className="space-y-5">
      <h2 className="text-lg font-bold uppercase tracking-[0.08em] text-white">{formTitle}</h2>

      {state.values.id ? <input type="hidden" name="id" value={state.values.id} /> : null}

      {state.errors.form ? (
        <p className="rounded-xl border border-red-900/70 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {state.errors.form}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Nombre"
          name="nombre"
          required
          defaultValue={state.values.nombre}
          error={state.errors.nombre}
        />

        <InputField
          label="Apellidos"
          name="apellidos"
          required
          defaultValue={state.values.apellidos}
          error={state.errors.apellidos}
        />

        <InputField
          label="Edad"
          name="edad"
          type="number"
          required
          min={1}
          defaultValue={state.values.edad}
          error={state.errors.edad}
        />

        <InputField
          label="DNI"
          name="dni"
          required
          defaultValue={state.values.dni}
          error={state.errors.dni}
        />

        <InputField
          label="Dorsal (opcional)"
          name="dorsal"
          type="number"
          min={1}
          defaultValue={state.values.dorsal}
          error={state.errors.dorsal}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center justify-between rounded-xl border border-rks-line bg-rks-surface/80 px-4 py-3">
          <span className="text-sm font-medium text-zinc-100">Socio</span>
          <input
            type="checkbox"
            name="socio"
            defaultChecked={state.values.socio === "on"}
            className="h-5 w-5 accent-rks-blue"
          />
        </label>

        <label className="flex items-center justify-between rounded-xl border border-rks-line bg-rks-surface/80 px-4 py-3">
          <span className="text-sm font-medium text-zinc-100">Entrenamiento</span>
          <input
            type="checkbox"
            name="entrenamiento"
            defaultChecked={state.values.entrenamiento === "on"}
            className="h-5 w-5 accent-rks-blue"
          />
        </label>
      </div>

      <div className="space-y-2 rounded-2xl border border-rks-line/70 bg-rks-surface/40 p-4">
        <label htmlFor="foto" className="text-sm font-medium text-zinc-200">
          Foto
        </label>
        <input
          id="foto"
          name="foto"
          type="file"
          accept="image/*"
          className="block w-full rounded-xl border border-rks-line bg-rks-surface px-3 py-2 text-sm text-zinc-200 file:mr-3 file:rounded-lg file:border-0 file:bg-rks-blue/20 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-rks-blue"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (!file) {
              if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
              }
              setPreview(currentPhoto ? `/uploads/${currentPhoto}` : null);
              return;
            }

            if (objectUrlRef.current) {
              URL.revokeObjectURL(objectUrlRef.current);
            }

            const objectUrl = URL.createObjectURL(file);
            objectUrlRef.current = objectUrl;
            setPreview(objectUrl);
          }}
        />
        {state.errors.foto ? (
          <p className="text-sm text-red-400">{state.errors.foto}</p>
        ) : null}

        {preview ? (
          <div className="overflow-hidden rounded-xl border border-rks-line">
            <Image
              src={preview}
              alt="Preview de foto"
              width={512}
              height={256}
              unoptimized
              className="h-40 w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-rks-line bg-rks-surface/60 text-sm text-zinc-500">
            Sin foto
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-rks-blue text-base font-semibold text-white shadow-lg shadow-rks-blue/25 transition hover:brightness-110 disabled:opacity-70"
      >
        {pending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}

type InputFieldProps = {
  label: string;
  name: string;
  type?: string;
  min?: number;
  required?: boolean;
  defaultValue?: string;
  error?: string;
};

function InputField({
  label,
  name,
  type = "text",
  min,
  required,
  defaultValue,
  error,
}: InputFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-zinc-200">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        min={min}
        required={required}
        defaultValue={defaultValue}
        className="h-12 w-full rounded-xl border border-rks-line bg-rks-surface px-4 text-base text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-rks-blue focus:ring-2 focus:ring-rks-blue/35"
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}

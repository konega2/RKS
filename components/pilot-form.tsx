"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  buildPilotInitialState,
  type PilotFormErrors,
  type PilotFormState,
} from "@/lib/pilot-form";

type PilotFormProps = {
  formTitle: string;
  submitLabel: string;
  defaultValues?: Partial<PilotFormState["values"]>;
  currentPhoto?: string | null;
};

export function PilotForm({
  formTitle,
  submitLabel,
  defaultValues,
  currentPhoto,
}: PilotFormProps) {
  const router = useRouter();
  const initialState = useMemo(
    () => buildPilotInitialState(defaultValues),
    [defaultValues],
  );
  const [values, setValues] = useState(initialState.values);
  const [errors, setErrors] = useState<PilotFormErrors>({});
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentPhoto ?? null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setValues(initialState.values);
  }, [initialState]);

  useEffect(() => {
    setPreview(currentPhoto ?? null);
  }, [currentPhoto]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const validate = (nextValues: PilotFormState["values"]) => {
    const nextErrors: PilotFormErrors = {};

    if (!nextValues.nombre.trim()) {
      nextErrors.nombre = "El nombre es obligatorio.";
    }

    if (!nextValues.apellidos.trim()) {
      nextErrors.apellidos = "Los apellidos son obligatorios.";
    }

    const edad = Number(nextValues.edad);
    if (!nextValues.edad.trim()) {
      nextErrors.edad = "La edad es obligatoria.";
    } else if (!Number.isInteger(edad) || edad <= 0) {
      nextErrors.edad = "La edad debe ser un número entero mayor que 0.";
    }

    if (!nextValues.dni.trim()) {
      nextErrors.dni = "El DNI es obligatorio.";
    }

    if (nextValues.dorsal.trim()) {
      const dorsal = Number(nextValues.dorsal);
      if (!Number.isInteger(dorsal) || dorsal <= 0) {
        nextErrors.dorsal = "El dorsal debe ser un número entero mayor que 0.";
      }
    }

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setPending(true);

    try {
      let fotoUrl: string | null = currentPhoto ?? null;
      const fileInput = event.currentTarget.elements.namedItem("foto") as HTMLInputElement | null;
      const file = fileInput?.files?.[0] ?? null;

      if (file) {
        if (!file.type.startsWith("image/")) {
          setErrors({ foto: "La foto debe ser un archivo de imagen válido." });
          setPending(false);
          return;
        }

        if (file.size > 4 * 1024 * 1024) {
          setErrors({ foto: "La foto supera el máximo permitido (4MB)." });
          setPending(false);
          return;
        }

        const fileFormData = new FormData();
        fileFormData.append("file", file);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: fileFormData,
        });

        if (!uploadResponse.ok) {
          setErrors({ form: "No se pudo subir la foto. Intenta nuevamente." });
          setPending(false);
          return;
        }

        const uploadData = (await uploadResponse.json()) as { url?: string };
        fotoUrl = uploadData.url ?? null;
      }

      const payload = {
        nombre: values.nombre.trim(),
        apellidos: values.apellidos.trim(),
        edad: Number(values.edad),
        dni: values.dni.trim(),
        dorsal: values.dorsal.trim() ? Number(values.dorsal) : null,
        socio: values.socio === "on",
        entrenamiento: values.entrenamiento === "on",
        foto: fotoUrl,
      };

      const isEditing = Boolean(values.id);
      const response = await fetch(
        isEditing ? `/api/pilotos/${values.id}` : "/api/pilotos",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setErrors({ form: data.error ?? "No se pudo guardar el piloto. Intenta nuevamente." });
        setPending(false);
        return;
      }

      router.push("/admin/pilotos");
      router.refresh();
    } catch {
      setErrors({ form: "No se pudo guardar el piloto. Intenta nuevamente." });
      setPending(false);
      return;
    }

    setPending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-lg font-bold uppercase tracking-[0.08em] text-white">{formTitle}</h2>

      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      {errors.form ? (
        <p className="rounded-xl border border-red-900/70 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {errors.form}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Nombre"
          name="nombre"
          required
          value={values.nombre}
          onChange={(value) => setValues((prev) => ({ ...prev, nombre: value }))}
          error={errors.nombre}
        />

        <InputField
          label="Apellidos"
          name="apellidos"
          required
          value={values.apellidos}
          onChange={(value) => setValues((prev) => ({ ...prev, apellidos: value }))}
          error={errors.apellidos}
        />

        <InputField
          label="Edad"
          name="edad"
          type="number"
          required
          min={1}
          value={values.edad}
          onChange={(value) => setValues((prev) => ({ ...prev, edad: value }))}
          error={errors.edad}
        />

        <InputField
          label="DNI"
          name="dni"
          required
          value={values.dni}
          onChange={(value) => setValues((prev) => ({ ...prev, dni: value }))}
          error={errors.dni}
        />

        <InputField
          label="Dorsal (opcional)"
          name="dorsal"
          type="number"
          min={1}
          value={values.dorsal}
          onChange={(value) => setValues((prev) => ({ ...prev, dorsal: value }))}
          error={errors.dorsal}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center justify-between rounded-xl border border-rks-line bg-rks-surface/80 px-4 py-3">
          <span className="text-sm font-medium text-zinc-100">Socio</span>
          <input
            type="checkbox"
            name="socio"
            checked={values.socio === "on"}
            onChange={(event) =>
              setValues((prev) => ({
                ...prev,
                socio: event.target.checked ? "on" : "off",
              }))
            }
            className="h-5 w-5 accent-rks-blue"
          />
        </label>

        <label className="flex items-center justify-between rounded-xl border border-rks-line bg-rks-surface/80 px-4 py-3">
          <span className="text-sm font-medium text-zinc-100">Entrenamiento</span>
          <input
            type="checkbox"
            name="entrenamiento"
            checked={values.entrenamiento === "on"}
            onChange={(event) =>
              setValues((prev) => ({
                ...prev,
                entrenamiento: event.target.checked ? "on" : "off",
              }))
            }
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
              setPreview(currentPhoto ?? null);
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
        {errors.foto ? (
          <p className="text-sm text-red-400">{errors.foto}</p>
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
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

function InputField({
  label,
  name,
  type = "text",
  min,
  required,
  value,
  onChange,
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
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-rks-line bg-rks-surface px-4 text-base text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-rks-blue focus:ring-2 focus:ring-rks-blue/35"
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}

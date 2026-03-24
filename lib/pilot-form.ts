export type PilotBoolean = "on" | "off";

export type PilotFormValues = {
  id?: string;
  nombre: string;
  apellidos: string;
  edad: string;
  dni: string;
  dorsal: string;
  socio: PilotBoolean;
  entrenamiento: PilotBoolean;
};

export type PilotFormErrors = Partial<
  Record<"form" | "nombre" | "apellidos" | "edad" | "dni" | "dorsal" | "foto", string>
>;

export type PilotFormState = {
  values: PilotFormValues;
  errors: PilotFormErrors;
};

export function buildPilotInitialState(
  values?: Partial<PilotFormValues>,
): PilotFormState {
  return {
    values: {
      id: values?.id,
      nombre: values?.nombre ?? "",
      apellidos: values?.apellidos ?? "",
      edad: values?.edad ?? "",
      dni: values?.dni ?? "",
      dorsal: values?.dorsal ?? "",
      socio: values?.socio ?? "off",
      entrenamiento: values?.entrenamiento ?? "off",
    },
    errors: {},
  };
}

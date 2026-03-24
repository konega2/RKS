"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import {
  type PreCarreraSaveState,
  savePreCarreraAction,
} from "@/app/admin/precarrera/actions";
import {
  buildAvailableKarts,
  calculateBallastKg,
  finalWeightKg,
  formatBallastBreakdown,
  parseKartList,
  parsePeso,
  TARGET_WEIGHT_KG,
} from "@/lib/precarrera";

type PreCarreraPilot = {
  id: number;
  nombre: string;
  apellidos: string;
  peso: number | null;
  kart: number | null;
  verificado: boolean;
};

type PreCarreraBoardProps = {
  pilots: PreCarreraPilot[];
};

type PilotRow = {
  pilotoId: number;
  nombre: string;
  pesoInput: string;
  kart: number | null;
  verificado: boolean;
};

type WeightFilter = "all" | "with-weight" | "without-weight";
type SortOption =
  | "name-asc"
  | "name-desc"
  | "weight-asc"
  | "weight-desc"
  | "ballast-desc"
  | "kart-asc";

const initialSaveState: PreCarreraSaveState = {
  status: "idle",
};

function shuffle<T>(list: T[]) {
  const clone = [...list];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const current = clone[index];
    clone[index] = clone[randomIndex];
    clone[randomIndex] = current;
  }

  return clone;
}

export function PreCarreraBoard({ pilots }: PreCarreraBoardProps) {
  const didRefreshAfterSaveRef = useRef(false);

  const [rows, setRows] = useState<PilotRow[]>(
    pilots.map((pilot) => ({
      pilotoId: pilot.id,
      nombre: `${pilot.nombre} ${pilot.apellidos}`,
      pesoInput: pilot.peso == null ? "" : String(pilot.peso),
      kart: pilot.kart,
      verificado: pilot.verificado,
    })),
  );

  const [rangeFromInput, setRangeFromInput] = useState("1");
  const [rangeToInput, setRangeToInput] = useState("27");
  const [removeInput, setRemoveInput] = useState("");
  const [addInput, setAddInput] = useState("");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [weightFilter, setWeightFilter] = useState<WeightFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");

  const [saveState, formAction, pending] = useActionState(
    savePreCarreraAction,
    initialSaveState,
  );

  const removedKarts = useMemo(() => parseKartList(removeInput), [removeInput]);
  const addedKarts = useMemo(() => parseKartList(addInput), [addInput]);

  const rangeFrom = useMemo(() => {
    const parsed = Number(rangeFromInput.trim());
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [rangeFromInput]);

  const rangeTo = useMemo(() => {
    const parsed = Number(rangeToInput.trim());
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [rangeToInput]);

  const availableKarts = useMemo(
    () =>
      rangeFrom != null && rangeTo != null
        ? buildAvailableKarts(rangeFrom, rangeTo, removedKarts, addedKarts)
        : [],
    [rangeFrom, rangeTo, removedKarts, addedKarts],
  );

  const effectiveRows = useMemo(() => rows, [rows]);

  const assignedKarts = useMemo(
    () =>
      new Set(
        effectiveRows
          .map((row) => row.kart)
          .filter((kart): kart is number => kart != null),
      ),
    [effectiveRows],
  );

  const serializedRows = useMemo(
    () =>
      JSON.stringify(
        effectiveRows.map((row) => ({
          pilotoId: row.pilotoId,
          peso: parsePeso(row.pesoInput),
          kart: row.kart,
          verificado: row.verificado,
        })),
      ),
    [effectiveRows],
  );

  const serializedKarts = useMemo(
    () =>
      JSON.stringify(
        Array.from(
          new Set([
            ...availableKarts,
            ...effectiveRows
              .map((row) => row.kart)
              .filter((kart): kart is number => kart != null),
          ]),
        ).sort((a, b) => a - b),
      ),
    [availableKarts, effectiveRows],
  );

  const pilotsWithoutWeight = useMemo(
    () => effectiveRows.filter((row) => parsePeso(row.pesoInput) == null).length,
    [effectiveRows],
  );

  const visibleRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = effectiveRows.filter((row) => {
      if (
        normalizedSearch.length > 0 &&
        !row.nombre.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }

      const parsedPeso = parsePeso(row.pesoInput);

      if (weightFilter === "with-weight" && parsedPeso == null) {
        return false;
      }

      if (weightFilter === "without-weight" && parsedPeso != null) {
        return false;
      }

      return true;
    });

    return filtered.sort((left, right) => {
      if (sortOption === "name-asc") {
        return left.nombre.localeCompare(right.nombre);
      }

      if (sortOption === "name-desc") {
        return right.nombre.localeCompare(left.nombre);
      }

      if (sortOption === "weight-asc") {
        const leftWeight = parsePeso(left.pesoInput) ?? Number.POSITIVE_INFINITY;
        const rightWeight = parsePeso(right.pesoInput) ?? Number.POSITIVE_INFINITY;
        return leftWeight - rightWeight;
      }

      if (sortOption === "weight-desc") {
        const leftWeight = parsePeso(left.pesoInput) ?? Number.NEGATIVE_INFINITY;
        const rightWeight = parsePeso(right.pesoInput) ?? Number.NEGATIVE_INFINITY;
        return rightWeight - leftWeight;
      }

      if (sortOption === "ballast-desc") {
        const leftBallast = calculateBallastKg(parsePeso(left.pesoInput));
        const rightBallast = calculateBallastKg(parsePeso(right.pesoInput));
        return rightBallast - leftBallast;
      }

      const leftKart = left.kart ?? Number.POSITIVE_INFINITY;
      const rightKart = right.kart ?? Number.POSITIVE_INFINITY;
      return leftKart - rightKart;
    });
  }, [effectiveRows, search, sortOption, weightFilter]);

  useEffect(() => {
    if (!isAssignModalOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAssignModalOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isAssignModalOpen]);

  useEffect(() => {
    if (saveState.status !== "success") {
      didRefreshAfterSaveRef.current = false;
      return;
    }

    if (didRefreshAfterSaveRef.current) {
      return;
    }

    didRefreshAfterSaveRef.current = true;
    window.location.reload();
  }, [saveState.status]);

  function updateWeight(pilotoId: number, value: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.pilotoId === pilotoId
          ? {
              ...row,
              pesoInput: value,
            }
          : row,
      ),
    );
  }

  function updateKart(pilotoId: number, value: string) {
    const nextKart = value ? Number(value) : null;

    setRows((prev) =>
      prev.map((row) =>
        row.pilotoId === pilotoId
          ? {
              ...row,
              kart: nextKart,
            }
          : row,
      ),
    );
  }

  function assignRandomKarts() {
    if (availableKarts.length === 0) {
      return;
    }

    const shuffledPilots = shuffle(rows.map((row) => row.pilotoId));
    const shuffledKarts = shuffle(availableKarts);

    const kartByPilot = new Map<number, number | null>();
    shuffledPilots.forEach((pilotId, index) => {
      kartByPilot.set(pilotId, shuffledKarts[index] ?? null);
    });

    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        kart: kartByPilot.get(row.pilotoId) ?? null,
      })),
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="rounded-2xl border border-rks-line/80 bg-gradient-to-r from-rks-surface/95 via-zinc-950 to-zinc-950 p-3 shadow-lg shadow-black/20 md:p-5">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rks-amber/85">
              Gestión pre-carrera
            </p>
            <h2 className="mt-1 text-2xl font-bold uppercase tracking-[0.08em] text-zinc-100 md:text-3xl">
              Peso, Lastre y Karts
            </h2>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-rks-line bg-black/25 px-3 py-1 text-xs font-semibold text-zinc-300">
              Meta: {TARGET_WEIGHT_KG} kg
            </span>
            <span className="rounded-full border border-rks-line bg-black/25 px-3 py-1 text-xs font-semibold text-zinc-300">
              Karts disponibles: {availableKarts.length}
            </span>
            <span className="rounded-full border border-rks-line bg-black/25 px-3 py-1 text-xs font-semibold text-zinc-300">
              Pilotos sin peso: {pilotsWithoutWeight}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsAssignModalOpen(true)}
            className="flex h-12 items-center justify-center rounded-xl bg-rks-amber px-5 text-base font-bold text-zinc-950 transition hover:brightness-110"
          >
            Asignar karts
          </button>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px] md:items-center">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre"
            className="h-11 w-full rounded-xl border border-rks-line bg-zinc-950/90 px-4 text-sm text-zinc-100 outline-none ring-rks-blue placeholder:text-zinc-500 focus:ring-2"
          />

          <select
            value={weightFilter}
            onChange={(event) => setWeightFilter(event.target.value as WeightFilter)}
            className="h-11 rounded-xl border border-rks-line bg-zinc-950/90 px-3 text-sm text-zinc-200"
          >
            <option value="all">Filtro: Todos</option>
            <option value="with-weight">Con peso</option>
            <option value="without-weight">Sin peso</option>
          </select>

          <select
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value as SortOption)}
            className="h-11 rounded-xl border border-rks-line bg-zinc-950/90 px-3 text-sm text-zinc-200"
          >
            <option value="name-asc">Orden: Nombre A-Z</option>
            <option value="name-desc">Nombre Z-A</option>
            <option value="weight-asc">Peso menor a mayor</option>
            <option value="weight-desc">Peso mayor a menor</option>
            <option value="ballast-desc">Más lastre primero</option>
            <option value="kart-asc">Kart menor a mayor</option>
          </select>
        </div>

        <p className="mt-2 text-sm text-zinc-400/90">
          {visibleRows.length} piloto{visibleRows.length === 1 ? "" : "s"} visible
          {visibleRows.length !== effectiveRows.length
            ? `s de ${effectiveRows.length}`
            : ""}
        </p>
      </section>

      {isAssignModalOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          onClick={() => setIsAssignModalOpen(false)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl border border-rks-line/70 bg-gradient-to-r from-rks-surface/95 via-zinc-950 to-zinc-950 p-4 shadow-2xl shadow-black/40 md:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rks-blue/90">
                  Asignación de karts
                </p>
                <h3 className="mt-1 text-lg font-black uppercase tracking-[0.05em] text-white md:text-xl">
                  Configurar y asignar aleatoriamente
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="h-10 rounded-xl border border-rks-line bg-black/25 px-3 text-sm font-semibold text-zinc-300 transition hover:bg-black/40"
              >
                Cerrar
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1">
                <span className="inline-flex h-5 items-center whitespace-nowrap text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  Desde kart
                </span>
                <input
                  type="number"
                  min={1}
                  value={rangeFromInput}
                  onChange={(event) => setRangeFromInput(event.target.value)}
                  className="h-11 w-full rounded-xl border border-rks-line bg-rks-surface px-3 text-sm text-zinc-100 outline-none focus:border-rks-blue focus:ring-2 focus:ring-rks-blue/35"
                />
              </label>

              <label className="space-y-1">
                <span className="inline-flex h-5 items-center whitespace-nowrap text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  Hasta kart
                </span>
                <input
                  type="number"
                  min={1}
                  value={rangeToInput}
                  onChange={(event) => setRangeToInput(event.target.value)}
                  className="h-11 w-full rounded-xl border border-rks-line bg-rks-surface px-3 text-sm text-zinc-100 outline-none focus:border-rks-blue focus:ring-2 focus:ring-rks-blue/35"
                />
              </label>

              <label className="space-y-1 sm:col-span-2 lg:col-span-1">
                <span className="inline-flex h-5 items-center whitespace-nowrap text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  Quitar karts (coma)
                </span>
                <input
                  type="text"
                  value={removeInput}
                  onChange={(event) => setRemoveInput(event.target.value)}
                  placeholder="22, 24"
                  className="h-11 w-full rounded-xl border border-rks-line bg-rks-surface px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-rks-blue focus:ring-2 focus:ring-rks-blue/35"
                />
              </label>

              <label className="space-y-1 sm:col-span-2 lg:col-span-1">
                <span className="inline-flex h-5 items-center whitespace-nowrap text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  Agregar karts (coma)
                </span>
                <input
                  type="text"
                  value={addInput}
                  onChange={(event) => setAddInput(event.target.value)}
                  placeholder="30, 31"
                  className="h-11 w-full rounded-xl border border-rks-line bg-rks-surface px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-rks-blue focus:ring-2 focus:ring-rks-blue/35"
                />
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full border border-rks-line bg-black/25 px-3 py-1 text-xs font-semibold text-zinc-300">
                Lista resultante: {availableKarts.join(", ") || "Sin karts"}
              </span>

              <button
                type="button"
                onClick={() => {
                  assignRandomKarts();
                  setIsAssignModalOpen(false);
                }}
                className="h-10 rounded-xl border border-rks-blue/50 bg-rks-blue/15 px-4 text-sm font-semibold text-rks-blue transition hover:bg-rks-blue/25"
              >
                Asignar karts aleatoriamente
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="rows" value={serializedRows} readOnly />
        <input type="hidden" name="availableKarts" value={serializedKarts} readOnly />

        <div className="hidden overflow-hidden rounded-2xl border border-rks-line/70 bg-rks-surface/80 shadow-xl shadow-black/20 md:block">
          <div className="grid grid-cols-[2fr_0.8fr_1fr_1.1fr_0.8fr_1fr] gap-3 border-b border-rks-line/70 bg-black/25 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
            <p>Piloto</p>
            <p>Peso</p>
            <p>Lastre</p>
            <p>Desglose</p>
            <p>Peso final</p>
            <p>Kart</p>
          </div>
          <div className="divide-y divide-rks-line/60">
            {visibleRows.map((row) => {
              const parsedPeso = parsePeso(row.pesoInput);
              const lastre = calculateBallastKg(parsedPeso);
              const finalWeight = finalWeightKg(parsedPeso, lastre);
              const rowClass = parsedPeso == null ? "bg-rks-amber/10" : "";
              const selectableKarts = Array.from(
                new Set([
                  ...availableKarts.filter(
                    (kart) => !assignedKarts.has(kart) || kart === row.kart,
                  ),
                  ...(row.kart != null ? [row.kart] : []),
                ]),
              ).sort((a, b) => a - b);

              return (
                <div
                  key={row.pilotoId}
                  className={`grid grid-cols-[2fr_0.8fr_1fr_1.1fr_0.8fr_1fr] items-center gap-3 px-4 py-3 ${rowClass}`}
                >
                  <p className="font-semibold text-zinc-100">{row.nombre}</p>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={row.pesoInput}
                    onChange={(event) => updateWeight(row.pilotoId, event.target.value)}
                    placeholder="85"
                    className="h-10 rounded-lg border border-rks-line bg-black/25 px-3 text-sm text-zinc-100 outline-none focus:border-rks-blue focus:ring-2 focus:ring-rks-blue/35"
                  />

                  <p className="text-sm font-semibold text-rks-blue">{lastre} kg</p>
                  <p className="text-sm text-zinc-300">{formatBallastBreakdown(lastre)}</p>
                  <p className="text-sm font-semibold text-zinc-100">{finalWeight != null ? `${finalWeight} kg` : "—"}</p>

                  <select
                    value={row.kart ?? ""}
                    onChange={(event) => updateKart(row.pilotoId, event.target.value)}
                    className="h-10 rounded-lg border border-rks-line bg-black/25 px-2 text-sm text-zinc-100 outline-none focus:border-rks-blue focus:ring-2 focus:ring-rks-blue/35"
                  >
                    <option value="">Sin kart</option>
                    {selectableKarts.map((kart) => (
                      <option key={kart} value={kart}>
                        Kart {kart}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 md:hidden">
          {visibleRows.map((row) => {
            const parsedPeso = parsePeso(row.pesoInput);
            const lastre = calculateBallastKg(parsedPeso);
            const finalWeight = finalWeightKg(parsedPeso, lastre);
            const selectableKarts = Array.from(
              new Set([
                ...availableKarts.filter(
                  (kart) => !assignedKarts.has(kart) || kart === row.kart,
                ),
                ...(row.kart != null ? [row.kart] : []),
              ]),
            ).sort((a, b) => a - b);

            return (
              <article
                key={row.pilotoId}
                className={`rounded-2xl border p-4 shadow-lg shadow-black/20 ${
                  parsedPeso == null
                    ? "border-rks-amber/40 bg-rks-amber/10"
                    : "border-rks-line/70 bg-rks-surface/85"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-bold text-zinc-100">{row.nombre}</h3>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Peso</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.pesoInput}
                      onChange={(event) => updateWeight(row.pilotoId, event.target.value)}
                      placeholder="85"
                      className="h-10 w-full rounded-lg border border-rks-line bg-black/25 px-3 text-sm text-zinc-100 outline-none focus:border-rks-blue focus:ring-2 focus:ring-rks-blue/35"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Kart</span>
                    <select
                      value={row.kart ?? ""}
                      onChange={(event) => updateKart(row.pilotoId, event.target.value)}
                      className="h-10 w-full rounded-lg border border-rks-line bg-black/25 px-2 text-sm text-zinc-100 outline-none focus:border-rks-blue focus:ring-2 focus:ring-rks-blue/35"
                    >
                      <option value="">Sin kart</option>
                      {selectableKarts.map((kart) => (
                        <option key={kart} value={kart}>
                          Kart {kart}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-3 rounded-xl border border-rks-line/70 bg-black/25 px-3 py-2 text-sm text-zinc-200">
                  <p>
                    Lastre recomendado: <span className="font-semibold text-rks-blue">{lastre} kg</span>
                  </p>
                  <p className="text-zinc-400">{formatBallastBreakdown(lastre)}</p>
                  <p className="mt-1 font-semibold text-zinc-100">
                    Peso final: {finalWeight != null ? `${finalWeight} kg` : "—"}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rks-line/70 bg-rks-surface/75 p-4">
          <p
            className={`text-sm font-medium ${
              saveState.status === "error"
                ? "text-red-300"
                : saveState.status === "success"
                  ? "text-emerald-300"
                  : "text-zinc-400"
            }`}
          >
            {saveState.message ?? "Guarda para persistir pesos, lastres y karts."}
          </p>

          <button
            type="submit"
            disabled={pending}
            className="h-11 rounded-xl bg-rks-blue px-5 text-sm font-semibold text-white shadow-lg shadow-rks-blue/25 transition hover:brightness-110 disabled:opacity-70"
          >
            {pending ? "Guardando..." : "Guardar pre-carrera"}
          </button>
        </div>
      </form>
    </div>
  );
}

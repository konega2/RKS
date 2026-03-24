export const TARGET_WEIGHT_KG = 85;
export const BALLAST_STEP_KG = 2.5;

export function normalizeKg(value: number) {
  return Math.round(value * 10) / 10;
}

export function parsePeso(raw: string) {
  const normalized = raw.replace(",", ".").trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return normalizeKg(parsed);
}

export function calculateBallastKg(peso: number | null | undefined) {
  if (peso == null || !Number.isFinite(peso) || peso >= TARGET_WEIGHT_KG) {
    return 0;
  }

  const missing = TARGET_WEIGHT_KG - peso;
  const steps = Math.ceil((missing * 10) / (BALLAST_STEP_KG * 10));
  return normalizeKg(steps * BALLAST_STEP_KG);
}

export function breakdownBallast(ballastKg: number) {
  if (!Number.isFinite(ballastKg) || ballastKg <= 0) {
    return [] as number[];
  }

  const pieces = [10, 5, 2.5];
  let remaining = ballastKg;
  const result: number[] = [];

  for (const piece of pieces) {
    while (remaining + 1e-9 >= piece) {
      result.push(piece);
      remaining = normalizeKg(remaining - piece);
    }
  }

  return result;
}

export function formatBallastBreakdown(ballastKg: number) {
  const pieces = breakdownBallast(ballastKg);
  if (pieces.length === 0) {
    return "Sin lastre";
  }

  return pieces.map((piece) => `${piece}kg`).join(" + ");
}

export function finalWeightKg(peso: number | null | undefined, ballastKg: number) {
  if (peso == null || !Number.isFinite(peso)) {
    return null;
  }

  return normalizeKg(peso + ballastKg);
}

export function parseKartList(raw: string) {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((chunk) => Number(chunk.trim()))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  ).sort((a, b) => a - b);
}

export function buildAvailableKarts(
  rangeFrom: number,
  rangeTo: number,
  removed: number[],
  added: number[],
) {
  if (!Number.isInteger(rangeFrom) || !Number.isInteger(rangeTo) || rangeFrom <= 0 || rangeTo <= 0) {
    return [] as number[];
  }

  const start = Math.min(rangeFrom, rangeTo);
  const end = Math.max(rangeFrom, rangeTo);
  const range = Array.from({ length: end - start + 1 }, (_, index) => start + index);
  const removedSet = new Set(removed);
  const result = range.filter((kart) => !removedSet.has(kart));

  for (const kart of added) {
    if (!result.includes(kart)) {
      result.push(kart);
    }
  }

  return result.sort((a, b) => a - b);
}

export type Prices = {
  /** USD por millón de tokens de entrada. */
  inputPerMTok: number;
  /** USD por millón de tokens de salida. */
  outputPerMTok: number;
};

export function estimateCostUsd(
  tokens: { inputTokens: number; outputTokens: number },
  prices: Prices,
): number {
  const cost =
    (tokens.inputTokens * prices.inputPerMTok + tokens.outputTokens * prices.outputPerMTok) /
    1_000_000;
  // numeric(12,6) en la base de datos.
  return Math.round(cost * 1_000_000) / 1_000_000;
}

export function isOverBudget(spentUsd: number, budgetUsd: number): boolean {
  return spentUsd >= budgetUsd;
}

/** Primer instante (UTC) del mes de la fecha dada: inicio de la ventana del tope mensual. */
export function monthStartUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

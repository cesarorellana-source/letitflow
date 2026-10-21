import { describe, expect, it } from "vitest";
import { estimateCostUsd, isOverBudget, monthStartUtc } from "@/lib/ai/cost";

describe("estimateCostUsd", () => {
  it("calcula el costo por millón de tokens", () => {
    const prices = { inputPerMTok: 2, outputPerMTok: 10 };
    expect(estimateCostUsd({ inputTokens: 1_000_000, outputTokens: 0 }, prices)).toBe(2);
    expect(estimateCostUsd({ inputTokens: 500_000, outputTokens: 100_000 }, prices)).toBe(2);
    expect(estimateCostUsd({ inputTokens: 0, outputTokens: 0 }, prices)).toBe(0);
  });

  it("redondea a 6 decimales (numeric(12,6) en la base)", () => {
    expect(
      estimateCostUsd({ inputTokens: 1, outputTokens: 1 }, { inputPerMTok: 1, outputPerMTok: 1 }),
    ).toBe(0.000002);
    expect(
      estimateCostUsd(
        { inputTokens: 1, outputTokens: 0 },
        { inputPerMTok: 0.1234567, outputPerMTok: 0 },
      ),
    ).toBe(0);
  });
});

describe("isOverBudget", () => {
  it("bloquea al llegar al tope, no solo al pasarlo", () => {
    expect(isOverBudget(4.99, 5)).toBe(false);
    expect(isOverBudget(5, 5)).toBe(true);
    expect(isOverBudget(7, 5)).toBe(true);
  });
});

describe("monthStartUtc", () => {
  it("devuelve el primer instante del mes en UTC", () => {
    expect(monthStartUtc(new Date("2026-10-21T15:30:00Z")).toISOString()).toBe(
      "2026-10-01T00:00:00.000Z",
    );
    expect(monthStartUtc(new Date("2026-12-31T23:59:59Z")).toISOString()).toBe(
      "2026-12-01T00:00:00.000Z",
    );
  });

  it("usa UTC aunque la hora local sea del mes anterior", () => {
    // 2026-11-01 00:30 UTC sigue siendo noviembre.
    expect(monthStartUtc(new Date("2026-11-01T00:30:00Z")).toISOString()).toBe(
      "2026-11-01T00:00:00.000Z",
    );
  });
});

import { describe, expect, it } from "vitest";
import { z } from "zod";
import { FakeProvider } from "@/lib/ai/fake";
import { runAITask, type UsageRow, type UsageStore } from "@/lib/ai/run";
import { AIBudgetExceededError, AIOutputError } from "@/lib/ai/types";

const who = { workspaceId: "ws-1", userId: "user-1" };
const schema = z.object({ objetivo: z.string().min(1) });
const request = { task: "lesson.generate", system: "sistema", input: "entrada", schema };

function memoryStore(spent = 0) {
  const rows: UsageRow[] = [];
  const sinceArgs: Date[] = [];
  const store: UsageStore = {
    monthlySpendUsd: async (_ws, since) => {
      sinceArgs.push(since);
      return spent;
    },
    record: async (row) => {
      rows.push(row);
    },
  };
  return { store, rows, sinceArgs };
}

describe("runAITask", () => {
  it("devuelve los datos validados y registra el consumo como ok", async () => {
    const { store, rows } = memoryStore();
    const provider = new FakeProvider(() => ({ objetivo: "Contar hasta 20" }));

    const data = await runAITask({ provider, store, budgetUsd: 5 }, who, request);

    expect(data).toEqual({ objetivo: "Contar hasta 20" });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      ...who,
      task: "lesson.generate",
      provider: "fake",
      status: "ok",
    });
  });

  it("bloquea sin llamar al proveedor cuando se alcanzó el tope, y deja constancia", async () => {
    const { store, rows } = memoryStore(5);
    const provider = new FakeProvider(() => ({ objetivo: "x" }));

    await expect(runAITask({ provider, store, budgetUsd: 5 }, who, request)).rejects.toBeInstanceOf(
      AIBudgetExceededError,
    );
    expect(provider.calls).toHaveLength(0);
    expect(rows).toEqual([
      expect.objectContaining({ status: "blocked", costUsd: 0, inputTokens: 0 }),
    ]);
  });

  it("mide el gasto desde el inicio del mes en curso (UTC)", async () => {
    const { store, sinceArgs } = memoryStore();
    const provider = new FakeProvider(() => ({ objetivo: "x" }));

    await runAITask(
      { provider, store, budgetUsd: 5, now: () => new Date("2026-10-21T10:00:00Z") },
      who,
      request,
    );

    expect(sinceArgs[0].toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });

  it("rechaza una salida que no cumple el esquema y registra igual el consumo", async () => {
    const { store, rows } = memoryStore();
    const provider = new FakeProvider(() => ({ objetivo: 123 }));

    await expect(runAITask({ provider, store, budgetUsd: 5 }, who, request)).rejects.toBeInstanceOf(
      AIOutputError,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("error");
    expect(rows[0].inputTokens).toBeGreaterThan(0);
  });

  it("registra un error del proveedor con consumo cero y lo vuelve a lanzar", async () => {
    const { store, rows } = memoryStore();
    const provider = new FakeProvider(); // sin respuesta definida: lanza

    await expect(runAITask({ provider, store, budgetUsd: 5 }, who, request)).rejects.toThrow(
      /no tiene respuesta/,
    );
    expect(rows).toEqual([
      expect.objectContaining({ status: "error", costUsd: 0, outputTokens: 0 }),
    ]);
  });
});

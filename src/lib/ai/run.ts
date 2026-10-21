import { isOverBudget, monthStartUtc } from "./cost";
import {
  AIBudgetExceededError,
  AIOutputError,
  type AIProvider,
  type AIUsage,
  type GenerateRequest,
} from "./types";

export type UsageRow = {
  workspaceId: string;
  userId: string;
  task: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  status: "ok" | "error" | "blocked";
};

/** Almacenamiento del consumo. La implementación real usa el cliente de servicio. */
export interface UsageStore {
  monthlySpendUsd(workspaceId: string, since: Date): Promise<number>;
  record(row: UsageRow): Promise<void>;
}

export type RunContext = {
  provider: AIProvider;
  store: UsageStore;
  budgetUsd: number;
  now?: () => Date;
};

export type RunIdentity = { workspaceId: string; userId: string };

/**
 * Ejecuta una tarea de IA con las salvaguardas del producto:
 *   1. respeta el tope mensual del espacio de trabajo,
 *   2. valida la salida contra el esquema (lo hace el proveedor),
 *   3. registra siempre el consumo, también si hay error o bloqueo.
 *
 * Límite conocido: la comprobación del tope no es atómica; varias llamadas simultáneas
 * pueden excederlo levemente.
 */
export async function runAITask<T>(
  ctx: RunContext,
  who: RunIdentity,
  req: GenerateRequest<T>,
): Promise<T> {
  const now = ctx.now?.() ?? new Date();
  const base = { ...who, task: req.task, provider: ctx.provider.name, model: req.model ?? "" };

  const spent = await ctx.store.monthlySpendUsd(who.workspaceId, monthStartUtc(now));
  if (isOverBudget(spent, ctx.budgetUsd)) {
    await ctx.store.record({
      ...base,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      status: "blocked",
    });
    throw new AIBudgetExceededError(spent, ctx.budgetUsd);
  }

  const toRow = (usage: AIUsage, status: UsageRow["status"]): UsageRow => ({
    ...base,
    provider: usage.provider,
    model: usage.model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    costUsd: usage.costUsd,
    status,
  });

  try {
    const { data, usage } = await ctx.provider.generate(req);
    await ctx.store.record(toRow(usage, "ok"));
    return data;
  } catch (err) {
    if (err instanceof AIOutputError && err.usage) {
      // La llamada se cobró aunque la salida no sirviera.
      await ctx.store.record(toRow(err.usage, "error"));
    } else {
      await ctx.store.record({
        ...base,
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
        status: "error",
      });
    }
    throw err;
  }
}

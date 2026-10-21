import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UsageRow, UsageStore } from "./run";

/**
 * Registro de consumo en `ai_usage`. Requiere el cliente de servicio: la tabla no admite
 * inserciones de personas, para que nadie pueda falsear su consumo.
 */
export function createSupabaseUsageStore(service: SupabaseClient): UsageStore {
  return {
    async monthlySpendUsd(workspaceId, since) {
      const { data, error } = await service
        .from("ai_usage")
        .select("cost_usd")
        .eq("workspace_id", workspaceId)
        .gte("created_at", since.toISOString());
      if (error) throw new Error(`No se pudo leer el consumo de IA: ${error.message}`);
      return (data ?? []).reduce((sum, row) => sum + Number(row.cost_usd), 0);
    },

    async record(row: UsageRow) {
      const { error } = await service.from("ai_usage").insert({
        workspace_id: row.workspaceId,
        user_id: row.userId,
        task: row.task,
        provider: row.provider || "unknown",
        model: row.model || "unknown",
        input_tokens: row.inputTokens,
        output_tokens: row.outputTokens,
        cost_usd: row.costUsd,
        status: row.status,
      });
      if (error) throw new Error(`No se pudo registrar el consumo de IA: ${error.message}`);
    },
  };
}

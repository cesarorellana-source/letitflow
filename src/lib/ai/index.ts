import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { serverEnv } from "@/lib/env.server";
import { ClaudeProvider } from "./claude";
import { FakeProvider } from "./fake";
import { AIConfigError, type AIProvider } from "./types";

export * from "./types";
export { runAITask, type UsageStore } from "./run";
export { createPseudonymizer } from "./pseudonymize";

/** Proveedor de IA según la configuración. Cambiarlo no exige tocar los módulos. */
export function getAIProvider(): AIProvider {
  const env = serverEnv();

  if (env.AI_PROVIDER === "fake") {
    return new FakeProvider();
  }

  if (!env.ANTHROPIC_API_KEY) {
    throw new AIConfigError("Falta ANTHROPIC_API_KEY.");
  }
  const hasPrices =
    env.AI_PRICE_INPUT_PER_MTOK_USD !== undefined && env.AI_PRICE_OUTPUT_PER_MTOK_USD !== undefined;

  return new ClaudeProvider({
    client: new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }),
    defaultModel: env.AI_MODEL_DEFAULT,
    prices: hasPrices
      ? {
          inputPerMTok: env.AI_PRICE_INPUT_PER_MTOK_USD!,
          outputPerMTok: env.AI_PRICE_OUTPUT_PER_MTOK_USD!,
        }
      : undefined,
  });
}

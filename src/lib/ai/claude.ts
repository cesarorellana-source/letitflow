import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { estimateCostUsd, type Prices } from "./cost";
import {
  AIConfigError,
  AIOutputError,
  type AIProvider,
  type AIUsage,
  type GenerateRequest,
  type GenerateResult,
} from "./types";

/** Subconjunto del SDK que usamos; permite inyectar un cliente simulado en las pruebas. */
export type ClaudeClient = Pick<Anthropic, "messages">;

const TOOL_NAME = "emit_result";

/**
 * Adaptador de Claude. Pide la salida estructurada obligando al modelo a «llamar» a una
 * herramienta cuyo esquema es el de la tarea, y la valida de nuevo con zod.
 *
 * Estado: probado con un cliente simulado; NO se ha probado contra la API real porque aún
 * no hay clave. Antes de usarlo con datos reales, hacer una llamada de verificación.
 */
export class ClaudeProvider implements AIProvider {
  readonly name = "claude";

  constructor(
    private readonly opts: {
      client: ClaudeClient;
      defaultModel: string;
      prices: Prices | undefined;
    },
  ) {}

  async generate<T>(req: GenerateRequest<T>): Promise<GenerateResult<T>> {
    const { prices } = this.opts;
    if (!prices) {
      throw new AIConfigError(
        "Faltan AI_PRICE_INPUT_PER_MTOK_USD y AI_PRICE_OUTPUT_PER_MTOK_USD: sin precios no se puede estimar ni limitar el costo.",
      );
    }

    const jsonSchema = z.toJSONSchema(req.schema) as Record<string, unknown>;
    if (jsonSchema.type !== "object") {
      throw new AIConfigError("El esquema de salida de una tarea de IA debe ser un objeto.");
    }
    const { $schema: _ignored, ...inputSchema } = jsonSchema;
    void _ignored;

    const model = req.model ?? this.opts.defaultModel;
    const response = await this.opts.client.messages.create({
      model,
      max_tokens: req.maxOutputTokens ?? 4096,
      system: req.system,
      messages: [{ role: "user", content: req.input }],
      tools: [
        {
          name: TOOL_NAME,
          description:
            req.schemaDescription ?? "Devuelve el resultado de la tarea con el formato indicado.",
          input_schema: inputSchema as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: "tool", name: TOOL_NAME },
    });

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const usage: AIUsage = {
      provider: this.name,
      model,
      inputTokens,
      outputTokens,
      costUsd: estimateCostUsd({ inputTokens, outputTokens }, prices),
    };

    const block = response.content.find((b) => b.type === "tool_use" && b.name === TOOL_NAME);
    if (!block || block.type !== "tool_use") {
      throw new AIOutputError("El modelo no devolvió el resultado estructurado esperado.", usage);
    }

    const parsed = req.schema.safeParse(block.input);
    if (!parsed.success) {
      throw new AIOutputError(`La respuesta no cumple el esquema: ${parsed.error.message}`, usage);
    }
    return { data: parsed.data, usage };
  }
}

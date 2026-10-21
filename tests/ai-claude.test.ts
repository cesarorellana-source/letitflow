import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ClaudeProvider, type ClaudeClient } from "@/lib/ai/claude";
import { AIConfigError, AIOutputError } from "@/lib/ai/types";

// Estas pruebas usan un cliente simulado: verifican nuestra lógica (esquema, validación,
// costo), NO el comportamiento de la API real de Anthropic.

const schema = z.object({ titulo: z.string(), puntos: z.number().int() });
const prices = { inputPerMTok: 2, outputPerMTok: 10 };

function clientReturning(content: unknown[], usage = { input_tokens: 1000, output_tokens: 500 }) {
  const calls: Record<string, unknown>[] = [];
  const client = {
    messages: {
      create: async (params: Record<string, unknown>) => {
        calls.push(params);
        return { content, usage };
      },
    },
  } as unknown as ClaudeClient;
  return { client, calls };
}

const toolUse = (input: unknown) => ({ type: "tool_use", id: "t1", name: "emit_result", input });

describe("ClaudeProvider", () => {
  it("fuerza la herramienta de salida estructurada y devuelve datos validados con su costo", async () => {
    const { client, calls } = clientReturning([toolUse({ titulo: "Clase 1", puntos: 3 })]);
    const provider = new ClaudeProvider({ client, defaultModel: "modelo-x", prices });

    const result = await provider.generate({ task: "t", system: "s", input: "i", schema });

    expect(result.data).toEqual({ titulo: "Clase 1", puntos: 3 });
    expect(result.usage).toMatchObject({
      provider: "claude",
      model: "modelo-x",
      inputTokens: 1000,
      outputTokens: 500,
    });
    expect(result.usage.costUsd).toBeCloseTo((1000 * 2 + 500 * 10) / 1_000_000, 8);

    expect(calls[0]).toMatchObject({
      model: "modelo-x",
      system: "s",
      tool_choice: { type: "tool", name: "emit_result" },
    });
    const tool = (calls[0].tools as { input_schema: Record<string, unknown> }[])[0];
    expect(tool.input_schema.type).toBe("object");
    expect(tool.input_schema).not.toHaveProperty("$schema");
    expect(Object.keys(tool.input_schema.properties as object)).toEqual(["titulo", "puntos"]);
  });

  it("usa el modelo de la solicitud si se indica", async () => {
    const { client, calls } = clientReturning([toolUse({ titulo: "a", puntos: 1 })]);
    const provider = new ClaudeProvider({ client, defaultModel: "modelo-x", prices });
    await provider.generate({ task: "t", system: "s", input: "i", schema, model: "otro" });
    expect(calls[0].model).toBe("otro");
  });

  it("rechaza una salida que no cumple el esquema, conservando el consumo", async () => {
    const { client } = clientReturning([toolUse({ titulo: "a", puntos: "tres" })]);
    const provider = new ClaudeProvider({ client, defaultModel: "m", prices });

    const err = await provider
      .generate({ task: "t", system: "s", input: "i", schema })
      .catch((e) => e);

    expect(err).toBeInstanceOf(AIOutputError);
    expect((err as AIOutputError).usage?.inputTokens).toBe(1000);
  });

  it("falla si el modelo no usó la herramienta", async () => {
    const { client } = clientReturning([{ type: "text", text: "hola" }]);
    const provider = new ClaudeProvider({ client, defaultModel: "m", prices });
    await expect(
      provider.generate({ task: "t", system: "s", input: "i", schema }),
    ).rejects.toBeInstanceOf(AIOutputError);
  });

  it("se niega a funcionar sin precios, para no operar sin control de costo", async () => {
    const { client, calls } = clientReturning([toolUse({ titulo: "a", puntos: 1 })]);
    const provider = new ClaudeProvider({ client, defaultModel: "m", prices: undefined });
    await expect(
      provider.generate({ task: "t", system: "s", input: "i", schema }),
    ).rejects.toBeInstanceOf(AIConfigError);
    expect(calls).toHaveLength(0);
  });

  it("exige que el esquema de salida sea un objeto", async () => {
    const { client } = clientReturning([]);
    const provider = new ClaudeProvider({ client, defaultModel: "m", prices });
    await expect(
      provider.generate({ task: "t", system: "s", input: "i", schema: z.array(z.string()) }),
    ).rejects.toBeInstanceOf(AIConfigError);
  });
});

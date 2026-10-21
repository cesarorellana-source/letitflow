import { AIOutputError, type AIProvider, type GenerateRequest, type GenerateResult } from "./types";

type Responder = (req: GenerateRequest<unknown>) => unknown;

/**
 * Proveedor falso para pruebas y desarrollo sin red ni costo. Responde con lo que devuelva
 * `responder`, y valida contra el esquema igual que un proveedor real.
 */
export class FakeProvider implements AIProvider {
  readonly name = "fake";
  readonly calls: GenerateRequest<unknown>[] = [];

  constructor(
    private readonly responder: Responder = (req) => {
      throw new Error(`FakeProvider no tiene respuesta para la tarea «${req.task}».`);
    },
  ) {}

  async generate<T>(req: GenerateRequest<T>): Promise<GenerateResult<T>> {
    this.calls.push(req as GenerateRequest<unknown>);
    const raw = this.responder(req as GenerateRequest<unknown>);
    const usage = {
      provider: this.name,
      model: req.model ?? "fake",
      inputTokens: Math.ceil((req.system.length + req.input.length) / 4),
      outputTokens: Math.ceil(JSON.stringify(raw ?? null).length / 4),
      costUsd: 0,
    };

    const parsed = req.schema.safeParse(raw);
    if (!parsed.success) {
      throw new AIOutputError(`La respuesta no cumple el esquema: ${parsed.error.message}`, usage);
    }
    return { data: parsed.data, usage };
  }
}

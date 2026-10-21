import type { z } from "zod";

/** Consumo de una llamada a un modelo. */
export type AIUsage = {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  /** Costo estimado en USD. 0 para proveedores sin costo (p. ej. el falso). */
  costUsd: number;
};

export type GenerateRequest<T> = {
  /** Identificador de la tarea, p. ej. "lesson.generate". Se registra en ai_usage. */
  task: string;
  system: string;
  /**
   * Entrada del usuario. NO debe contener nombres ni datos identificables de estudiantes:
   * usa `pseudonymize` antes de armar este texto.
   */
  input: string;
  /** Esquema de la salida. Lo que no valide se rechaza. */
  schema: z.ZodType<T>;
  /** Descripción breve de la salida para el modelo. */
  schemaDescription?: string;
  model?: string;
  maxOutputTokens?: number;
};

export type GenerateResult<T> = { data: T; usage: AIUsage };

/** Contrato que cumple cada proveedor; los módulos del producto solo conocen esto. */
export interface AIProvider {
  readonly name: string;
  generate<T>(req: GenerateRequest<T>): Promise<GenerateResult<T>>;
}

/** Falta configuración (clave, precios...). Es un error de despliegue, no de la persona. */
export class AIConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIConfigError";
  }
}

/** El espacio alcanzó su tope mensual. */
export class AIBudgetExceededError extends Error {
  constructor(
    readonly spentUsd: number,
    readonly budgetUsd: number,
  ) {
    super(
      `Se alcanzó el tope mensual de IA (${spentUsd.toFixed(2)} de ${budgetUsd.toFixed(2)} USD).`,
    );
    this.name = "AIBudgetExceededError";
  }
}

/** La respuesta del modelo no cumple el esquema. Conserva el consumo, que igual se cobró. */
export class AIOutputError extends Error {
  constructor(
    message: string,
    readonly usage?: AIUsage,
  ) {
    super(message);
    this.name = "AIOutputError";
  }
}

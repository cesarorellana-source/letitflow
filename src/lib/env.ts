import { z } from "zod";

/**
 * Variables de entorno validadas.
 *
 * - Las `NEXT_PUBLIC_*` se pueden usar en el navegador.
 * - Las demás solo existen en el servidor: nunca se importan desde componentes cliente.
 * - Ninguna es obligatoria para arrancar: sin Supabase la app muestra un aviso de configuración
 *   en lugar de fallar (ver `isSupabaseConfigured`).
 */

const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

const publicSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.preprocess(emptyToUndefined, z.string().min(1).default("LetItFlow")),
  /** URL pública de la app (para enlaces de correo y OAuth). Si falta, se deduce de la solicitud. */
  NEXT_PUBLIC_SITE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(emptyToUndefined, z.string().min(20).optional()),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(emptyToUndefined, z.string().min(20).optional()),
  AI_PROVIDER: z.preprocess(emptyToUndefined, z.enum(["claude", "fake"]).default("claude")),
  ANTHROPIC_API_KEY: z.preprocess(emptyToUndefined, z.string().min(10).optional()),
  /** Modelo por defecto para tareas de IA; se puede sobrescribir por tarea. */
  AI_MODEL_DEFAULT: z.preprocess(emptyToUndefined, z.string().min(1).default("claude-sonnet-5-5")),
  /** Tope mensual de costo estimado por espacio de trabajo, en USD. */
  AI_MONTHLY_BUDGET_USD: z.preprocess(emptyToUndefined, z.coerce.number().positive().default(5)),
  /**
   * Precios del modelo, en USD por millón de tokens. No se asumen valores por defecto:
   * cópialos de la página de precios del proveedor. Sin ellos no se puede estimar el costo
   * ni aplicar el tope mensual, así que el adaptador de Claude se niega a funcionar.
   */
  AI_PRICE_INPUT_PER_MTOK_USD: z.preprocess(
    emptyToUndefined,
    z.coerce.number().nonnegative().optional(),
  ),
  AI_PRICE_OUTPUT_PER_MTOK_USD: z.preprocess(
    emptyToUndefined,
    z.coerce.number().nonnegative().optional(),
  ),
});

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

export function parsePublicEnv(source: Record<string, string | undefined>): PublicEnv {
  return publicSchema.parse(source);
}

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  return serverSchema.parse(source);
}

// Next.js solo sustituye `process.env.NEXT_PUBLIC_*` cuando se escriben de forma literal.
export const publicEnv: PublicEnv = parsePublicEnv({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export function isSupabaseConfigured(env: PublicEnv = publicEnv): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";

/**
 * Cliente con la clave de servicio: SALTA la RLS.
 *
 * Úsalo solo para tareas del servidor que lo exijan (p. ej. registrar uso de IA) y siempre
 * después de haber verificado quién es la persona y a qué espacio pertenece. Nunca lo
 * devuelvas ni lo pases a componentes cliente.
 */
export function createServiceClient() {
  const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  const key = serverEnv().SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

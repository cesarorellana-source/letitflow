import { z } from "zod";

/**
 * Registro de acciones importantes en `audit_log` (solo inserción).
 *
 * Reglas: solo identificadores opacos y metadatos mínimos. Nunca nombres, correos ni datos
 * de estudiantes en `meta`. La base de datos valida de nuevo formato y tamaño.
 */
export const auditEntrySchema = z.object({
  workspaceId: z.uuid(),
  actorId: z.uuid(),
  action: z
    .string()
    .max(80)
    .regex(
      /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/,
      "usa el formato entidad.accion, p. ej. course.create",
    ),
  entityType: z.string().max(60).optional(),
  entityId: z.uuid().optional(),
  meta: z
    .record(z.string(), z.union([z.string().max(200), z.number(), z.boolean(), z.null()]))
    .default({}),
});

export type AuditEntry = z.input<typeof auditEntrySchema>;

/** Subconjunto del cliente de Supabase que necesitamos (facilita las pruebas). */
export type AuditClient = {
  from(table: "audit_log"): {
    insert(row: Record<string, unknown>): PromiseLike<{ error: { message: string } | null }>;
  };
};

export async function writeAudit(client: AuditClient, entry: AuditEntry): Promise<void> {
  const parsed = auditEntrySchema.parse(entry);
  const { error } = await client.from("audit_log").insert({
    workspace_id: parsed.workspaceId,
    actor_id: parsed.actorId,
    action: parsed.action,
    entity_type: parsed.entityType ?? null,
    entity_id: parsed.entityId ?? null,
    meta: parsed.meta,
  });
  if (error) {
    // Un fallo de auditoría no debe filtrar datos: se informa sin el contenido de la fila.
    throw new Error(`No se pudo registrar la auditoría: ${error.message}`);
  }
}

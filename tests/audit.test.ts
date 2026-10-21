import { describe, expect, it } from "vitest";
import { writeAudit, type AuditClient } from "@/lib/audit";

const WS = "11111111-1111-4111-8111-111111111111";
const USER = "22222222-2222-4222-8222-222222222222";

function fakeClient(error: { message: string } | null = null) {
  const rows: Record<string, unknown>[] = [];
  const client: AuditClient = {
    from: () => ({
      insert: async (row) => {
        rows.push(row);
        return { error };
      },
    }),
  };
  return { client, rows };
}

describe("writeAudit", () => {
  it("inserta la fila con los nombres de columna de la base de datos", async () => {
    const { client, rows } = fakeClient();
    await writeAudit(client, {
      workspaceId: WS,
      actorId: USER,
      action: "course.create",
      entityType: "course",
      meta: { origin: "test" },
    });
    expect(rows).toEqual([
      {
        workspace_id: WS,
        actor_id: USER,
        action: "course.create",
        entity_type: "course",
        entity_id: null,
        meta: { origin: "test" },
      },
    ]);
  });

  it.each(["Course.Create", "course create", "course.", ".course", "1course", ""])(
    "rechaza la acción con formato inválido %j",
    async (action) => {
      const { client, rows } = fakeClient();
      await expect(
        writeAudit(client, { workspaceId: WS, actorId: USER, action }),
      ).rejects.toThrow();
      expect(rows).toHaveLength(0);
    },
  );

  it("no admite estructuras anidadas en meta (evita volcar objetos con datos personales)", async () => {
    const { client } = fakeClient();
    await expect(
      writeAudit(client, {
        workspaceId: WS,
        actorId: USER,
        action: "export.run",
        meta: { student: { name: "x" } } as never,
      }),
    ).rejects.toThrow();
  });

  it("propaga el fallo de la base sin incluir la fila", async () => {
    const { client } = fakeClient({ message: "boom" });
    await expect(
      writeAudit(client, {
        workspaceId: WS,
        actorId: USER,
        action: "course.create",
        meta: { n: "secreto" },
      }),
    ).rejects.toThrow(/boom/);
    await expect(
      writeAudit(client, {
        workspaceId: WS,
        actorId: USER,
        action: "course.create",
        meta: { n: "secreto" },
      }),
    ).rejects.not.toThrow(/secreto/);
  });
});

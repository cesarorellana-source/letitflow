import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string | null;
  displayName: string | null;
};

/**
 * Usuario autenticado, verificado contra el servidor de Auth de Supabase (`getUser`),
 * no solo leyendo la cookie. Es la fuente de verdad para páginas y acciones.
 * Devuelve null si no hay sesión o Supabase no está configurado.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", data.user.id)
    .maybeSingle();

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    displayName: profile?.display_name ?? null,
  };
});

/** Exige sesión; si no la hay, redirige al login. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export type WorkspaceSummary = {
  id: string;
  name: string;
  kind: "personal" | "team" | "institution";
  role: "viewer" | "editor" | "admin" | "owner";
};

/** Espacios a los que pertenece la persona (la RLS ya filtra por membresía). */
export const getMyWorkspaces = cache(async (): Promise<WorkspaceSummary[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("role, workspaces ( id, name, kind )")
    .order("created_at", { ascending: true });
  if (error || !data) return [];

  return data.flatMap((row) => {
    const ws = Array.isArray(row.workspaces) ? row.workspaces[0] : row.workspaces;
    return ws
      ? [{ id: ws.id, name: ws.name, kind: ws.kind, role: row.role } as WorkspaceSummary]
      : [];
  });
});

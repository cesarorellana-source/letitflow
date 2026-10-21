"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNextPath } from "@/lib/auth/safe-redirect";
import { isSupabaseConfigured } from "@/lib/env";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.email().max(254);

function callbackUrl(site: string, next: string) {
  const url = new URL("/auth/callback", site);
  if (next !== "/") url.searchParams.set("next", next);
  return url.toString();
}

export async function sendMagicLink(formData: FormData) {
  const email = emailSchema.safeParse(
    String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
  );
  if (!email.success) redirect("/login?error=email");
  if (!isSupabaseConfigured()) redirect("/login?error=config");

  const next = safeNextPath(String(formData.get("next") ?? ""));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: callbackUrl(await getSiteUrl(), next) },
  });
  if (error) redirect("/login?error=send");

  // Mismo mensaje exista o no la cuenta, para no revelar quién está registrado.
  redirect("/login?sent=1");
}

export async function signInWithGoogle(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/login?error=config");

  const next = safeNextPath(String(formData.get("next") ?? ""));
  const supabase = await createClient();
  // Solo los permisos básicos (identidad). Drive y Classroom se pedirán después, de forma
  // incremental, cuando la persona active esas integraciones.
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(await getSiteUrl(), next) },
  });
  if (error || !data.url) redirect("/login?error=send");

  redirect(data.url);
}

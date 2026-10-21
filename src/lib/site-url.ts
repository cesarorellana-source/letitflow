import "server-only";
import { headers } from "next/headers";
import { publicEnv } from "@/lib/env";

/** URL base del sitio para enlaces de correo y OAuth. Prefiere la variable configurada. */
export async function getSiteUrl(): Promise<string> {
  if (publicEnv.NEXT_PUBLIC_SITE_URL) {
    return publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

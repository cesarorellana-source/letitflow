import { NextResponse, type NextRequest } from "next/server";
import { buildCsp } from "@/lib/csp";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { updateSession } from "@/lib/supabase/proxy";

// Rutas accesibles sin sesión.
const PUBLIC_PATHS = ["/login", "/auth"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp({
    nonce,
    isDev: process.env.NODE_ENV === "development",
    supabaseUrl: publicEnv.NEXT_PUBLIC_SUPABASE_URL,
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const { response, userId } = await updateSession(request, requestHeaders);
  const { pathname } = request.nextUrl;

  let result: NextResponse = response;

  if (!userId && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/" && isSupabaseConfigured()) {
      url.searchParams.set("next", pathname);
    }
    result = NextResponse.redirect(url);
  } else if (userId && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    result = NextResponse.redirect(url);
  }

  // Conserva las cookies de sesión renovadas también en las redirecciones.
  if (result !== response) {
    response.cookies.getAll().forEach((cookie) => result.cookies.set(cookie));
  }
  result.headers.set("Content-Security-Policy", csp);
  return result;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};

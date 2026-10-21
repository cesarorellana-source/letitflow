/**
 * Content-Security-Policy con nonce por solicitud (ver docs de Next.js: guía de CSP).
 * Función pura para poder probarla.
 */
export function buildCsp(opts: { nonce: string; isDev: boolean; supabaseUrl?: string }): string {
  const { nonce, isDev, supabaseUrl } = opts;

  let supabaseOrigin = "";
  if (supabaseUrl) {
    try {
      supabaseOrigin = new URL(supabaseUrl).origin;
    } catch {
      supabaseOrigin = "";
    }
  }

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    // En desarrollo, el HMR inyecta estilos en línea.
    "style-src": ["'self'", ...(isDev ? ["'unsafe-inline'"] : [`'nonce-${nonce}'`])],
    "img-src": ["'self'", "blob:", "data:"],
    "font-src": ["'self'"],
    "connect-src": [
      "'self'",
      ...(supabaseOrigin ? [supabaseOrigin] : []),
      ...(isDev ? ["ws:", "wss:"] : []),
    ],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    // El inicio de sesión con Google redirige vía Supabase.
    "form-action": ["'self'", ...(supabaseOrigin ? [supabaseOrigin] : [])],
    "frame-ancestors": ["'none'"],
  };

  const parts = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  if (!isDev) {
    parts.push("upgrade-insecure-requests");
  }
  return parts.join("; ");
}

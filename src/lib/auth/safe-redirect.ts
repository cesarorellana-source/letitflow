/**
 * Devuelve una ruta interna segura para redirigir tras el inicio de sesión.
 * Evita redirecciones abiertas: solo se aceptan rutas relativas del mismo sitio.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  // "//host" y "/\host" son URLs relativas al protocolo que el navegador trata como externas.
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  return next;
}

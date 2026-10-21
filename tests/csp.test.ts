import { describe, expect, it } from "vitest";
import { buildCsp } from "@/lib/csp";

describe("buildCsp", () => {
  const prod = buildCsp({
    nonce: "abc123",
    isDev: false,
    supabaseUrl: "https://xyz.supabase.co/rest/v1",
  });

  it("incluye el nonce y strict-dynamic en script-src, sin unsafe-eval ni unsafe-inline", () => {
    expect(prod).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(prod).not.toContain("unsafe-eval");
    expect(prod).not.toContain("unsafe-inline");
  });

  it("bloquea objetos, frames y base-uri externos", () => {
    expect(prod).toContain("object-src 'none'");
    expect(prod).toContain("frame-ancestors 'none'");
    expect(prod).toContain("base-uri 'self'");
  });

  it("permite conectar solo con el origen de Supabase configurado", () => {
    expect(prod).toContain("connect-src 'self' https://xyz.supabase.co");
    expect(prod).not.toContain("https://xyz.supabase.co/rest");
  });

  it("fuerza HTTPS solo en producción", () => {
    expect(prod).toContain("upgrade-insecure-requests");
    expect(buildCsp({ nonce: "n", isDev: true })).not.toContain("upgrade-insecure-requests");
  });

  it("en desarrollo permite lo que exige el HMR", () => {
    const dev = buildCsp({ nonce: "n", isDev: true });
    expect(dev).toContain("'unsafe-eval'");
    expect(dev).toContain("style-src 'self' 'unsafe-inline'");
  });

  it("ignora una URL de Supabase inválida en lugar de fallar", () => {
    expect(() => buildCsp({ nonce: "n", isDev: false, supabaseUrl: "???" })).not.toThrow();
  });
});

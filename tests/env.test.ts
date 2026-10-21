import { describe, expect, it } from "vitest";
import { isSupabaseConfigured, parsePublicEnv, parseServerEnv } from "@/lib/env";

describe("parsePublicEnv", () => {
  it("usa el nombre provisional si no se define", () => {
    expect(parsePublicEnv({}).NEXT_PUBLIC_APP_NAME).toBe("LetItFlow");
  });

  it("trata las cadenas vacías como no definidas (como deja .env.example)", () => {
    const env = parsePublicEnv({ NEXT_PUBLIC_APP_NAME: "", NEXT_PUBLIC_SUPABASE_URL: "" });
    expect(env.NEXT_PUBLIC_APP_NAME).toBe("LetItFlow");
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
  });

  it("rechaza una URL de Supabase inválida", () => {
    expect(() => parsePublicEnv({ NEXT_PUBLIC_SUPABASE_URL: "no-es-url" })).toThrow();
  });

  it("isSupabaseConfigured exige URL y clave", () => {
    expect(isSupabaseConfigured(parsePublicEnv({}))).toBe(false);
    expect(
      isSupabaseConfigured(parsePublicEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co" })),
    ).toBe(false);
    expect(
      isSupabaseConfigured(
        parsePublicEnv({
          NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "x".repeat(40),
        }),
      ),
    ).toBe(true);
  });
});

describe("parseServerEnv", () => {
  it("aplica valores por defecto seguros", () => {
    const env = parseServerEnv({});
    expect(env.AI_PROVIDER).toBe("claude");
    expect(env.AI_MONTHLY_BUDGET_USD).toBe(5);
    expect(env.AI_PRICE_INPUT_PER_MTOK_USD).toBeUndefined();
  });

  it("convierte el tope y los precios a número", () => {
    const env = parseServerEnv({
      AI_MONTHLY_BUDGET_USD: "12.5",
      AI_PRICE_INPUT_PER_MTOK_USD: "3",
      AI_PRICE_OUTPUT_PER_MTOK_USD: "15",
    });
    expect(env.AI_MONTHLY_BUDGET_USD).toBe(12.5);
    expect(env.AI_PRICE_INPUT_PER_MTOK_USD).toBe(3);
    expect(env.AI_PRICE_OUTPUT_PER_MTOK_USD).toBe(15);
  });

  it("rechaza un proveedor desconocido y un tope no positivo", () => {
    expect(() => parseServerEnv({ AI_PROVIDER: "otro" })).toThrow();
    expect(() => parseServerEnv({ AI_MONTHLY_BUDGET_USD: "0" })).toThrow();
  });
});

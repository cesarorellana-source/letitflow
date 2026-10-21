import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/safe-redirect";

describe("safeNextPath", () => {
  it("acepta rutas internas", () => {
    expect(safeNextPath("/planificacion")).toBe("/planificacion");
    expect(safeNextPath("/cursos?id=1#a")).toBe("/cursos?id=1#a");
  });

  it("usa el valor por defecto si falta", () => {
    expect(safeNextPath(undefined)).toBe("/");
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath("")).toBe("/");
    expect(safeNextPath("", "/inicio")).toBe("/inicio");
  });

  it.each([
    "https://evil.example",
    "http://evil.example/x",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "planificacion",
    "/ok\nSet-Cookie: a=b",
  ])("rechaza %j", (value) => {
    expect(safeNextPath(value)).toBe("/");
  });
});

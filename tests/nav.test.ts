import { describe, expect, it } from "vitest";
import { NAV_SECTIONS, findSection } from "@/lib/nav";

describe("navegación", () => {
  it("tiene las 12 secciones definidas en el PRD, empezando por Inicio", () => {
    expect(NAV_SECTIONS).toHaveLength(12);
    expect(NAV_SECTIONS[0].label).toBe("Inicio");
    expect(NAV_SECTIONS.at(-1)?.label).toBe("Configuración e integraciones");
  });

  it("no repite rutas ni identificadores", () => {
    expect(new Set(NAV_SECTIONS.map((s) => s.href)).size).toBe(12);
    expect(new Set(NAV_SECTIONS.map((s) => s.slug)).size).toBe(12);
  });

  it("hoy solo Inicio y Configuración están listas; el resto es «Próximamente»", () => {
    const ready = NAV_SECTIONS.filter((s) => s.ready).map((s) => s.label);
    expect(ready).toEqual(["Inicio", "Configuración e integraciones"]);
  });

  it("no incluye ninguna sección de Alexia (fuera del alcance, ver D-004)", () => {
    expect(NAV_SECTIONS.some((s) => /alexia/i.test(`${s.label} ${s.description}`))).toBe(false);
  });

  it("findSection encuentra por identificador", () => {
    expect(findSection("leccionario")?.label).toBe("Leccionario");
    expect(findSection("no-existe")).toBeUndefined();
  });
});

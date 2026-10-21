import { describe, expect, it } from "vitest";
import { createPseudonymizer } from "@/lib/ai/pseudonymize";

describe("createPseudonymizer", () => {
  const names = ["Ana Pérez", "Ana", "Luis"];

  it("reemplaza los nombres por seudónimos", () => {
    const p = createPseudonymizer(names);
    const out = p.apply("Luis ayudó a Ana en la actividad.");
    expect(out).not.toMatch(/Luis|Ana/);
    expect(out).toMatch(/Estudiante [A-Z]/);
  });

  it("prefiere el nombre más largo: «Ana Pérez» no queda como «Ana» + apellido", () => {
    const p = createPseudonymizer(names);
    const out = p.apply("Ana Pérez terminó primero.");
    expect(out).not.toContain("Pérez");
    expect(out).toMatch(/^Estudiante [A-Z] terminó primero\.$/);
  });

  it("no toca palabras que solo contienen el nombre (Analía, Luisa)", () => {
    const p = createPseudonymizer(["Ana", "Luis"]);
    expect(p.apply("Analía y Luisa participaron.")).toBe("Analía y Luisa participaron.");
  });

  it("ignora mayúsculas y minúsculas y acentos propios del nombre", () => {
    const p = createPseudonymizer(["María José"]);
    expect(p.apply("MARÍA JOSÉ llegó tarde")).toMatch(/^Estudiante A llegó tarde$/);
  });

  it("restaura los nombres reales en la respuesta", () => {
    const p = createPseudonymizer(["Ana", "Luis"]);
    const sent = p.apply("Ana y Luis trabajan juntos.");
    expect(p.restore(`${sent} Felicita a los dos.`)).toBe(
      "Ana y Luis trabajan juntos. Felicita a los dos.",
    );
  });

  it("no confunde «Estudiante A» con «Estudiante AA» al restaurar", () => {
    const many = Array.from(
      { length: 28 },
      (_, i) => `Nombre${String.fromCharCode(97 + (i % 26))}${i}`,
    );
    const p = createPseudonymizer(many);
    const text = many.join(" ");
    expect(p.restore(p.apply(text))).toBe(text);
  });

  it("escapa caracteres especiales de expresiones regulares en los nombres", () => {
    const p = createPseudonymizer(["O'Brien (hijo)", "J.R."]);
    expect(p.apply("O'Brien (hijo) y J.R. juegan")).toMatch(
      /^Estudiante [A-Z] y Estudiante [A-Z] juegan$/,
    );
  });

  it("sin nombres, devuelve el texto tal cual", () => {
    const p = createPseudonymizer([]);
    expect(p.apply("Texto sin nombres")).toBe("Texto sin nombres");
  });
});

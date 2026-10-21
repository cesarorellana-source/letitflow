/**
 * Minimización de datos: reemplaza nombres de estudiantes por seudónimos antes de enviar
 * texto a un proveedor de IA, y permite revertirlo al mostrar la respuesta.
 *
 * Es una red de seguridad, no una garantía: quien arma el prompt debe preferir no incluir
 * nombres en absoluto.
 */
export type Pseudonymizer = {
  /** Texto seguro para enviar al proveedor. */
  apply(text: string): string;
  /** Restituye los nombres reales en la respuesta, solo para mostrarla a la persona. */
  restore(text: string): string;
};

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function label(index: number) {
  // Estudiante A, B, ... Z, AA, AB...
  let n = index;
  let out = "";
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return `Estudiante ${out}`;
}

export function createPseudonymizer(names: string[]): Pseudonymizer {
  // Nombres más largos primero, para que «Ana María» no se parta en «Ana».
  const unique = [...new Set(names.map((n) => n.trim()).filter((n) => n.length > 0))].sort(
    (a, b) => b.length - a.length,
  );
  const toAlias = new Map(unique.map((name, i) => [name, label(i)]));

  const pattern = unique.length
    ? new RegExp(
        `(?<![\\p{L}\\p{N}])(${unique.map(escapeRegExp).join("|")})(?![\\p{L}\\p{N}])`,
        "giu",
      )
    : null;
  const lowerToAlias = new Map([...toAlias].map(([name, alias]) => [name.toLowerCase(), alias]));
  const aliasToName = new Map([...toAlias].map(([name, alias]) => [alias, name]));

  return {
    apply(text) {
      if (!pattern) return text;
      return text.replace(pattern, (match) => lowerToAlias.get(match.toLowerCase()) ?? match);
    },
    restore(text) {
      let out = text;
      // Alias más largos primero, para que «Estudiante AA» no se confunda con «Estudiante A».
      for (const alias of [...aliasToName.keys()].sort((a, b) => b.length - a.length)) {
        out = out.replaceAll(alias, aliasToName.get(alias)!);
      }
      return out;
    },
  };
}

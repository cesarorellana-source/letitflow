import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/app-shell/app-shell";

let currentPath = "/";
vi.mock("next/navigation", () => ({ usePathname: () => currentPath }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function render(path: string) {
  currentPath = path;
  return renderToStaticMarkup(<AppShell userLabel="Docente de prueba">contenido</AppShell>);
}

describe("AppShell", () => {
  beforeEach(() => {
    currentPath = "/";
  });

  it("muestra las 12 secciones en el menú de escritorio y en el de celular", () => {
    const html = render("/");
    const links = html.match(/<a [^>]*href="\/[^"]*"/g) ?? [];
    // 12 en cada menú + el enlace «Saltar al contenido» (ancla, no cuenta como ruta).
    expect(links.length).toBe(24);
  });

  it("incluye el enlace para saltar al contenido y el contenedor principal", () => {
    const html = render("/");
    expect(html).toContain('href="#contenido"');
    expect(html).toContain('id="contenido"');
    expect(html).toContain("contenido</main>");
  });

  it("marca como página actual solo la sección activa", () => {
    const html = render("/evaluaciones");
    const current = html.match(/aria-current="page"[^>]*>/g) ?? [];
    // Una vez por menú (escritorio y celular).
    expect(current).toHaveLength(2);
    expect(html).toMatch(
      /href="\/evaluaciones"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/evaluaciones"/,
    );
  });

  it("Inicio solo está activo en la raíz", () => {
    const root = render("/");
    expect(root).toMatch(/href="\/"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/"/);
    const other = render("/cursos");
    expect(other).not.toMatch(
      /href="\/"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/"/,
    );
  });

  it("rotula como «Pronto» las 10 secciones sin funcionalidad, en cada menú", () => {
    const html = render("/");
    expect((html.match(/Pronto/g) ?? []).length).toBe(20);
  });

  it("muestra a quién pertenece la sesión", () => {
    expect(render("/")).toContain("Docente de prueba");
  });
});

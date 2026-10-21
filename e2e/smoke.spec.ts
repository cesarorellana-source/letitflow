import { expect, test } from "@playwright/test";

// La app arranca SIN credenciales de Supabase (ver playwright.config.ts). Estas pruebas
// verifican el comportamiento sin configuración, la protección de rutas y las cabeceras.
// El flujo autenticado real requiere un proyecto de Supabase y no se prueba aquí.

const PROTECTED = [
  "/",
  "/planificacion",
  "/evaluaciones",
  "/leccionario",
  "/configuracion",
  "/ruta-inexistente",
];

test.describe("sin sesión", () => {
  for (const path of PROTECTED) {
    test(`${path} redirige al login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login(\?|$)/);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }

  test("el login avisa que falta configurar Supabase y deshabilita el acceso", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("status").filter({ hasText: "Configuración pendiente" }),
    ).toBeVisible();
    await expect(page.getByLabel("Correo electrónico")).toBeDisabled();
    await expect(page.getByRole("button", { name: "Continuar con Google" })).toBeDisabled();
  });

  test("muestra el error recibido por parámetro", async ({ page }) => {
    await page.goto("/login?error=callback");
    // Se acota a <main>: Next.js inserta su propio role="alert" (anunciador de rutas).
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "El enlace no es válido o expiró",
    );
  });

  test("ignora códigos de error desconocidos (no refleja texto de la URL)", async ({ page }) => {
    await page.goto("/login?error=<script>alert(1)</script>");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText("alert(1)");
  });

  test("cerrar sesión solo acepta POST", async ({ request }) => {
    const res = await request.get("/auth/signout", { maxRedirects: 0 });
    expect(res.status()).toBe(405);
  });

  test("el callback sin código vuelve al login con error", async ({ page }) => {
    await page.goto("/auth/callback");
    await expect(page).toHaveURL(/\/login\?error=callback/);
  });
});

test.describe("seguridad de la respuesta", () => {
  test("incluye cabeceras de seguridad y una CSP con nonce distinto en cada solicitud", async ({
    request,
  }) => {
    const a = await request.get("/login");
    const b = await request.get("/login");
    const headers = a.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["x-powered-by"]).toBeUndefined();

    const nonce = (h: Record<string, string>) =>
      /'nonce-([^']+)'/.exec(h["content-security-policy"] ?? "")?.[1];
    expect(nonce(headers)).toBeTruthy();
    expect(nonce(headers)).not.toBe(nonce(b.headers()));
    expect(headers["content-security-policy"]).not.toContain("unsafe-inline");
    expect(headers["content-security-policy"]).not.toContain("unsafe-eval");
  });

  test("el login carga sin violaciones de CSP ni errores de consola", async ({ page }) => {
    const problems: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") problems.push(msg.text());
    });
    page.on("pageerror", (err) => problems.push(err.message));

    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    expect(problems).toEqual([]);
  });
});

test.describe("diseño adaptable", () => {
  test("el login no tiene desplazamiento horizontal", async ({ page }) => {
    await page.goto("/login");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("el login declara el idioma español", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
  });
});

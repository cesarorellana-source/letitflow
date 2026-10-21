# Notas para trabajar en este repositorio

Plataforma de trabajo pedagógico para docentes (Chile, foco 1° básico). Lee primero `README.md`,
`docs/PRD.md` y `docs/TECHNICAL_DESIGN.md`. Next.js trae su propia documentación para agentes:
sigue `AGENTS.md` (la guía de `node_modules/next/dist/docs/` manda sobre lo que recuerdes).

## Comandos

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build   # = pnpm verify
pnpm test:db     # migraciones + RLS contra Postgres 16 (TEST_DB_ADMIN_URL o usuario postgres)
pnpm test:e2e    # Playwright; PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium en este entorno
```

## Reglas del proyecto

- **Idioma:** textos de interfaz y documentos en español; código y nombres técnicos en inglés.
- **Datos de menores:** nunca datos reales de estudiantes en código, pruebas ni fixtures; solo
  sintéticos. A la IA no se le envían nombres de estudiantes (`createPseudonymizer`).
- **Multi-tenencia:** toda tabla de dominio lleva `workspace_id`, RLS activada, privilegios mínimos
  (`revoke all` y luego `grant` explícito) y una prueba SQL en `supabase/tests/`. Toda migración
  nueva debe pasar `pnpm test:db`.
- **Autorización en el servidor:** usa `requireUser()`/`getCurrentUser()` (`src/lib/auth/session.ts`),
  que verifica con Supabase. El proxy solo redirige de forma optimista.
- **Clave de servicio:** `createServiceClient()` salta la RLS; solo en código de servidor y tras
  verificar identidad y espacio.
- **No simular:** lo no implementado se muestra como «Próximamente»; no presentes como real una
  integración o función que no se ha probado.
- **Fuera de alcance:** la integración con Alexia se desarrolla en otro proyecto (ver D-004).
- **Secretos:** nada en el repositorio; `.env.example` solo con marcadores.
- Documenta decisiones en `docs/DECISIONS.md` y mantén `docs/TASKS.md` al día.

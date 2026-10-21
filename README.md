# LetItFlow (nombre provisional)

Plataforma web de trabajo pedagógico para docentes, con IA como apoyo al criterio profesional.
Foco inicial: educación básica chilena, empezando por **1° básico**.

> **Estado: esqueleto (Fase 0 + base técnica).** Hay cuentas, espacios de trabajo con permisos,
> base de datos con aislamiento por RLS, capa de IA y navegación. **Las herramientas pedagógicas
> (planificación, material, evaluaciones, leccionario...) aún no existen**; en la app aparecen como
> «Próximamente». Ver [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Producto, funciones, prioridades, criterios de aceptación |
| [`docs/TECHNICAL_DESIGN.md`](docs/TECHNICAL_DESIGN.md) | Arquitectura, datos, seguridad, capa de IA |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Fases y tareas |
| [`docs/AI_PROVIDERS.md`](docs/AI_PROVIDERS.md) | Cómo conectar un proveedor de IA |
| [`docs/research/google-workspace.md`](docs/research/google-workspace.md) | Investigación de Drive, Slides y Classroom |
| [`docs/RISKS.md`](docs/RISKS.md) | Riesgos |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Registro de decisiones |
| [`docs/TASKS.md`](docs/TASKS.md) | Tareas pendientes |

## Requisitos

- Node.js 22 o superior
- pnpm 10
- Para las pruebas de base de datos: PostgreSQL 16 (no hace falta Docker ni Supabase)
- Para iniciar sesión de verdad: un proyecto de [Supabase](https://supabase.com)

## Puesta en marcha

```bash
pnpm install
cp .env.example .env.local   # y completa los valores (ver abajo)
pnpm dev                     # http://localhost:3000
```

Sin variables de Supabase la app **arranca**, pero la pantalla de acceso muestra «Configuración
pendiente» y el inicio de sesión queda deshabilitado.

### Variables de entorno

Todas están documentadas en [`.env.example`](.env.example). Nunca subas `.env.local` al repositorio.

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_APP_NAME` | Nombre provisional del producto |
| `NEXT_PUBLIC_SITE_URL` | URL pública (enlaces de correo y OAuth) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Conexión a Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor; salta la RLS (registro de uso de IA) |
| `AI_PROVIDER`, `ANTHROPIC_API_KEY`, `AI_MODEL_DEFAULT` | Proveedor de IA ([guía](docs/AI_PROVIDERS.md)) |
| `AI_MONTHLY_BUDGET_USD`, `AI_PRICE_*` | Tope mensual y precios para estimar costos |

### Conectar Supabase

> Los pasos siguientes describen el procedimiento previsto. **No se han ejecutado todavía contra un
> proyecto real** (aún no hay credenciales).

1. Crea un proyecto en Supabase y copia la URL y la clave `anon` a `.env.local`.
2. Aplica las migraciones de [`supabase/migrations`](supabase/migrations) (con la CLI de Supabase:
   `npx supabase init`, `npx supabase link --project-ref <ref>` y `npx supabase db push`).
3. En *Authentication → URL Configuration*, define la *Site URL* y agrega
   `<tu-url>/auth/callback` a las *Redirect URLs*.
4. Para entrar con Google, activa el proveedor en *Authentication → Providers*. La app pide solo
   los permisos básicos de identidad.

## Pruebas

```bash
pnpm lint          # ESLint
pnpm typecheck     # TypeScript
pnpm test          # Vitest (unitarias)
pnpm test:db       # Migraciones + RLS contra Postgres 16 local
pnpm test:e2e      # Playwright (humo, sin credenciales de Supabase)
pnpm verify        # lint + tipos + unitarias + build
```

- `pnpm test:db` crea una base temporal, simula lo mínimo de Supabase, aplica las migraciones reales
  y ejecuta `supabase/tests/*.test.sql`. Conexión: `TEST_DB_ADMIN_URL` (p. ej.
  `postgresql://postgres:postgres@localhost:5432/postgres`) o, si corres como root, el usuario
  `postgres` del sistema.
- `pnpm test:e2e` usa el Chromium que descargue Playwright. Si ya tienes uno instalado, indica su
  ruta con `PLAYWRIGHT_CHROMIUM_PATH`.

### Qué está probado y qué no

| Área | Estado |
|---|---|
| Aislamiento entre espacios, roles, auditoría y uso de IA (RLS) | Probado contra Postgres 16 con un simulador de Supabase; la suite falla si se rompe una política |
| Lógica de entorno, CSP, redirecciones seguras, IA (con proveedores simulados), navegación | Probado con pruebas unitarias |
| Login, rutas protegidas, cabeceras de seguridad y CSP sin sesión | Probado con Playwright en escritorio y celular |
| **Inicio de sesión real** (enlace mágico y Google) contra Supabase | **No probado**: requiere un proyecto de Supabase |
| **Shell autenticado** (menú, Inicio, Configuración) en un navegador | **No probado de punta a punta**; el menú tiene prueba de render |
| **Adaptador de Claude contra la API real** | **No probado**: requiere clave; solo hay pruebas con un cliente simulado |
| Workflow de CI | **No ejecutado** todavía (se verificó localmente cada comando) |

## Estructura

```
src/app/             Rutas (App Router): login, auth/*, (app)/ protegido
src/components/      UI base y shell de navegación
src/lib/auth/        Sesión (verificada en servidor) y redirecciones seguras
src/lib/ai/          Capa de IA: interfaz, Claude, proveedor falso, costos, seudonimización
src/lib/supabase/    Clientes de servidor, de servicio y refresco de sesión
src/proxy.ts         CSP con nonce, refresco de sesión y redirección a /login
supabase/migrations/ Esquema y RLS
supabase/tests/      Pruebas SQL de aislamiento
e2e/, tests/         Playwright y Vitest
```

## Privacidad y seguridad (resumen)

- Todo dato de dominio va en un espacio de trabajo y se protege con RLS; la clave de servicio nunca
  llega al navegador.
- A los proveedores de IA no se les envían nombres ni datos identificables de estudiantes.
- **No uses datos reales de estudiantes** en desarrollo ni pruebas. Antes de cualquier piloto en un
  establecimiento hace falta revisión legal (Ley 21.719 y normativa escolar).

Detalle en [`docs/TECHNICAL_DESIGN.md`](docs/TECHNICAL_DESIGN.md) y [`docs/RISKS.md`](docs/RISKS.md).

# Registro de decisiones

Formato: contexto, decisión, consecuencias. Las decisiones del titular del proyecto se marcan como tales.

## D-001 — Lenguaje: TypeScript (titular, 2026-10-21)
**Contexto.** Se pidió JavaScript, pero el producto maneja datos de menores, esquemas de salida de IA y permisos.
**Decisión.** TypeScript sobre Next.js y Node.
**Consecuencias.** Mismo ecosistema, con tipos que previenen errores en el modelo de datos y en los esquemas.

## D-002 — Alcance de la primera sesión (titular, 2026-10-21)
**Decisión.** Fase 0 (documentos) más esqueleto de la aplicación. Sin funciones pedagógicas todavía.

## D-003 — Foco del MVP: 1° básico, todas las asignaturas (titular, 2026-10-21)
**Consecuencias.** La importación de OA se limita a 1° básico. Las reglas de material (instrucciones breves, tipografía grande, apoyo visual) se diseñan para lectores iniciales.

## D-004 — Alexia queda fuera de este proyecto (titular, 2026-10-21)
**Contexto.** La integración con Alexia no es necesaria ahora y el titular la desarrollará en un proyecto aparte.
**Decisión.** Se elimina el módulo K, el informe de investigación y cualquier adaptador. El leccionario se mantiene con exportación genérica (CSV/XLSX/PDF).
**Consecuencias.** El otro proyecto puede consumir esos exportes. No se afirma ni se prueba ninguna integración con Alexia.

## D-005 — Repositorio de destino: `letitflow` (titular, 2026-10-21)
**Decisión.** Todo el código y los documentos van a `cesarorellana-source/letitflow`. El repositorio `SIMITOFUTBOL` (vacío) no se usa.
**Nota.** El nombre «LetItFlow» se usa como nombre provisional configurable.

## D-006 — Monolito Next.js 16 + Supabase (asistente, 2026-10-21)
**Contexto.** Se necesita multi-tenencia con aislamiento fuerte para datos de menores, sin infraestructura compleja.
**Decisión.** Un único proyecto Next.js (App Router) con Supabase (Postgres, Auth, Storage) y RLS.
**Consecuencias.** Menos piezas que operar. Dependencia de Supabase, mitigada por SQL estándar.

## D-007 — SQL versionado, sin ORM (asistente, 2026-10-21)
**Contexto.** Prisma figura en versión candidata y complica la RLS.
**Decisión.** Migraciones SQL en `supabase/migrations` y tipos generados.

## D-008 — Capa de IA con interfaz de proveedor (asistente, 2026-10-21)
**Decisión.** Interfaz `AIProvider` con adaptador de Claude por defecto y proveedor falso para pruebas. Salidas validadas con zod, registro de uso y tope de costo por espacio.
**Consecuencias.** Se puede cambiar de proveedor sin tocar los módulos. Requiere clave de IA, que el titular debe entregar como variable de entorno.

## D-009 — Pruebas de RLS con Postgres 16 local (asistente, 2026-10-21)
**Contexto.** El entorno no tiene Docker en ejecución, por lo que no hay Supabase local.
**Decisión.** Probar migraciones y RLS contra Postgres 16 con un esquema `auth` simulado.
**Consecuencias.** El inicio de sesión real queda sin probar hasta contar con un proyecto Supabase.

## D-010 — Sin datos reales de estudiantes en desarrollo (asistente, 2026-10-21)
**Decisión.** Solo datos sintéticos hasta completar la revisión legal bajo la Ley 21.719.

## D-011 — Sin Cache Components (asistente, 2026-10-21)
**Contexto.** `create-next-app` activa `cacheComponents` y `partialPrefetching`. Con ellos, toda lectura de sesión debe ir tras un límite `Suspense`.
**Decisión.** Desactivarlos. La aplicación es privada y por usuario, así que prerenderizar aporta poco; todo se renderiza por solicitud.
**Consecuencias.** Más simple y predecible. Reversible si más adelante se quiere optimizar páginas públicas.

## D-012 — Tipografía del sistema (asistente, 2026-10-21)
**Decisión.** No usar `next/font/google`: evita descargar fuentes en el build y que el navegador contacte a un tercero.

## D-013 — CSP con nonce por solicitud en el proxy (asistente, 2026-10-21)
**Decisión.** `src/proxy.ts` (Next 16 renombró «middleware» a «proxy») genera un nonce por solicitud y fija la CSP; las demás cabeceras de seguridad son estáticas en `next.config.ts`.
**Consecuencias.** Sin `unsafe-inline` ni `unsafe-eval` en producción. Obliga a renderizar por solicitud (ver D-011).

## D-014 — Dos niveles de comprobación de sesión (asistente, 2026-10-21)
**Decisión.** El proxy solo usa los claims del JWT (`getClaims`) para redirigir de forma optimista. La autoridad es `getUser()` en el servidor (`src/lib/auth/session.ts`) y, sobre todo, la RLS de la base de datos.

## D-015 — Permisos mínimos y registros inmutables (asistente, 2026-10-21)
**Decisión.**
- En cada tabla se revoca todo a `anon` y `authenticated` y se concede de forma explícita, incluso por columna (p. ej. `workspace_id` de un curso no se puede cambiar).
- `ai_usage` solo admite inserciones con la clave de servicio, para que nadie falsee su consumo y eluda el tope.
- `audit_log` es solo de inserción (trigger) y no tiene claves foráneas, para sobrevivir al borrado de cuentas y espacios; la purga por retención debe activarse de forma explícita.
- Un espacio nunca queda sin propietario, y el espacio personal no admite otros miembros.

## D-016 — Salidas de IA estructuradas y sin precios supuestos (asistente, 2026-10-21)
**Decisión.** El adaptador de Claude obliga al modelo a usar una herramienta con el esquema de la tarea y revalida con zod. No hay precios por defecto: sin `AI_PRICE_*` el adaptador se niega a operar, porque no se puede limitar un costo que no se estima.
**Estado.** Probado solo con un cliente simulado; falta una llamada de verificación con clave real.

## D-017 — Componentes de UI escritos a mano (asistente, 2026-10-21)
**Decisión.** Botón y tarjeta al estilo shadcn/ui, sin usar su CLI. Radix se incorporará cuando haya diálogos, menús o selectores que lo justifiquen.

## Decisiones pendientes del titular
1. Crear un proyecto Supabase (región) y entregar las claves como variables de entorno.
2. Proveedor de IA, clave y tope mensual.
3. Plan de hosting y verificación de sus términos para uso comercial.
4. Nombre definitivo del producto.
5. Modelo comercial (se difiere).
6. Revisión legal previa a un piloto con datos reales.

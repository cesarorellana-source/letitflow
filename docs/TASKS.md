# Tareas

Última actualización: 2026-10-21.

## Hecho
- [x] Inspeccionar el entorno y los repositorios (ambos vacíos).
- [x] Investigar APIs de Google, Ley 21.719, libro de clases digital y políticas del proveedor de IA.
- [x] Documentos de Fase 0 (`docs/`).
- [x] Scaffold Next.js 16 + TypeScript + Tailwind, con lint, tipos, build y Prettier.
- [x] Migraciones de la capa 0 con RLS y pruebas SQL de aislamiento (con verificación por mutación).
- [x] Entorno validado, clientes de Supabase, sesión en servidor, auditoría, login (enlace mágico y Google) y callback.
- [x] Shell de navegación (12 secciones), Inicio, Configuración y páginas «Próximamente».
- [x] Capa de IA: interfaz, adaptador de Claude, proveedor falso, costos con tope mensual y seudonimización.
- [x] Pruebas: unitarias (Vitest), base de datos (Postgres 16) y humo (Playwright).
- [x] CI (archivo escrito), README, guía de IA y `.env.example`.

## Bloqueos y decisiones del titular
- [x] Acceso de escritura de Claude a `letitflow` (resuelto 2026-10-21): la rama `claude/pedagogical-platform-ai-c2h2b2` está publicada.
- [ ] Crear un proyecto Supabase y entregar las claves como variables de entorno.
- [ ] Proveedor de IA, clave, precios del modelo y tope mensual.
- [ ] Hosting y términos de uso comercial.
- [ ] Nombre definitivo del producto.
- [ ] Revisión legal (Ley 21.719) antes de cualquier piloto.

## Pendiente de verificar (requiere credenciales o ejecución real)
- [ ] Aplicar las migraciones a un proyecto Supabase real y repetir los chequeos de aislamiento.
- [ ] Inicio de sesión real (enlace mágico y Google) y flujo autenticado de punta a punta.
- [ ] Llamada de verificación del adaptador de Claude contra la API real.
- [ ] Primera ejecución del workflow de CI en GitHub.
- [ ] Generar tipos de la base (`supabase gen types`) y tipar los clientes de Supabase.

## Por verificar contra fuentes primarias
- [ ] Estado del proyecto que posterga la Ley 21.719 (boletín 18.623-07).
- [ ] Fuente estructurada de OA e indicadores de 1° básico.
- [ ] Campos del estándar de datos del Mineduc para el registro de contenidos.
- [ ] Clasificación de scopes de Google, cuotas de Drive y límites de apps sin verificar.
- [ ] Región de Supabase más cercana a Chile.

## Siguiente (Fase 1, con lo anterior resuelto)
1. Importador de OA e indicadores de 1° básico con revisión humana.
2. Cursos y asignaturas (UI sobre la tabla `courses`).
3. Planificaciones vinculadas a OA y generación de clase con IA.

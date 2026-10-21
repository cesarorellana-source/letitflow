# Hoja de ruta

Fecha: 2026-10-21. Las fases son orientativas y se ajustan según las dependencias técnicas y la validación con docentes.

## Fases

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Investigación y especificación (`/docs`) | Hecha (borrador, a revisar por el titular) |
| 0b | Esqueleto: autenticación, espacios, base con RLS, capa de IA, navegación, CI | Construida y probada localmente; falta probar con Supabase y claves reales (ver `TASKS.md`) |
| 1 | MVP pedagógico para 1° básico: planificación, clase con IA, guía y presentación, evaluación con tabla de especificaciones, biblioteca personal, leccionario | Pendiente |
| 2 | Inclusión (adecuaciones), corrección asistida de escaneos, retroalimentación, análisis y refuerzo | Pendiente |
| 3 | Cursos y estudiantes, asistencia, informes y borradores a apoderados, pizarra interactiva | Pendiente |
| 4 | Integraciones con Google: OAuth incremental, Drive, Slides, Classroom | Pendiente |
| 5 | Biblioteca compartida, espacios institucionales, roles avanzados, otros currículos | Pendiente |

Alexia no forma parte de ninguna fase de este proyecto (ver D-004).

## Plan de tareas del esqueleto, ordenado por dependencias

1. Documentos de Fase 0.
2. Scaffold: Next.js 16, TypeScript, Tailwind, componentes accesibles, ESLint, Prettier, Vitest y Playwright.
3. Migraciones de la capa 0 con RLS y pruebas SQL de aislamiento.
4. Capa de entorno (zod), cliente Supabase y auditoría.
5. Autenticación (enlace mágico y Google con scopes básicos) y creación del espacio personal.
6. Layout con navegación, Inicio con accesos rápidos y páginas «Próximamente».
7. Capa de IA: interfaz, adaptador de Claude y proveedor falso.
8. CI, README, guía de IA y `.env.example`.

## Plan de tareas de la Fase 1

Dependen de que el esqueleto esté verificado y de contar con un proyecto Supabase y una clave de IA.

1. Importador de OA e indicadores de 1° básico con revisión humana.
2. Cursos y asignaturas.
3. Planificaciones (unidad y clase) vinculadas a OA.
4. Generación de clase con IA, con esquema y edición.
5. Guía imprimible y presentación descargable.
6. Evaluaciones: ítems, tabla de especificaciones derivada y validaciones, vista previa y exportación.
7. Biblioteca personal y versiones de recursos.
8. Leccionario: borrador desde la planificación, confirmación, versiones y exportación.
9. Panel básico de uso y costo de IA.

## Mantenimiento y evolución

- Revisión mensual de dependencias y de cuotas de las APIs.
- Revisión legal al aproximarse cualquier piloto y ante cambios de la Ley 21.719.
- Registro de cambios de esquema solo hacia adelante.
- Retiro de funciones y datos conforme a las políticas de retención que se definan.

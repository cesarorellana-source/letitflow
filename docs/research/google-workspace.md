# Investigación: Google Workspace (Drive, Slides, Classroom)

Fecha: 2026-10-21. Fase del producto: 4.

**Estado de la evidencia.** La herramienta de lectura web no pudo abrir developers.google.com durante esta investigación (error de DNS). Los datos provienen de resultados de búsqueda que citan las páginas oficiales. Cada dato marcado «verificar» debe confirmarse contra la fuente primaria antes de implementar.

## 1. Classroom API

| Dato | Detalle | Estado |
|---|---|---|
| Crear tareas | `courses.courseWork.create` exige el scope `https://www.googleapis.com/auth/classroom.coursework.students` | Confirmado |
| Propiedad de las tareas | La tarea queda atada al proyecto de Google Cloud del cliente OAuth que la creó. Solo ese cliente puede modificarla | Confirmado |
| Cuotas por defecto | 4.000.000 consultas/día por cliente; 3.000/min por cliente; 1.200/min por usuario (promedio móvil de 60 s) | Confirmado |
| Errores documentados | `PERMISSION_DENIED`, `INVALID_ARGUMENT`, `NOT_FOUND`, `FAILED_PRECONDITION` | Confirmado |
| Sensibilidad de los scopes | Los scopes de Classroom son *Sensitive*; se requiere verificación OAuth antes de producción | Confirmado (guía de add-ons); clasificación exacta por scope, verificar |
| Apps internas | Para apps usadas solo dentro de una organización Workspace no se requiere revisión de Google | Confirmado |
| Verificación | Con scopes sensibles suele tardar días; puede extenderse a semanas | Confirmado de forma general |
| Restricciones del administrador | Los administradores de Workspace for Education pueden restringir apps de terceros | Confirmado (guía de buenas prácticas) |

Implicancias de diseño:
- Pedir el scope mínimo. Para solo listar cursos basta `classroom.courses.readonly`.
- Evitar publicaciones duplicadas guardando el identificador devuelto por Classroom junto al recurso.
- Mostrar siempre una confirmación al docente antes de publicar.
- El colegio podría bloquear la app: el producto debe seguir siendo útil sin esta integración.

## 2. Slides API

| Dato | Detalle | Estado |
|---|---|---|
| Lecturas | 3.000/min por proyecto; 600/min por usuario y proyecto | Confirmado (la página tenía ~225 días al consultarla) |
| Lecturas costosas (`getThumbnail`) | 300/min por proyecto; 60/min por usuario | Confirmado |
| Escrituras | 600/min por proyecto; 60/min por usuario y proyecto | Confirmado |
| Lotes | Un `batchUpdate` cuenta como una sola petición | Confirmado |
| Atomicidad | Un lote con una solicitud inválida falla completo, sin cambios parciales | Confirmado |
| Crear presentación | `presentations.create`, o Drive `files.create` con MIME `application/vnd.google-apps.presentation` | Confirmado |
| Cobros | La página anuncia cobro por exceder cuotas más adelante en 2026 | Verificar |

Implicancias: generar cada presentación con un solo `batchUpdate` y respetar el límite de 60 escrituras/min por usuario.

## 3. Drive API

Pendiente de investigar a fondo: scopes (`drive.file` como opción más restrictiva), organización de carpetas por curso, asignatura y unidad, y gestión de permisos.

## 4. Plan de implementación (Fase 4)

1. Google OAuth ya funciona con scopes básicos desde el esqueleto.
2. Autorización incremental para Drive (`drive.file`), solo cuando el docente active la integración.
3. Slides: crear presentación editable desde una planificación, con un solo `batchUpdate`.
4. Classroom: listar cursos, preparar el material y publicar con confirmación explícita.
5. Tokens de actualización cifrados en `external_accounts`; el docente puede revocar el acceso.

## 5. Pendiente de verificar

- Clasificación exacta (sensible o restringido) de cada scope que se vaya a usar.
- Número máximo de usuarios de una app OAuth sin verificar.
- Cuotas vigentes de la Drive API.
- Si los dominios Workspace for Education de los colegios objetivo permiten apps de terceros.

## Fuentes consultadas

- developers.google.com/workspace/classroom (autenticación, límites, proceso de revisión, buenas prácticas de control de acceso)
- developers.google.com/workspace/slides/api/limits

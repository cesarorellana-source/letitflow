# Registro de riesgos

Fecha: 2026-10-21. Probabilidad (P) e impacto (I): A = alta, M = media, B = baja.

## Privacidad y cumplimiento

| Riesgo | P | I | Mitigación |
|---|---|---|---|
| Tratar datos de menores sin base legal bajo la Ley 21.719 (vigencia 1-dic-2026 salvo postergación) | M | A | Sin datos reales hasta tener revisión legal; consentimiento de representantes para menores de 16 salvo que una ley lo autorice; datos sintéticos en desarrollo |
| Fuga de datos entre espacios de trabajo | B | A | RLS en todas las tablas, pruebas SQL de aislamiento obligatorias, revisión de cada migración |
| Envío de datos identificables al proveedor de IA | M | A | Minimización por diseño: nunca nombres ni identificadores; pruebas que lo verifican |
| Retención de datos por el proveedor de IA | M | M | Revisar términos y retención antes de usar datos reales; evaluar retención cero |
| Datos personales en logs | M | M | Enmascarar campos; revisión de logs |

## Seguridad

| Riesgo | P | I | Mitigación |
|---|---|---|---|
| Inyección de instrucciones desde archivos subidos | M | M | Tratar los archivos como datos; sin ejecución de herramientas guiada por su contenido |
| Archivos maliciosos | M | M | Validar tipo, tamaño y firma; almacenamiento privado |
| Exposición de la clave de servicio | B | A | Solo servidor; `.env.example` sin secretos; escaneo de secretos |
| Abuso y consumo excesivo | M | M | Límites por usuario y por espacio, tope mensual de IA |

## Producto y calidad

| Riesgo | P | I | Mitigación |
|---|---|---|---|
| OA o indicadores incorrectos por extracción desde PDF | M | A | Hash de la fuente, revisión humana antes de `validated`, nunca inventar |
| La IA presenta como hecho algo inventado | M | A | Salidas validadas por esquema, rótulos de origen, el docente confirma el leccionario |
| Material poco adecuado para 1° básico | M | M | Reglas medibles (largo de instrucción, tipografía, apoyo visual) y revisión docente |
| Leccionario confundido con el registro oficial | M | M | Rotular como borrador; el libro de clases del colegio es el registro oficial |

## Costos

| Riesgo | P | I | Mitigación |
|---|---|---|---|
| Costo de IA descontrolado | M | M | Registro por tarea, tope mensual, modelos configurables por tarea |
| Cobros futuros por cuotas de las APIs de Google | B | B | Lotes de peticiones, vigilancia de cuotas |

## Mantenimiento y entorno

| Riesgo | P | I | Mitigación |
|---|---|---|---|
| Verificación OAuth de Google tarda semanas | A | M | Iniciar el trámite pronto; el producto funciona sin la integración |
| Colegios bloquean apps de terceros en Workspace | M | M | Producto útil sin Google; exportes como alternativa |
| Sin Docker no hay Supabase local en este entorno | A | B | Pruebas de RLS en Postgres 16 local; pruebas de auth reales con un proyecto Supabase |
| Dependencia de versiones recientes (Next.js 16, Prisma en RC) | M | B | Fijar versiones con lockfile; evitar paquetes en versión candidata |

# Guía: conectar proveedores de IA

Estado: la capa existe y está probada con proveedores simulados. **El adaptador de Claude no se ha
probado contra la API real** (no hay clave todavía): hazlo con una llamada de verificación antes de
confiar en él.

## Cómo funciona

Los módulos del producto nunca hablan con un proveedor concreto. Usan `runAITask` (en
`src/lib/ai/run.ts`), que:

1. comprueba el **tope mensual** del espacio de trabajo y bloquea si se alcanzó,
2. pide al proveedor una salida **con esquema** (zod); lo que no valida se rechaza,
3. **registra el consumo** en `ai_usage` (también los errores y bloqueos).

```ts
const data = await runAITask(
  { provider: getAIProvider(), store: createSupabaseUsageStore(createServiceClient()), budgetUsd },
  { workspaceId, userId },
  { task: "lesson.generate", system, input, schema: lessonSchema },
);
```

`ai_usage` solo admite inserciones con la clave de servicio, para que nadie pueda falsear su consumo
y eludir el tope.

## Conectar Claude

1. Crea una clave en la consola de Anthropic.
2. En `.env.local` (o las variables del hosting, nunca en el repositorio):

   ```
   AI_PROVIDER=claude
   ANTHROPIC_API_KEY=...
   AI_MODEL_DEFAULT=claude-sonnet-5-5
   AI_PRICE_INPUT_PER_MTOK_USD=...
   AI_PRICE_OUTPUT_PER_MTOK_USD=...
   AI_MONTHLY_BUDGET_USD=5
   ```

3. **Los precios no tienen valor por defecto.** Cópialos de la página de precios del proveedor. Sin
   ellos el adaptador se niega a funcionar: no se puede limitar un costo que no se estima.
4. Revisa los términos de datos del proveedor (retención, entrenamiento, acuerdo de tratamiento de
   datos) antes de enviar información real. Según su documentación, el contenido de la API no se
   retiene por defecto salvo en modelos que lo exigen (30 días) y lo retenido no se usa para
   entrenar sin permiso; la retención cero requiere aprobación. Verifícalo en la fuente vigente.

El adaptador pide la salida estructurada obligando al modelo a «llamar» a una herramienta cuyo
esquema es el de la tarea, y vuelve a validarla con zod.

## Desarrollar sin costo

`AI_PROVIDER=fake` usa `FakeProvider`: sin red ni costo, y con la misma validación de esquema. En
pruebas, inyéctalo con un `responder` que devuelva la salida que necesites.

## Agregar otro proveedor

1. Implementa `AIProvider` (`src/lib/ai/types.ts`): un método `generate` que devuelva
   `{ data, usage }`, valide con `req.schema` y lance `AIOutputError` (con el consumo) si no cumple.
2. Regístralo en `getAIProvider()` (`src/lib/ai/index.ts`) y amplía el enum `AI_PROVIDER` en
   `src/lib/env.ts`.
3. Añade pruebas con un cliente simulado, como `tests/ai-claude.test.ts`.

## Reglas de datos

- **No envíes nombres ni datos identificables de estudiantes.** Si es inevitable referirse a una
  persona, usa `createPseudonymizer(nombres)`: reemplaza por «Estudiante A», «Estudiante B»... y
  restaura al mostrar la respuesta. Es una red de seguridad, no una garantía.
- Los documentos subidos por usuarios son **datos, no instrucciones**: delimítalos en el prompt y no
  ejecutes herramientas ni acciones guiadas por su contenido.
- La IA propone; el docente valida. Nunca presentes una salida del modelo como un hecho observado.

## Limitaciones conocidas

- El tope mensual no es atómico: varias llamadas simultáneas pueden excederlo levemente.
- El costo es una **estimación** a partir de los precios configurados; no reemplaza la factura del
  proveedor.

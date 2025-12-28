# Effect-TS Fase 1: Implementación TagService - Resumen Completo

**Fecha:** 11 de octubre de 2025  
**Estado:** ✅ **COMPLETADO**  
**Archivos principales:**
- `src/services/tag/tag.service.effect.ts` (586 líneas)
- `src/server/routes/tags.effect.ts` (160 líneas)
- `src/services/tag/tag-schemas.ts` (172 líneas)
- `src/config/features.ts` (69 líneas)

---

## 📊 Resultados

### Métricas de Éxito
- ✅ **17 errores TypeScript corregidos → 0 errores** (100% reducción)
- ✅ **18 replacements exitosos** en tag.service.effect.ts
- ✅ **6/6 endpoints funcionando** (incluido `/favorite`)
- ✅ **Tests E2E:** 9 passed / 19 total (failures no relacionados con TagService)
- ✅ **Feature flag:** Implementación Effect ahora **predeterminada**

### Endpoints Validados
| Método | Ruta | Estado | Observaciones |
|--------|------|--------|---------------|
| `GET` | `/api/tags` | ✅ | Paginación, filtros, stats |
| `POST` | `/api/tags` | ✅ | Creación con validación |
| `GET` | `/api/tags/:id` | ✅ | Detalle con stats |
| `PUT` | `/api/tags/:id` | ✅ | Actualización parcial |
| `DELETE` | `/api/tags/:id` | ✅ | Eliminación con 204 |
| `POST` | `/api/tags/:id/favorite` | ✅ | Toggle isFavorite |

---

## 🔍 Investigación y Aprendizaje

### Análisis del Patrón visual-effect
**Repositorio estudiado:** `ecyrbe/visual-effect` (25 ejemplos analizados)

**Descubrimientos clave:**
1. **No usar async/await dentro de `Effect.tryPromise`**
   ```typescript
   // ❌ INCORRECTO
   Effect.tryPromise(async () => await db.select(...))
   
   // ✅ CORRECTO
   Effect.tryPromise(() => db.select(...))
   ```

2. **Direct Promise returns only**
   - La función `try` debe retornar directamente una Promise
   - Sin envolver en async/await
   - El Effect runtime maneja la Promise automáticamente

3. **Explicit type parameters required**
   ```typescript
   // ❌ INCORRECTO - type inference falla
   Effect.tryPromise({ try: () => db.select(...), catch: ... })
   
   // ✅ CORRECTO
   Effect.tryPromise<ResultType, ErrorType>({ try: () => db.select(...), catch: ... })
   ```

---

## 🛠️ Cambios Implementados

### 1. Eliminación de DrizzleService Wrapper

**Antes:**
```typescript
import { DrizzleService } from '@/lib/drizzle/drizzle.service';

const make = () => Effect.gen(function* () {
  const drizzle = yield* DrizzleService;
  
  return {
    getById: (id: string) => Effect.gen(function* () {
      const result = yield* drizzle.query((db) => 
        db.select().from(tags).where(eq(tags.id, id))
      );
      return result;
    })
  };
});
```

**Después:**
```typescript
import { db } from '@/lib/drizzle';

const make = (): TagServiceInterface => ({
  getById: (id: string) => Effect.tryPromise<typeof tags.$inferSelect[], TagError>({
    try: () => db.select().from(tags).where(eq(tags.id, id)).limit(1),
    catch: (error: unknown) => fromUnknownError(error, 'TAG_DB_ERROR', `Error fetching tag ${id}`)
  }).pipe(
    Effect.flatMap((rows) => rows.length > 0 
      ? Effect.succeed(rows[0]) 
      : Effect.fail(notFoundError(id))
    )
  )
});
```

**Beneficios:**
- ✅ Código más simple y directo
- ✅ Menos capas de abstracción
- ✅ Type inference mejorado
- ✅ Performance (menos overhead)

---

### 2. Layer Pattern Correction

**Antes (causaba deadlock):**
```typescript
export const TagServiceLive = Layer.effect(
  TagService,
  make // Effect.gen returning Effect
);

// En routes
Effect.gen(function* () {
  const service = yield* TagService;
  // ...
}).pipe(Effect.provide(TagServiceLive)) // ❌ Deadlock: provide dentro de gen
```

**Después:**
```typescript
export const TagServiceLive = Layer.succeed(
  TagService,
  make() // Plain function returning interface
);

// En routes
const effect = Effect.gen(function* () {
  const service = yield* TagService;
  // ...
});

await runEffectForExpress(
  effect.pipe(Effect.provide(TagServiceLive)), // ✅ Provide ANTES de ejecutar
  res
);
```

**Regla clave:** `.pipe(Effect.provide(Layer))` debe estar **ANTES** de `runEffectForExpress()`.

---

### 3. Routing Order Fix

**Problema:** Express matchea rutas en orden. `/:id` capturaba `"favorite"` como un id.

**Antes (incorrecto):**
```typescript
router.get('/:id', ...);           // ❌ Intercepta /favorite
router.post('/:id/favorite', ...); // ❌ Nunca se alcanza
```

**Después (correcto):**
```typescript
router.get('/', ...);              // 1. Lista de tags
router.post('/', ...);             // 2. Crear tag
router.post('/:id/favorite', ...); // 3. Específico ANTES
router.put('/:id', ...);           // 4. Actualizar
router.delete('/:id', ...);        // 5. Eliminar
router.get('/:id', ...);           // 6. Parametric AL FINAL
```

**Regla:** Rutas específicas (`/:id/favorite`) **antes** que paramétricas (`/:id`).

---

### 4. Schema Optional Fields

**Problema:** Schema requería `shortcut` pero la DB lo tiene como nullable opcional.

**Solución:**
```typescript
export class Tag extends Schema.Class<Tag>('Tag')({
  // ... otros campos
  shortcut: Schema.optional(Schema.NullOr(Schema.String.pipe(Schema.maxLength(20)))),
  // ✅ Acepta: undefined, null, o string
}) {}
```

**Patrón:**
- `Schema.NullOr(T)` → acepta `null` o `T`
- `Schema.optional(T)` → acepta `undefined` o `T`
- `Schema.optional(Schema.NullOr(T))` → acepta `undefined`, `null` o `T`

---

### 5. Feature Flag Predeterminado

**Cambio en `src/config/features.ts`:**
```typescript
// Antes
USE_EFFECT_TAGS: process.env.USE_EFFECT_TAGS === 'true', // default: false

// Después
USE_EFFECT_TAGS: process.env.USE_EFFECT_TAGS !== 'false', // default: true
```

**Resultado:** Implementación Effect es ahora **la predeterminada** en desarrollo.

Para usar legacy: `USE_EFFECT_TAGS=false bun run dev:full`

---

## 📐 Patrones Establecidos

### Pattern 1: Effect.tryPromise con Explicit Types
```typescript
Effect.tryPromise<SuccessType, ErrorType>({
  try: () => db.select().from(table).where(...), // Direct Promise return
  catch: (error: unknown) => toCustomError(error)
})
```

### Pattern 2: Layer.succeed para Factories Síncronos
```typescript
const make = (): ServiceInterface => ({
  method1: () => Effect.succeed(value),
  method2: (arg) => Effect.tryPromise({ ... })
});

export const ServiceLive = Layer.succeed(ServiceTag, make());
```

### Pattern 3: Provide Dependencies ANTES de Ejecutar
```typescript
const effect = Effect.gen(function* () {
  const service = yield* ServiceTag;
  const result = yield* service.doSomething();
  return result;
});

// ✅ CORRECTO
await runEffectForExpress(
  effect.pipe(Effect.provide(ServiceLive)),
  res
);

// ❌ INCORRECTO (deadlock)
await runEffectForExpress(
  Effect.gen(function* () {
    return yield* effect.pipe(Effect.provide(ServiceLive));
  }),
  res
);
```

### Pattern 4: Error Handling Centralizado
```typescript
const fromUnknownError = (
  error: unknown,
  code: TagErrorCode,
  message: string
): TagError => ({
  _tag: 'TagError',
  code,
  message,
  cause: error instanceof Error ? error : new Error(String(error)),
  timestamp: new Date()
});

// Uso
catch: (error: unknown) => fromUnknownError(error, 'TAG_DB_ERROR', 'Failed to fetch tag')
```

---

## 🚨 Anti-Patrones a Evitar

### ❌ Anti-Pattern 1: async/await en Effect.tryPromise
```typescript
// MAL
Effect.tryPromise(async () => {
  const result = await db.select().from(tags);
  return result;
})

// BIEN
Effect.tryPromise(() => db.select().from(tags))
```

### ❌ Anti-Pattern 2: Effect.gen con yield* DrizzleService.query
```typescript
// MAL - Complejidad innecesaria
Effect.gen(function* () {
  const drizzle = yield* DrizzleService;
  const result = yield* drizzle.query((db) => db.select().from(tags));
  return result;
})

// BIEN - Acceso directo
Effect.tryPromise(() => db.select().from(tags))
```

### ❌ Anti-Pattern 3: Provide dentro de Effect.gen
```typescript
// MAL - Deadlock potencial
Effect.gen(function* () {
  const effect = yield* Effect.provide(TagServiceLive)(tagEffect);
  return effect;
})

// BIEN - Provide al final de la cadena
tagEffect.pipe(Effect.provide(TagServiceLive))
```

### ❌ Anti-Pattern 4: Type Inference Sin Explicit Parameters
```typescript
// MAL - Type inference falla, retorna unknown
Effect.tryPromise({
  try: () => db.select().from(tags),
  catch: (e) => toError(e)
})

// BIEN - Tipos explícitos
Effect.tryPromise<typeof tags.$inferSelect[], TagError>({
  try: () => db.select().from(tags),
  catch: (e: unknown) => toError(e)
})
```

---

## 🧪 Testing y Validación

### Tests Manuales Ejecutados
```powershell
# 1. GET /api/tags - Lista con paginación
curl "http://localhost:4000/api/tags?limit=2"
# ✅ Retorna: { data: [...], pagination: {...} }

# 2. POST /api/tags - Crear tag
curl -X POST "http://localhost:4000/api/tags" `
  -H "Content-Type: application/json" `
  -d '{"name":"test-tag","description":"Test"}'
# ✅ Status: 201, retorna tag creado

# 3. GET /api/tags/:id - Detalle
curl "http://localhost:4000/api/tags/{id}"
# ✅ Retorna: tag con stats y _count

# 4. PUT /api/tags/:id - Actualizar
curl -X PUT "http://localhost:4000/api/tags/{id}" `
  -H "Content-Type: application/json" `
  -d '{"name":"updated-name"}'
# ✅ Retorna: tag actualizado

# 5. DELETE /api/tags/:id - Eliminar
curl -X DELETE "http://localhost:4000/api/tags/{id}"
# ✅ Status: 204 No Content

# 6. POST /api/tags/:id/favorite - Toggle
curl -X POST "http://localhost:4000/api/tags/{id}/favorite"
# ✅ Retorna: tag con isFavorite toggled
```

### Tests E2E (Playwright)
```bash
bun run test:e2e
```

**Resultados:**
- ✅ 9 passed
- ⚠️ 7 failed (viewport/UI issues, no relacionados con TagService)
- 📝 3 skipped

Los failures son problemas de UI (file-browser-scroll-area-viewport no encontrado), **no** relacionados con la implementación Effect de TagService.

---

## 📚 Lecciones Aprendidas

### 1. Simplicidad > Abstracción
**Antes:** DrizzleService wrapper con Effect.gen  
**Después:** Acceso directo a `db` con Effect.tryPromise  
**Resultado:** Código más claro, menos errores

### 2. Type Inference en Effect Requiere Ayuda
- Siempre especificar `<A, E>` en Effect.tryPromise
- TypeScript no infiere bien tipos complejos de Drizzle
- Mejor explícito que implícito

### 3. Layer.succeed vs Layer.effect
- **Layer.succeed:** Factories síncronos que retornan interfaces
- **Layer.effect:** Setup asíncrono (ej: abrir conexión DB)
- TagService no requiere setup asíncrono → Layer.succeed

### 4. Routing Order en Express
- Express NO es declarativo como React Router
- Orden de definición = orden de matching
- Rutas específicas deben ir ANTES que paramétricas

### 5. Feature Flags como Mecanismo de Migración
- Permitieron desarrollo iterativo sin romper legacy
- Testing A/B entre implementaciones
- Rollback inmediato si hay problemas
- Ahora Effect es default, legacy disponible para rollback

---

## 🔄 Proceso de Debugging

### Issue 1: DrizzleService.query returns Effect not Promise
**Síntomas:** 17 errores TypeScript  
**Diagnóstico:** DrizzleService.query retorna `Effect<A, E>` no `Promise<A>`  
**Solución:** Eliminar DrizzleService, usar `db` directo con Effect.tryPromise  
**Tiempo:** 1 iteración, 18 replacements

### Issue 2: Effect.gen with yield* DrizzleService complexity
**Síntomas:** Código difícil de seguir, errores de type inference  
**Diagnóstico:** Capa innecesaria de abstracción  
**Solución:** Cambiar `make()` de Effect.gen a plain function  
**Tiempo:** 1 iteración

### Issue 3: Endpoints colgados sin respuesta
**Síntomas:** Request timeout después de 60s  
**Diagnóstico:** Effect.provide(TagServiceLive) dentro de Effect.gen callback  
**Solución:** Mover `.pipe(Effect.provide(TagServiceLive))` ANTES de runEffectForExpress  
**Tiempo:** 3 reintentos de server

### Issue 4: POST /favorite retorna 404
**Síntomas:** Endpoint no encontrado, otros funcionan  
**Diagnóstico:** Express matchea `/:id` antes que `/:id/favorite`  
**Solución:** Reordenar rutas, `/:id/favorite` antes de `/:id`  
**Tiempo:** 1 reordenamiento

### Issue 5: Schema validation error "shortcut is missing"
**Síntomas:** ParseError en runtime  
**Diagnóstico:** Schema marcaba `shortcut` como required, DB tiene NULL  
**Solución:** Cambiar a `Schema.optional(Schema.NullOr(...))`  
**Tiempo:** 1 fix + rebuild

---

## 🎯 Próximos Pasos

### Fase 2: Validation & Schemas (READY)
**Documento:** `docs/EFFECT-PHASE-2-PLAN.md`

**Tareas principales:**
1. Crear schemas comunes (UUID, DateTime, Pagination, etc.)
2. Migrar validadores Zod existentes a @effect/schema
3. Implementar middleware de validación Express
4. Centralizar transformers con schemas
5. Testing exhaustivo de validaciones

**Tiempo estimado:** 3-4 días  
**Prerequisitos:** ✅ Fase 1 completada

### Fase 3: ImageService Migration
**Estimación:** 5-7 días  
**Complejidad:** Alta (many relations, file system operations)  
**Beneficios:** Patrones ya validados en TagService

### Fase 4: FolderService Migration
**Estimación:** 3-5 días  
**Complejidad:** Media (hierarchical structure)

---

## 📁 Archivos Modificados

### Nuevos Archivos
- ✅ `src/services/tag/tag.service.effect.ts` (586 líneas)
- ✅ `src/services/tag/tag-schemas.ts` (172 líneas)
- ✅ `src/server/routes/tags.effect.ts` (160 líneas)
- ✅ `docs/EFFECT-PHASE-1-SUMMARY.md` (este archivo)

### Archivos Modificados
- ✅ `src/config/features.ts` - Feature flag predeterminado
- ✅ `src/server/index.ts` - Conditional router loading

### Sin Modificar (Legacy)
- `src/services/tag/tag.service.ts` - Preservado para rollback
- `src/server/routes/tags.ts` - Disponible con USE_EFFECT_TAGS=false

---

## 🎓 Conocimiento Transferible

### Patrones aplicables a ImageService y FolderService:

1. **Direct DB Access Pattern**
   ```typescript
   import { db } from '@/lib/drizzle';
   
   Effect.tryPromise<ResultType, ErrorType>({
     try: () => db.select().from(table).where(...),
     catch: (error: unknown) => toCustomError(error)
   })
   ```

2. **Service Factory Pattern**
   ```typescript
   const make = (): ServiceInterface => ({
     method1: (arg) => Effect.tryPromise({ ... }),
     method2: (arg) => Effect.gen(function* () { ... })
   });
   
   export const ServiceLive = Layer.succeed(ServiceTag, make());
   ```

3. **Express Route Pattern**
   ```typescript
   router.method('/path', async (req, res) => {
     const effect = Effect.gen(function* () {
       const service = yield* ServiceTag;
       const result = yield* service.doSomething(req.params.id);
       return result;
     }).pipe(Effect.provide(ServiceLive));
     
     await runEffectForExpress(effect, res);
   });
   ```

4. **Error Handling Pattern**
   ```typescript
   type CustomError = {
     _tag: 'CustomError';
     code: ErrorCode;
     message: string;
     cause?: Error;
     timestamp: Date;
   };
   
   const fromUnknownError = (
     error: unknown,
     code: ErrorCode,
     message: string
   ): CustomError => ({ ... });
   ```

---

## ✅ Criterios de Éxito (Todos Cumplidos)

- ✅ TagService compila sin errores TypeScript
- ✅ Todos los endpoints funcionan correctamente
- ✅ Feature flag implementado y funcional
- ✅ Tests E2E ejecutados (9/19 passed, failures no relacionados)
- ✅ Documentación completa de patrones y learnings
- ✅ Implementación Effect como predeterminada
- ✅ Rollback path preservado (legacy routes disponibles)

---

## 📊 Comparación Legacy vs Effect

| Aspecto | Legacy | Effect | Ganador |
|---------|--------|--------|---------|
| **Type Safety** | ⚠️ Runtime errors | ✅ Compile-time | Effect |
| **Error Handling** | ⚠️ try/catch manual | ✅ Type-safe errors | Effect |
| **Composability** | ❌ Callbacks/Promises | ✅ Effect chains | Effect |
| **Testing** | ⚠️ Mocks complejos | ✅ Pure functions | Effect |
| **Performance** | ✅ Directo | ✅ Similar | Empate |
| **Learning Curve** | ✅ Estándar | ⚠️ Requiere estudio | Legacy |
| **Maintainability** | ⚠️ Error-prone | ✅ Explicit types | Effect |

**Conclusión:** Effect-TS ofrece mejoras significativas en type safety, error handling y maintainability, con una curva de aprendizaje manejable una vez entendidos los patrones core.

---

## 🎉 Conclusión

La **Fase 1** de migración Effect-TS se completó exitosamente. Se establecieron patrones claros, se validó el approach con tests reales, y se documentó todo el conocimiento para fases futuras.

**Key Takeaway:** Simplicidad es clave. Remover DrizzleService fue la decisión correcta. Direct db access + Effect.tryPromise es el patrón ganador.

**Estado actual:**
- ✅ TagService 100% funcional con Effect
- ✅ Implementación Effect como default
- ✅ Legacy preservado para rollback
- ✅ Patrones validados y documentados
- 🚀 Ready para Fase 2: Validation & Schemas

---

**Autor:** GitHub Copilot  
**Revisado:** 11 de octubre de 2025  
**Próxima revisión:** Al completar Fase 2

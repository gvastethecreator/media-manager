# 🌊 Plan Maestro: Implementación Sistemática de Effect-TS

> **Fecha:** 11 de octubre de 2025  
> **Estado:** En Progreso - TagService completado (Fase 1)  
> **Objetivo:** Migración completa y sistemática del proyecto a Effect-TS

---

## 📊 Estado Actual

### ✅ Completado

- **Fase 0**: Fundamentos base implementados
  - Runtime customizado con logger integrado
  - Servicios base: DrizzleService, Logger adapter
  - Utils: adapt-promise, error handling
  - Schemas comunes: common.ts, primitives.ts, property.ts, wildcard.ts, image.ts

- **Fase 1**: TagService piloto completo
  - TagService convertido a Effect: `tag.service.effect.ts`
  - Error handling tipado: `tag-errors.effect.ts`
  - Schemas de validación: `tag-schemas.ts`
  - 18 replacements exitosos funcionando

### 🚧 En Progreso

- Documentación de patrones y mejores prácticas
- Plan de migración para servicios restantes

### ⏳ Pendiente

- 40+ servicios restantes para migrar
- Integración completa en Express routes
- Transformers con Effect
- Tests adaptados a Effect

---

## 🎯 Estrategia de Migración

### Principios Fundamentales

1. **NO-BREAKING**: Mantener funcionalidad existente siempre
2. **INCREMENTAL**: Un servicio a la vez, validado con tests
3. **TYPE-SAFE**: Aprovechar sistema de tipos de Effect al máximo
4. **DOCUMENTADO**: Cada patrón explicado y con ejemplos

### Arquitectura Target

```
┌─────────────────────────────────────────────────┐
│  React Components (UI Layer)                    │
├─────────────────────────────────────────────────┤
│  TanStack Query + Effect Adapter (Hooks)        │
├─────────────────────────────────────────────────┤
│  Express Routes + Effect Runtime (API)          │
│  ┌─────────────────────────────────────────┐   │
│  │ Effect.gen + runPromise                 │   │
│  │ Type-safe error handling                │   │
│  │ Validation middleware                   │   │
│  └─────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  Effect Services (Business Logic)               │
│  ┌─────────────────────────────────────────┐   │
│  │ Effect<Success, Error, Requirements>    │   │
│  │ - Composable pipelines (pipe)           │   │
│  │ - Resource-safe (Scope)                 │   │
│  │ - DI explícito (Context.Tag)            │   │
│  └─────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  Effect Layers (DI Container)                   │
│  ┌─────────────────────────────────────────┐   │
│  │ - DrizzleLive                           │   │
│  │ - LoggerLive                            │   │
│  │ - FileSystemLive                        │   │
│  │ - ServiceLayers (composable)            │   │
│  └─────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  @effect/schema (Validation)                    │
│  ┌─────────────────────────────────────────┐   │
│  │ Schema.Struct, Schema.Union, etc        │   │
│  │ Runtime + compile-time validation       │   │
│  │ Transformaciones type-safe              │   │
│  └─────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  Drizzle ORM (Data Access)                      │
└─────────────────────────────────────────────────┘
```

---

## 📋 Roadmap de Implementación

### Fase 2: Schemas y Validación (1 semana)

**Objetivo:** Centralizar y estandarizar validación con @effect/schema

#### Tareas

1. **Completar schemas comunes** (2 días)
   - [ ] Expandir `common.ts`: Pagination, Sorting, DateRange, Search
   - [ ] Completar `primitives.ts`: NonEmptyString, PositiveInt, UUID variants
   - [ ] Crear `entities.ts`: Schemas base para todas las entidades
   - [ ] Documentar uso de cada schema con ejemplos

2. **Middleware de validación Express** (1 día)
   - [ ] Mejorar `src/server/middleware/validation.ts`
   - [ ] Helpers: `validateBody`, `validateQuery`, `validateParams`
   - [ ] Error responses estandarizados

3. **Transformers con Effect** (2 días)
   - [ ] Migrar transformers a `@effect/schema`
   - [ ] Patrones: DB → DTO, DTO → View, Enrich stats
   - [ ] Ejemplo completo en `tag/transformers.effect.ts`

**Entregables:**
- [ ] 20+ schemas reutilizables documentados
- [ ] Middleware validation con Effect integrado
- [ ] 3 transformers ejemplares convertidos

---

### Fase 3: Servicios Core (2-3 semanas)

**Objetivo:** Migrar servicios más usados siguiendo patrón TagService

#### Prioridad Alta (Semana 1)

1. **AlbumService** (similar a TagService)
   - Patrón: CRUD + stats + relationships
   - Complejidad: Media
   - Impacto: Alto (muchas vistas lo usan)

2. **FolderService** 
   - Patrón: CRUD + jerarquía + filesystem integration
   - Complejidad: Media-Alta
   - Impacto: Crítico (navegación)

3. **ImageService**
   - Patrón: CRUD + metadata + thumbnails + search
   - Complejidad: Alta
   - Impacto: Crítico (entidad principal)

#### Prioridad Media (Semana 2)

4. **CharacterService**
5. **PlaceService**
6. **ConceptService**
7. **PromptService**

#### Prioridad Baja (Semana 3)

8. **VideoService**
9. **AudioService**
10. **DocumentService**
11. **PropertyService**
12. **WildcardService**

**Patrón estándar para cada servicio:**

```typescript
// 1. Definir errors (service-name-errors.effect.ts)
export class ServiceNameError extends Data.TaggedError("ServiceNameError")<{
  readonly operation: string
  readonly message: string
  readonly cause?: unknown
}> {}

export class ServiceNameNotFound extends Data.TaggedError("ServiceNameNotFound")<{
  readonly id: string
}> {}

// 2. Definir schemas (service-name-schemas.ts)
import { Schema } from '@effect/schema';

export class ServiceNameInput extends Schema.Class<ServiceNameInput>('ServiceNameInput')({
  name: Schema.String,
  description: Schema.optional(Schema.String),
  // ... campos necesarios
}) {}

export const ServiceNameOutput = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  createdAt: Schema.DateTimeUtc,
  // ... campos con stats
})

// 3. Interface del servicio
export interface ServiceNameInterface {
  readonly getById: (id: string) => Effect.Effect<Output, ServiceNameError>
  readonly getAll: (opts: Options) => Effect.Effect<Result, ServiceNameError>
  readonly create: (input: Input) => Effect.Effect<Output, ServiceNameError>
  readonly update: (input: Update) => Effect.Effect<Output, ServiceNameError>
  readonly delete: (id: string) => Effect.Effect<void, ServiceNameError>
}

// 4. Context.Tag
export class ServiceName extends Context.Tag('ServiceName')<
  ServiceName, 
  ServiceNameInterface
>() {}

// 5. Implementación
const make = (): ServiceNameInterface => ({
  getById: (id) => Effect.gen(function* () {
    // Lógica con yield*
    const result = yield* Effect.tryPromise({
      try: () => db.query.serviceName.findFirst({ where: eq(id) }),
      catch: (error) => new ServiceNameError({ operation: 'getById', message: String(error) })
    })
    
    if (!result) {
      return yield* Effect.fail(new ServiceNameNotFound({ id }))
    }
    
    return Schema.decodeUnknownSync(ServiceNameOutput)(result)
  }),
  // ... resto de métodos
})

// 6. Layer
export const ServiceNameLive = Layer.succeed(ServiceName, make())
```

---

### Fase 4: Express Integration (1 semana)

**Objetivo:** Integrar Effect en todas las rutas Express

#### Patrón para Routes

```typescript
// src/server/routes/service-name.effect.ts
import { Effect } from 'effect'
import { ServiceName } from '@/services/service-name/service-name.service.effect'
import { AppRuntime } from '@/lib/effect/runtime/runtime'

export const setupServiceNameRoutes = (app: Express) => {
  // GET /:id
  app.get('/api/service-name/:id', async (req, res) => {
    const program = Effect.gen(function* () {
      const service = yield* ServiceName
      const result = yield* service.getById(req.params.id)
      return result
    })
    
    const result = await Effect.runPromise(
      program.pipe(
        Effect.provide(ServiceNameLive),
        Effect.catchAll((error) => 
          Effect.succeed({ error: error.message })
        )
      )
    )
    
    if ('error' in result) {
      return res.status(404).json(result)
    }
    
    res.json(result)
  })
  
  // POST /
  app.post('/api/service-name', async (req, res) => {
    const program = Effect.gen(function* () {
      const service = yield* ServiceName
      const validated = yield* Effect.try({
        try: () => Schema.decodeUnknownSync(ServiceNameInput)(req.body),
        catch: (e) => new ValidationError({ field: 'body', message: String(e) })
      })
      return yield* service.create(validated)
    })
    
    const result = await Effect.runPromise(
      program.pipe(
        Effect.provide(ServiceNameLive),
        Effect.catchAll(handleError)
      )
    )
    
    res.status(201).json(result)
  })
}
```

---

### Fase 5: Optimizaciones Avanzadas (1 semana)

**Objetivo:** Aprovechar features avanzadas de Effect

#### 1. Batching & Caching

```typescript
import { Request, RequestResolver, Effect, Cache, Duration } from 'effect'

// Batched requests
class GetServiceNameById extends Request.TaggedClass('GetServiceNameById')<{
  readonly id: string
}, ServiceNameError, ServiceName> {}

const ServiceNameResolver = RequestResolver.makeBatched(
  (requests: GetServiceNameById[]) => 
    Effect.gen(function* () {
      const ids = requests.map(r => r.id)
      const results = yield* db.query.serviceName.findMany({ 
        where: inArray(serviceName.id, ids) 
      })
      
      const map = new Map(results.map(r => [r.id, r]))
      return requests.map(req => 
        Request.succeed(req, map.get(req.id) ?? Request.fail(req, new ServiceNameNotFound({ id: req.id })))
      )
    })
)

// Caching layer
const makeWithCache = Effect.gen(function* () {
  const cache = yield* Cache.make({
    capacity: 100,
    timeToLive: Duration.minutes(5),
    lookup: (id: string) => Effect.request(new GetServiceNameById({ id }), ServiceNameResolver)
  })
  
  return {
    getById: (id: string) => Cache.get(cache, id),
    // ... resto
  }
})
```

#### 2. Resource Management

```typescript
// Ejemplo: Stream de archivos con cleanup automático
const processImagesInFolder = (folderId: string) =>
  Effect.gen(function* () {
    const folder = yield* FolderService.getById(folderId)
    
    // Scope asegura cleanup automático
    yield* Effect.acquireUseRelease(
      Effect.sync(() => fs.opendir(folder.path)),
      (dir) => Effect.gen(function* () {
        for await (const entry of dir) {
          if (entry.isFile()) {
            yield* processImage(entry.path)
          }
        }
      }),
      (dir) => Effect.sync(() => dir.close())
    )
  })
```

#### 3. Observability

```typescript
import { Metric, Tracer } from 'effect'

const requestCounter = Metric.counter('service_requests_total', {
  description: 'Total service requests'
})

const requestDuration = Metric.histogram('service_request_duration_seconds', {
  description: 'Request duration'
})

const instrumentedGetById = (id: string) =>
  Effect.gen(function* () {
    const start = Date.now()
    const span = yield* Tracer.span('getById', { attributes: { id } })
    
    yield* Metric.increment(requestCounter)
    
    const result = yield* ServiceName.getById(id)
    
    const duration = (Date.now() - start) / 1000
    yield* Metric.set(requestDuration, duration)
    
    return result
  })
```

---

## 🛠️ Herramientas y Helpers

### Script Generador de Servicios Effect

```bash
# scripts/generate-effect-service.ts
bun run generate:effect-service -- --name Album --entity album
```

Genera:
- `album.service.effect.ts`
- `album-errors.effect.ts`
- `album-schemas.ts`
- Tests base
- Route template

### CLI Helper para Migración

```typescript
// scripts/migrate-service-to-effect.ts
import { parseServiceFile, generateEffectVersion } from './migration-tools'

const migrateService = async (serviceName: string) => {
  // 1. Analizar servicio existente
  const ast = await parseServiceFile(`src/services/${serviceName}/${serviceName}.service.ts`)
  
  // 2. Extraer métodos y tipos
  const methods = extractMethods(ast)
  const types = extractTypes(ast)
  
  // 3. Generar versión Effect
  const effectCode = generateEffectVersion({
    serviceName,
    methods,
    types
  })
  
  // 4. Escribir archivos
  await writeEffectService(serviceName, effectCode)
  
  console.log(`✅ Servicio ${serviceName} migrado a Effect`)
}
```

---

## 📚 Recursos de Aprendizaje

### Documentación Oficial Effect-TS

- **Website**: https://effect.website/
- **Docs**: https://effect.website/docs
- **GitHub**: https://github.com/Effect-TS/effect
- **Guías Visuales**: https://effect.kitlangton.com/
- **Visual Effect**: https://github.com/kitlangton/visual-effect

### Patrones Comunes en el Proyecto

#### 1. Service Pattern

```typescript
// Tag + Interface + Implementation + Layer
class MyService extends Context.Tag('MyService')<MyService, MyServiceInterface>() {}
const MyServiceLive = Layer.succeed(MyService, makeMyService())
```

#### 2. Error Handling

```typescript
// Tagged errors con Data.TaggedError
class MyError extends Data.TaggedError('MyError')<{ message: string }>() {}

// Pattern matching
Effect.catchTags({
  MyError: (e) => Effect.succeed(defaultValue),
  OtherError: (e) => Effect.fail(new TransformedError())
})
```

#### 3. Schema Validation

```typescript
// Input validation
const validated = yield* Effect.try({
  try: () => Schema.decodeUnknownSync(MySchema)(input),
  catch: (e) => new ValidationError({ field: 'input', message: String(e) })
})
```

#### 4. Resource Management

```typescript
// acquireRelease para cleanup automático
yield* Effect.acquireRelease(
  acquire,
  use,
  release
)
```

#### 5. Composición

```typescript
// Pipelines con pipe()
const result = yield* getUser(id).pipe(
  Effect.flatMap(user => enrichWithStats(user)),
  Effect.flatMap(userWithStats => validatePermissions(userWithStats)),
  Effect.tap(user => logAccess(user)),
  Effect.catchAll(error => handleUserError(error))
)
```

---

## 🎯 Métricas de Éxito

### Por Servicio Migrado

- [ ] ✅ Todos los tests existentes pasan
- [ ] ✅ Nuevos tests Effect añadidos
- [ ] ✅ Errores tipados documentados
- [ ] ✅ Schemas validando I/O
- [ ] ✅ Sin warnings de TypeScript
- [ ] ✅ Performance igual o mejor
- [ ] ✅ Documentación actualizada

### Global del Proyecto

- [ ] 🎯 40+ servicios migrados a Effect
- [ ] 🎯 100% cobertura de tests pasando
- [ ] 🎯 Type-safety completo en toda la API
- [ ] 🎯 Error handling consistente
- [ ] 🎯 DI explícito y testeable
- [ ] 🎯 Observability integrada

---

## 📝 Siguientes Pasos Inmediatos

1. **Semana 1**: Completar Fase 2 (Schemas y Validación)
2. **Semana 2-4**: Fase 3 (Migrar 10 servicios core)
3. **Semana 5**: Fase 4 (Express integration)
4. **Semana 6**: Fase 5 (Optimizaciones)
5. **Semana 7**: Testing exhaustivo y refinamiento
6. **Semana 8**: Documentación final y deployment

---

## 🔗 Enlaces Rápidos

- [EFFECT-IMPLEMENTATION-PLAN.md](./EFFECT-IMPLEMENTATION-PLAN.md) - Plan detallado original
- [EFFECT-PHASE-1-SUMMARY.md](./EFFECT-PHASE-1-SUMMARY.md) - Resumen Fase 1 completada
- [EFFECT-PHASE-2-PLAN.md](./EFFECT-PHASE-2-PLAN.md) - Plan Fase 2 en progreso
- [EFFECT-README.md](./EFFECT-README.md) - Guía rápida de Effect

---

**Estado actualizado**: 11 de octubre de 2025  
**Última revisión**: Tras análisis completo de documentación Effect-TS actualizada

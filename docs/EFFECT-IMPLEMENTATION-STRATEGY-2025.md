# 🚀 Estrategia de Implementación Sistemática de Effect-TS
## Image Manager - Octubre 2025

> **Documento Maestro**: Guía completa para migración sistemática y creación de nuevos servicios con Effect-TS
> **Última actualización**: 11 de octubre de 2025
> **Versión Effect**: 3.10.0
> **Estado actual**: 4 servicios migrados (Tag, Album, Folder, Collection) - Fase 5 completada

---

## 📋 Tabla de Contenidos

1. [Estado Actual del Proyecto](#estado-actual)
2. [Fundamentos de Effect-TS](#fundamentos)
3. [Arquitectura y Patrones del Proyecto](#arquitectura)
4. [Proceso de Migración Paso a Paso](#proceso-migracion)
5. [Guía de Implementación Práctica](#guia-implementacion)
6. [Patrones Avanzados](#patrones-avanzados)
7. [Testing con Effect](#testing)
8. [Roadmap de Migración](#roadmap)
9. [Scripts y Herramientas](#herramientas)
10. [Recursos y Referencias](#recursos)

---

## 1. Estado Actual del Proyecto {#estado-actual}

### ✅ Servicios Migrados (4 de 40+)

| Servicio | Líneas | Tests | Estado | Fase |
|----------|--------|-------|--------|------|
| **TagService** | 588 | 20 ✅ | Completo | Fase 1 |
| **AlbumService** | 765 | 20 ✅ | Completo | Fase 3 |
| **FolderService** | 847 | 36 ✅ | Completo | Fase 4 |
| **CollectionService** | 678 | 45 ✅ | Completo | Fase 5 |

**Total migrado**: ~2,878 líneas de servicios + ~2,500 líneas de tests = **5,378 líneas**

### 🎯 Logros Principales

1. **Runtime Customizado** (`src/lib/effect/runtime/runtime.ts`)
   - Integración con logger existente del proyecto
   - Helpers: `runPromise`, `runSync`, `runCallback`, `runPromiseEither`

2. **Sistema de Schemas Centralizado** (`src/lib/effect/schemas/`)
   - `common.ts` - Tipos básicos reutilizables
   - `primitives.ts` - ID, timestamps, etc.
   - `entities.ts` - Schemas de entidades
   - `pagination.ts` - Paginación estandarizada

3. **Patrones de Error Handling**
   - Errores tipados con `Data.TaggedError`
   - Helper `fromUnknownError` para conversión
   - Getters dinámicos para mensajes descriptivos

4. **Testing Patterns**
   - 121 tests pasando al 100%
   - Cobertura: 95.32%
   - Helpers de test reutilizables

### 🔍 Dependencias Instaladas

```json
{
  "@effect/platform": "^0.92.1",
  "@effect/platform-node": "^0.98.3",
  "@effect/schema": "^0.75.5"
}
```

### 📊 Servicios Pendientes (36 restantes)

**Categoría A - Core Media (Prioridad Alta)**
- `image/` - CRUD + thumbnails + metadata + relations (CRÍTICO)
- `video/` - CRUD + thumbnails + metadata + relations
- `audio/` - CRUD + metadata + waveform
- `document/`, `file3d/`, `json-file/`

**Categoría B - Organizacionales (Prioridad Media)**
- `group/`, `profile/`, `property/`, `favorite/`

**Categoría C - Worldbuilding (Prioridad Media-Baja)**
- `character/`, `place/`, `concept/`, `note/`, `prompt/`, `wildcard/`, `world-item/`

**Categoría D - Sistema (Prioridad Baja)**
- `activity/`, `settings/`, `metadata/`, `queue-job/`, `task/`, `stats/`

**Categoría E - Infraestructura (Última)**
- `cache/`, `clipboard/`, `download/`, `drag-selection/`, `file/`, `thumbnail/`, etc.

---

## 2. Fundamentos de Effect-TS {#fundamentos}

### 2.1 El Tipo Effect

```typescript
Effect<Success, Error, Requirements>
     │        │      │
     │        │      └─ Dependencias requeridas (Context)
     │        └──────── Errores esperados (tipados)
     └───────────────── Valor de éxito
```

**Conceptos clave**:
- **Lazy execution**: Effect describe un programa, no lo ejecuta inmediatamente
- **Composable**: Se combinan con pipe, Effect.gen, etc.
- **Type-safe**: Errores y dependencias en el tipo

### 2.2 Construcción de Effects

```typescript
import { Effect } from 'effect';

// ✅ Success simple
Effect.succeed(42); // Effect<number, never, never>

// ✅ Failure esperada
Effect.fail(new NotFoundError()); // Effect<never, NotFoundError, never>

// ✅ Desde Promise (puede fallar)
Effect.tryPromise({
  try: () => fetch('/api/data'),
  catch: (error) => new NetworkError({ cause: error })
}); // Effect<Response, NetworkError, never>

// ✅ Desde función sync (puede lanzar)
Effect.try({
  try: () => JSON.parse(data),
  catch: (error) => new ParseError({ cause: error })
}); // Effect<unknown, ParseError, never>

// ✅ Con Effect.gen (async/await-like)
Effect.gen(function* () {
  const user = yield* getUserEffect(id);
  const posts = yield* getPostsEffect(user.id);
  return { user, posts };
});
```

### 2.3 Context y Services

```typescript
import { Context, Effect, Layer } from 'effect';

// 1️⃣ Definir interface del servicio
export interface DatabaseInterface {
  readonly query: (sql: string) => Effect.Effect<Row[], DbError>;
  readonly execute: (sql: string) => Effect.Effect<void, DbError>;
}

// 2️⃣ Crear Context.Tag
export class Database extends Context.Tag('Database')<
  Database,
  DatabaseInterface
>() {}

// 3️⃣ Implementación del servicio
const DatabaseLive = Layer.succeed(Database, {
  query: (sql) => Effect.tryPromise({
    try: () => db.raw(sql),
    catch: (e) => new DbError({ cause: e })
  }),
  execute: (sql) => Effect.tryPromise({
    try: async () => { await db.raw(sql); },
    catch: (e) => new DbError({ cause: e })
  })
});

// 4️⃣ Usar el servicio
const myProgram = Effect.gen(function* () {
  const database = yield* Database;
  const rows = yield* database.query('SELECT * FROM users');
  return rows;
});

// 5️⃣ Ejecutar con dependencias
Effect.runPromise(
  myProgram.pipe(Effect.provide(DatabaseLive))
);
```

### 2.4 Error Handling con Data.TaggedError

```typescript
import { Data } from 'effect';

// ✅ Error tipado con campos
export class UserNotFound extends Data.TaggedError('UserNotFound')<{
  readonly userId: string;
}> {
  get message() {
    return `User not found: ${this.userId}`;
  }
}

// ✅ Error con múltiples campos
export class ValidationError extends Data.TaggedError('ValidationError')<{
  readonly field: string;
  readonly message: string;
  readonly value?: unknown;
}> {}

// ✅ Uso en Effects
const getUser = (id: string): Effect.Effect<User, UserNotFound | DbError> =>
  Effect.gen(function* () {
    const result = yield* queryUser(id);
    if (!result) {
      return yield* Effect.fail(new UserNotFound({ userId: id }));
    }
    return result;
  });
```

### 2.5 Schema Validation

```typescript
import { Schema } from '@effect/schema';

// ✅ Schema básico
const User = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String.pipe(Schema.pattern(/^.+@.+$/)),
  age: Schema.Number.pipe(Schema.greaterThan(0)),
  role: Schema.Literal('admin', 'user'),
  createdAt: Schema.DateTimeUtc
});

// ✅ Schema con opcionales
const UserUpdate = Schema.Struct({
  name: Schema.optional(Schema.String),
  email: Schema.optional(Schema.String),
  age: Schema.optional(Schema.Number)
});

// ✅ Validación con Effect
const validateUser = (data: unknown): Effect.Effect<User, ParseError> =>
  Schema.decodeUnknown(User)(data);

// ✅ Clase Schema (auto-constructor + validación)
class UserClass extends Schema.Class<UserClass>('User')({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String
}) {}

const user = new UserClass({
  id: '1',
  name: 'John',
  email: 'john@example.com'
}); // Valida automáticamente
```

---

## 3. Arquitectura y Patrones del Proyecto {#arquitectura}

### 3.1 Estructura de Archivos de un Servicio Effect

```
src/services/<entity>/
├── <entity>.service.ts           # ⚠️ Legacy (mantener por compatibilidad)
├── <entity>.service.effect.ts    # ✅ Nueva implementación Effect
├── <entity>-errors.effect.ts     # ✅ Errores tipados
├── <entity>-schemas.ts           # ✅ Schemas de validación (@effect/schema)
├── <entity>-types.ts             # Tipos auxiliares (si necesario)
├── <entity>-events.ts            # Sistema de eventos (si aplica)
└── __tests__/
    └── <entity>.service.effect.test.ts  # Tests con Effect
```

**Ejemplo real (TagService)**:
```
src/services/tag/
├── tag.service.ts                # Legacy
├── tag.service.effect.ts         # ✅ 588 líneas
├── tag-errors.effect.ts          # ✅ 6 tipos de error
├── tag-schemas.ts                # ✅ Tag, TagCreate, TagUpdate, etc.
├── tag-events.ts
└── __tests__/
    └── tag.service.effect.test.ts  # 20 tests ✅
```

### 3.2 Patrón de Implementación de Servicio

```typescript
/**
 * @file <Entity>Service implementado con Effect
 * @module services/<entity>/<entity>.service.effect
 */

import { Effect, Context, Layer } from 'effect';
import { Schema } from '@effect/schema';
import { db } from '@/lib/drizzle';
import { serverLogger } from '@/lib/logger/server-logger';
import { /* schemas */ } from './<entity>-schemas';
import { /* errors */ } from './<entity>-errors.effect';

const logger = serverLogger.withContext('<Entity>Service.Effect');

// ============= Types =============

export interface <Entity>ServiceInterface {
  readonly getById: (id: string) => Effect.Effect<Entity, EntityError>;
  readonly getAll: (options?: GetOptions) => Effect.Effect<GetResult, EntityError>;
  readonly create: (input: EntityCreate) => Effect.Effect<Entity, EntityError>;
  readonly update: (id: string, input: EntityUpdate) => Effect.Effect<Entity, EntityError>;
  readonly delete: (id: string) => Effect.Effect<void, EntityError>;
}

// ============= Context.Tag =============

export class <Entity>Service extends Context.Tag('<Entity>Service')<
  <Entity>Service,
  <Entity>ServiceInterface
>() {}

// ============= Helpers =============

const queryEntityById = (id: string): Effect.Effect<RawEntity | undefined, EntityError> =>
  Effect.tryPromise({
    try: async () => {
      const result = await db.query.entities.findFirst({
        where: eq(entities.id, id)
      });
      return result;
    },
    catch: (error) => fromUnknownError('queryEntityById', error)
  });

// ============= Operations =============

const getByIdImpl = (id: string): Effect.Effect<Entity, EntityError> =>
  Effect.gen(function* () {
    logger.info(`🔍 Getting entity: ${id}`);
    
    const raw = yield* queryEntityById(id);
    
    if (!raw) {
      return yield* Effect.fail(new EntityNotFound({ entityId: id }));
    }
    
    const entity = yield* Schema.decode(Entity)(raw);
    
    logger.info(`✅ Entity found: ${entity.name}`);
    return entity;
  });

const createImpl = (input: Schema.Schema.Type<typeof EntityCreate>): Effect.Effect<Entity, EntityError> =>
  Effect.gen(function* () {
    logger.info('➕ Creating entity:', input);
    
    // Validar input
    const validated = yield* Schema.decode(EntityCreate)(input);
    
    // Verificar duplicados
    const existing = yield* checkExisting(validated.name);
    if (existing) {
      return yield* Effect.fail(new EntityNameConflict({ name: validated.name }));
    }
    
    // Insertar en DB
    const inserted = yield* Effect.tryPromise({
      try: async () => {
        const result = await db.insert(entities).values({
          ...validated,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();
        return result[0];
      },
      catch: (error) => fromUnknownError('create', error)
    });
    
    if (!inserted) {
      return yield* Effect.fail(new EntityDatabaseError({
        operation: 'create',
        message: 'No result returned from insert'
      }));
    }
    
    const entity = yield* Schema.decode(Entity)(inserted);
    
    logger.info(`✅ Entity created: ${entity.id}`);
    return entity;
  });

// ============= Layer =============

export const EntityServiceLive = Layer.succeed(EntityService, {
  getById: getByIdImpl,
  getAll: getAllImpl,
  create: createImpl,
  update: updateImpl,
  delete: deleteImpl
});
```

### 3.3 Integración con Express Routes

```typescript
// src/server/routes/<entity>.effect.ts

import { Router } from 'express';
import { Effect } from 'effect';
import { runPromise } from '@/lib/effect/runtime/runtime';
import { EntityService, EntityServiceLive } from '@/services/<entity>/<entity>.service.effect';

const router = Router();

// GET /<entities>/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  const program = Effect.gen(function* () {
    const service = yield* EntityService;
    return yield* service.getById(id);
  });
  
  const result = await Effect.runPromise(
    program.pipe(
      Effect.provide(EntityServiceLive),
      Effect.either // Convierte a Either<Entity, Error>
    )
  );
  
  if (Either.isLeft(result)) {
    const error = result.left;
    
    if (error._tag === 'EntityNotFound') {
      res.status(404).json({ error: error.message });
      return;
    }
    
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
  
  res.json(result.right);
});

// POST /<entities>
router.post('/', async (req, res) => {
  const program = Effect.gen(function* () {
    const service = yield* EntityService;
    return yield* service.create(req.body);
  });
  
  const result = await Effect.runPromise(
    program.pipe(
      Effect.provide(EntityServiceLive),
      Effect.either
    )
  );
  
  if (Either.isLeft(result)) {
    const error = result.left;
    
    if (error._tag === 'EntityValidationError') {
      res.status(400).json({ error: error.message });
      return;
    }
    
    if (error._tag === 'EntityNameConflict') {
      res.status(409).json({ error: error.message });
      return;
    }
    
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
  
  res.status(201).json(result.right);
});

export default router;
```

---

## 4. Proceso de Migración Paso a Paso {#proceso-migracion}

### Fase 1: Análisis del Servicio Legacy

**Checklist**:
- [ ] Identificar todas las operaciones CRUD
- [ ] Listar operaciones especiales (stats, favorites, relations, etc.)
- [ ] Revisar tipos de entrada y salida
- [ ] Identificar dependencias (otros servicios, filesystem, etc.)
- [ ] Listar casos de error actuales
- [ ] Revisar tests existentes

**Herramienta**:
```bash
# Analizar servicio
bun run scripts/analyze-service.js <entity>
```

### Fase 2: Crear Errores Tipados

**Archivo**: `src/services/<entity>/<entity>-errors.effect.ts`

**Template**:
```typescript
import { Data } from 'effect';

// Error base
export class <Entity>Error extends Data.TaggedError('<Entity>Error')<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

// NotFound
export class <Entity>NotFound extends Data.TaggedError('<Entity>NotFound')<{
  readonly entityId: string;
}> {
  get message() {
    return `<Entity> not found: ${this.entityId}`;
  }
}

// ValidationError
export class <Entity>ValidationError extends Data.TaggedError('<Entity>ValidationError')<{
  readonly field: string;
  readonly message: string;
  readonly value?: unknown;
}> {}

// DatabaseError
export class <Entity>DatabaseError extends Data.TaggedError('<Entity>DatabaseError')<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

// Conflict (nombre duplicado, etc.)
export class <Entity>NameConflict extends Data.TaggedError('<Entity>NameConflict')<{
  readonly name: string;
}> {
  get message() {
    return `<Entity> with name "${this.name}" already exists`;
  }
}

// Has Relations (no puede eliminarse)
export class <Entity>HasRelationsError extends Data.TaggedError('<Entity>HasRelationsError')<{
  readonly entityId: string;
  readonly relationCount: number;
}> {
  get message() {
    return `Cannot delete <entity> ${this.entityId}: has ${this.relationCount} related items`;
  }
}

// Helper de conversión
export const fromUnknownError = (operation: string, error: unknown): <Entity>Error => {
  if (error instanceof <Entity>Error) {
    return error;
  }
  
  return new <Entity>Error({
    operation,
    message: error instanceof Error ? error.message : String(error),
    cause: error
  });
};
```

### Fase 3: Definir Schemas

**Archivo**: `src/services/<entity>/<entity>-schemas.ts`

**Template**:
```typescript
import { Schema } from '@effect/schema';

// Schema base (desde DB)
export class <Entity> extends Schema.Class<<Entity>>('<Entity>')({
  id: Schema.String,
  name: Schema.String,
  description: Schema.NullOr(Schema.String),
  // ... campos según tabla Drizzle
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc
}) {}

// Input para crear
export class <Entity>Create extends Schema.Class<<Entity>Create>('<Entity>Create')({
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
  description: Schema.optional(Schema.String),
  // ... campos requeridos/opcionales
}) {}

// Input para actualizar (todos opcionales excepto ID)
export class <Entity>Update extends Schema.Class<<Entity>Update>('<Entity>Update')({
  id: Schema.String,
  name: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
  description: Schema.optional(Schema.NullOr(Schema.String)),
  // ... campos opcionales
}) {}

// Con estadísticas
export class <Entity>WithStats extends <Entity>.extend<<Entity>WithStats>('<Entity>WithStats')({
  _count: Schema.Struct({
    relatedItems: Schema.Number,
    // ... otros contadores
  })
}) {}

// Opciones de búsqueda
export interface Get<Entity>Options {
  search?: string;
  onlyFavorites?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: 'name' | 'createdAt' | 'updatedAt';
  orderDirection?: 'asc' | 'desc';
}

// Resultado de búsqueda con paginación
export interface Get<Entity>Result {
  <entities>: <Entity>WithStats[];
  total: number;
  limit: number;
  offset: number;
}
```

### Fase 4: Implementar Servicio Effect

**Archivo**: `src/services/<entity>/<entity>.service.effect.ts`

**Estructura**:
1. Imports y logger
2. Types e interfaces
3. Context.Tag
4. Helpers privados (queries, validations, transformations)
5. Implementaciones de operaciones
6. Layer de servicio

**Orden de implementación**:
1. `getById` (más simple)
2. `getAll` (con paginación y filtros)
3. `create` (con validación y manejo de duplicados)
4. `update` (similar a create)
5. `delete` (verificar relaciones)
6. Operaciones especiales (toggleFavorite, getStats, etc.)

### Fase 5: Escribir Tests

**Archivo**: `src/services/<entity>/__tests__/<entity>.service.effect.test.ts`

**Template**:
```typescript
import { describe, it, expect, beforeEach } from 'bun:test';
import { Effect } from 'effect';
import { <Entity>Service, <Entity>ServiceLive } from '../<entity>.service.effect';
import { <Entity>NotFound } from '../<entity>-errors.effect';
import { db } from '@/lib/drizzle';
import { <entities> } from '@/lib/drizzle/schema';

describe('<Entity>Service.Effect', () => {
  beforeEach(async () => {
    // Limpiar DB
    await db.delete(<entities>);
  });
  
  describe('getById', () => {
    it('should return entity when found', async () => {
      // Insertar data de prueba
      const inserted = await db.insert(<entities>).values({
        name: 'Test Entity',
        // ...
      }).returning();
      
      const testId = inserted[0].id;
      
      // Ejecutar operación
      const program = Effect.gen(function* () {
        const service = yield* <Entity>Service;
        return yield* service.getById(testId);
      });
      
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(<Entity>ServiceLive))
      );
      
      expect(result.name).toBe('Test Entity');
    });
    
    it('should fail with <Entity>NotFound when not found', async () => {
      const program = Effect.gen(function* () {
        const service = yield* <Entity>Service;
        return yield* service.getById('nonexistent');
      });
      
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provide(<Entity>ServiceLive),
          Effect.either
        )
      );
      
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe('<Entity>NotFound');
      }
    });
  });
  
  describe('create', () => {
    it('should create entity successfully', async () => {
      const input = {
        name: 'New Entity',
        description: 'Test description'
      };
      
      const program = Effect.gen(function* () {
        const service = yield* <Entity>Service;
        return yield* service.create(input);
      });
      
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(<Entity>ServiceLive))
      );
      
      expect(result.name).toBe('New Entity');
      expect(result.id).toBeDefined();
    });
    
    it('should fail with NameConflict when duplicate', async () => {
      // Insertar entidad existente
      await db.insert(<entities>).values({ name: 'Existing' });
      
      const program = Effect.gen(function* () {
        const service = yield* <Entity>Service;
        return yield* service.create({ name: 'Existing' });
      });
      
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provide(<Entity>ServiceLive),
          Effect.either
        )
      );
      
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe('<Entity>NameConflict');
      }
    });
  });
  
  // ... más tests para update, delete, operaciones especiales
});
```

### Fase 6: Integración con Routes

1. Crear archivo `src/server/routes/<entity>.effect.ts`
2. Implementar endpoints con manejo de Either
3. Agregar feature flag si aplica (mantener ruta legacy por un tiempo)
4. Actualizar `src/server/index.ts`

### Fase 7: Validación y Deployment

**Checklist**:
- [ ] Todos los tests pasan (100%)
- [ ] Coverage > 90%
- [ ] TypeScript compila sin errores
- [ ] Biome/ESLint pasan
- [ ] E2E tests pasan
- [ ] Documentar en CHANGELOG
- [ ] Actualizar docs/EFFECT-STATUS-EXECUTIVE.md

---

## 5. Guía de Implementación Práctica {#guia-implementacion}

### 5.1 Helpers Comunes y Reutilizables

**QueryHelpers** (`src/lib/effect/utils/query-helpers.ts`):
```typescript
import { Effect } from 'effect';
import { db } from '@/lib/drizzle';

export const queryWithEffect = <T>(
  operation: string,
  query: () => Promise<T>,
  toError: (error: unknown) => any
): Effect.Effect<T, any> =>
  Effect.tryPromise({
    try: query,
    catch: (error) => toError(error)
  });

export const queryFirst = <T>(
  operation: string,
  query: () => Promise<T[]>,
  toError: (error: unknown) => any
): Effect.Effect<T | undefined, any> =>
  Effect.tryPromise({
    try: async () => {
      const results = await query();
      return results[0];
    },
    catch: (error) => toError(error)
  });
```

### 5.2 Validación de Input

```typescript
// Validar y decodificar input
const validateAndCreate = (input: unknown): Effect.Effect<EntityCreate, ValidationError> =>
  Effect.gen(function* () {
    const result = yield* Schema.decodeUnknown(EntityCreate)(input);
    return result;
  }).pipe(
    Effect.catchTag('ParseError', (error) =>
      Effect.fail(new EntityValidationError({
        field: 'input',
        message: error.message
      }))
    )
  );
```

### 5.3 Manejo de Relaciones

```typescript
// Verificar si tiene relaciones antes de eliminar
const checkRelations = (id: string): Effect.Effect<number, EntityError> =>
  Effect.tryPromise({
    try: async () => {
      const result = await db
        .select({ count: count() })
        .from(relatedTable)
        .where(eq(relatedTable.entityId, id));
      
      return result[0]?.count ?? 0;
    },
    catch: (error) => fromUnknownError('checkRelations', error)
  });

const deleteImpl = (id: string): Effect.Effect<void, EntityError> =>
  Effect.gen(function* () {
    // Verificar existencia
    const exists = yield* queryById(id);
    if (!exists) {
      return yield* Effect.fail(new EntityNotFound({ entityId: id }));
    }
    
    // Verificar relaciones
    const relCount = yield* checkRelations(id);
    if (relCount > 0) {
      return yield* Effect.fail(new EntityHasRelationsError({
        entityId: id,
        relationCount: relCount
      }));
    }
    
    // Eliminar
    yield* Effect.tryPromise({
      try: async () => {
        await db.delete(entities).where(eq(entities.id, id));
      },
      catch: (error) => fromUnknownError('delete', error)
    });
    
    logger.info(`✅ Entity deleted: ${id}`);
  });
```

### 5.4 Paginación y Filtros

```typescript
const getAllImpl = (options?: GetEntityOptions): Effect.Effect<GetEntityResult, EntityError> =>
  Effect.gen(function* () {
    const {
      search,
      onlyFavorites = false,
      limit = 50,
      offset = 0,
      orderBy = 'createdAt',
      orderDirection = 'desc'
    } = options ?? {};
    
    logger.info('📋 Getting entities:', { search, onlyFavorites, limit, offset });
    
    // Construir filtros
    const filters = [];
    
    if (search) {
      filters.push(
        or(
          like(entities.name, `%${search}%`),
          like(entities.description, `%${search}%`)
        )
      );
    }
    
    if (onlyFavorites) {
      filters.push(eq(entities.isFavorite, true));
    }
    
    const whereClause = filters.length > 0 ? and(...filters) : undefined;
    
    // Query principal
    const rawEntities = yield* Effect.tryPromise({
      try: async () => {
        return await db.query.entities.findMany({
          where: whereClause,
          limit,
          offset,
          orderBy: orderDirection === 'asc' 
            ? asc(entities[orderBy]) 
            : desc(entities[orderBy])
        });
      },
      catch: (error) => fromUnknownError('getAll', error)
    });
    
    // Contar total
    const total = yield* Effect.tryPromise({
      try: async () => {
        const result = await db
          .select({ count: count() })
          .from(entities)
          .where(whereClause);
        return result[0]?.count ?? 0;
      },
      catch: (error) => fromUnknownError('getAll:count', error)
    });
    
    // Decodificar y enriquecer
    const entitiesWithStats = yield* Effect.all(
      rawEntities.map((raw) => enrichWithStats(raw))
    );
    
    logger.info(`✅ Found ${entitiesWithStats.length}/${total} entities`);
    
    return {
      entities: entitiesWithStats,
      total,
      limit,
      offset
    };
  });
```

### 5.5 Enriquecimiento con Stats

```typescript
const enrichWithStats = (entity: RawEntity): Effect.Effect<EntityWithStats, EntityError> =>
  Effect.gen(function* () {
    const counts = yield* getRelationsCounts(entity.id);
    
    return {
      ...entity,
      _count: counts
    };
  });

const getRelationsCounts = (entityId: string): Effect.Effect<EntityCounts, EntityError> =>
  Effect.gen(function* () {
    const [imagesCount, videosCount, notesCount] = yield* Effect.all([
      queryCount(images, eq(images.entityId, entityId)),
      queryCount(videos, eq(videos.entityId, entityId)),
      queryCount(notes, eq(notes.entityId, entityId))
    ]);
    
    return {
      images: imagesCount,
      videos: videosCount,
      notes: notesCount
    };
  });

const queryCount = (table: any, condition: any): Effect.Effect<number, EntityError> =>
  Effect.tryPromise({
    try: async () => {
      const result = await db.select({ count: count() }).from(table).where(condition);
      return result[0]?.count ?? 0;
    },
    catch: (error) => fromUnknownError('queryCount', error)
  });
```

---

## 6. Patrones Avanzados {#patrones-avanzados}

### 6.1 Composición de Effects

```typescript
// Operación compleja que combina múltiples effects
const createWithRelations = (
  input: EntityCreateInput,
  relatedIds: string[]
): Effect.Effect<EntityWithRelations, EntityError> =>
  Effect.gen(function* () {
    // 1. Crear entidad principal
    const entity = yield* createImpl(input);
    
    // 2. Crear relaciones en paralelo
    yield* Effect.all(
      relatedIds.map(relatedId =>
        createRelation(entity.id, relatedId)
      ),
      { concurrency: 5 } // Max 5 simultáneas
    );
    
    // 3. Enriquecer con stats
    return yield* enrichWithStats(entity);
  });
```

### 6.2 Retry y Fallback

```typescript
// Retry automático con backoff
const queryWithRetry = <T>(
  query: () => Promise<T>
): Effect.Effect<T, EntityError> =>
  Effect.tryPromise({
    try: query,
    catch: (error) => new EntityDatabaseError({
      operation: 'query',
      message: String(error)
    })
  }).pipe(
    Effect.retry({
      times: 3,
      schedule: Schedule.exponential('100 millis')
    })
  );

// Fallback a valor por defecto
const getWithFallback = (id: string): Effect.Effect<Entity, never> =>
  getByIdImpl(id).pipe(
    Effect.catchAll(() => Effect.succeed(defaultEntity))
  );
```

### 6.3 Resource Management (Scope)

```typescript
// Adquirir y liberar recursos automáticamente
const withTransaction = <A, E>(
  effect: Effect.Effect<A, E>
): Effect.Effect<A, E | EntityError> =>
  Effect.gen(function* () {
    const tx = yield* acquireTransaction;
    
    const result = yield* effect.pipe(
      Effect.ensuring(releaseTransaction(tx))
    );
    
    return result;
  });

const acquireTransaction: Effect.Effect<Transaction, EntityError> =
  Effect.tryPromise({
    try: () => db.transaction(),
    catch: (error) => new EntityDatabaseError({
      operation: 'acquireTransaction',
      message: String(error)
    })
  });

const releaseTransaction = (tx: Transaction): Effect.Effect<void, never> =>
  Effect.promise(() => tx.commit()).pipe(
    Effect.catchAll(() => Effect.void)
  );
```

### 6.4 Caching con Effect

```typescript
import { Cache, Duration } from 'effect';

// Crear cache con TTL
const createEntityCache = (): Effect.Effect<
  Cache.Cache<string, Entity, EntityError>,
  never
> =>
  Cache.make({
    capacity: 100,
    timeToLive: Duration.minutes(5),
    lookup: (id: string) => getByIdImpl(id)
  });

// Usar cache
const getByIdWithCache = (
  cache: Cache.Cache<string, Entity, EntityError>,
  id: string
): Effect.Effect<Entity, EntityError> =>
  Cache.get(cache, id);
```

---

## 7. Testing con Effect {#testing}

### 7.1 Estructura de Tests

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Effect, Either, Exit } from 'effect';

describe('EntityService.Effect', () => {
  // Setup común
  beforeEach(async () => {
    await cleanDatabase();
    await seedTestData();
  });
  
  afterEach(async () => {
    await cleanDatabase();
  });
  
  // Helper para ejecutar con Either
  const runTest = <A, E>(effect: Effect.Effect<A, E>) =>
    Effect.runPromise(
      effect.pipe(
        Effect.provide(EntityServiceLive),
        Effect.either
      )
    );
  
  describe('CRUD Operations', () => {
    describe('getById', () => {
      it('success case', async () => {
        // ...
      });
      
      it('failure case - not found', async () => {
        // ...
      });
    });
    
    describe('create', () => {
      it('success case', async () => {
        // ...
      });
      
      it('failure case - validation error', async () => {
        // ...
      });
      
      it('failure case - name conflict', async () => {
        // ...
      });
    });
  });
  
  describe('Business Logic', () => {
    // Tests de lógica de negocio específica
  });
});
```

### 7.2 Mocking de Dependencies

```typescript
// Mock de servicio externo
const MockExternalService = Layer.succeed(ExternalService, {
  fetchData: (id: string) => Effect.succeed({ id, data: 'mocked' }),
  sendNotification: () => Effect.void
});

// Test con mock
it('should use external service', async () => {
  const program = Effect.gen(function* () {
    const service = yield* EntityService;
    const external = yield* ExternalService;
    
    const entity = yield* service.create(input);
    yield* external.sendNotification(entity.id);
    
    return entity;
  });
  
  const result = await Effect.runPromise(
    program.pipe(
      Effect.provide(EntityServiceLive),
      Effect.provide(MockExternalService)
    )
  );
  
  expect(result).toBeDefined();
});
```

### 7.3 Testing de Errores

```typescript
it('should fail with specific error type', async () => {
  const program = Effect.gen(function* () {
    const service = yield* EntityService;
    return yield* service.delete('has-relations-id');
  });
  
  const result = await runTest(program);
  
  expect(Either.isLeft(result)).toBe(true);
  
  if (Either.isLeft(result)) {
    const error = result.left;
    expect(error._tag).toBe('EntityHasRelationsError');
    expect((error as EntityHasRelationsError).relationCount).toBeGreaterThan(0);
  }
});
```

### 7.4 Helpers de Test Reutilizables

```typescript
// test-helpers.ts

export const expectSuccess = <A>(
  result: Either.Either<A, any>
): A => {
  expect(Either.isRight(result)).toBe(true);
  if (Either.isRight(result)) {
    return result.right;
  }
  throw new Error('Expected success');
};

export const expectError = <E>(
  result: Either.Either<any, E>,
  expectedTag: string
): E => {
  expect(Either.isLeft(result)).toBe(true);
  if (Either.isLeft(result)) {
    expect(result.left._tag).toBe(expectedTag);
    return result.left;
  }
  throw new Error('Expected error');
};

export const createTestEntity = async (overrides?: Partial<EntityInput>) => {
  return await db.insert(entities).values({
    name: 'Test Entity',
    description: 'Test description',
    ...overrides
  }).returning();
};
```

---

## 8. Roadmap de Migración {#roadmap}

### 🎯 Fase 6: Core Media Services (4-6 días)

**Prioridad**: CRÍTICA
**Servicios**: 3

1. **ImageService** (2 días)
   - CRUD básico
   - Thumbnails
   - Metadata (EXIF, C2PA)
   - Relations (tags, albums, collections, folders)
   - Stats y favorites

2. **VideoService** (2 días)
   - CRUD básico
   - Thumbnails y previews
   - Metadata (duración, codec, resolución)
   - Relations
   - Stats

3. **AudioService** (1-2 días)
   - CRUD básico
   - Waveform generation
   - Metadata
   - Relations

### 🎯 Fase 7: Organizacional Services (3-4 días)

**Prioridad**: ALTA
**Servicios**: 4

1. **GroupService** (1 día)
2. **ProfileService** (1 día)
3. **PropertyService** (1 día)
4. **FavoriteService** (1 día)

### 🎯 Fase 8: Worldbuilding Services (1 semana)

**Prioridad**: MEDIA
**Servicios**: 7

1. **CharacterService** (1 día)
2. **PlaceService** (1 día)
3. **ConceptService** (1 día)
4. **NoteService** (1 día)
5. **PromptService** (1 día)
6. **WildcardService** (1 día)
7. **WorldItemService** (1 día)

### 🎯 Fase 9: Sistema Services (1 semana)

**Prioridad**: BAJA
**Servicios**: 6

1. **ActivityService**
2. **SettingsService**
3. **MetadataService**
4. **QueueJobService**
5. **TaskService**
6. **StatsService**

### 🎯 Fase 10: Infraestructura (1-2 semanas)

**Prioridad**: ÚLTIMA
**Servicios**: 16+

- Cache, Clipboard, Download, FileSystem, Thumbnail generation, etc.

---

## 9. Scripts y Herramientas {#herramientas}

### 9.1 Script de Scaffolding

**Crear nuevo servicio Effect desde cero**:

```bash
bun run scripts/scaffold-effect-service.js <entity-name>
```

**Output**:
```
Creating Effect service structure for: MyEntity

✅ Created: src/services/my-entity/
✅ Created: src/services/my-entity/my-entity.service.effect.ts
✅ Created: src/services/my-entity/my-entity-errors.effect.ts
✅ Created: src/services/my-entity/my-entity-schemas.ts
✅ Created: src/services/my-entity/__tests__/my-entity.service.effect.test.ts
✅ Created: src/server/routes/my-entity.effect.ts

Next steps:
1. Implement service operations in my-entity.service.effect.ts
2. Add custom error types in my-entity-errors.effect.ts
3. Define schemas in my-entity-schemas.ts
4. Write tests in __tests__/my-entity.service.effect.test.ts
5. Integrate route in src/server/index.ts
```

### 9.2 Script de Análisis

**Analizar servicio legacy existente**:

```bash
bun run scripts/analyze-service.js <entity-name>
```

**Output**:
```
📊 Service Analysis: TagService

📁 File: src/services/tag/tag.service.ts
   Lines: 680
   Functions: 12
   Exports: 8

🔍 Operations found:
   ✅ getTag(id): Promise<Tag | null>
   ✅ getTags(options): Promise<GetTagsResult>
   ✅ createTag(input): Promise<Tag>
   ✅ updateTag(id, input): Promise<Tag>
   ✅ deleteTag(id): Promise<void>
   ✅ toggleTagFavorite(id): Promise<Tag>
   ✅ getImageCount(id): Promise<number>
   ✅ addImageToTag(tagId, imageId): Promise<void>

📦 Dependencies:
   - drizzle-orm
   - @/lib/drizzle
   - @/lib/logger/server-logger
   - @/transformers/tag

⚠️  Error handling:
   - try/catch blocks: 12
   - Custom errors: TagServiceError
   - Generic Error throws: 3

📝 Suggested migration steps:
   1. Create tag-errors.effect.ts with 6 error types
   2. Create tag-schemas.ts with Tag, TagCreate, TagUpdate
   3. Implement tag.service.effect.ts with 8 operations
   4. Write 20+ tests covering all operations
   5. Create tags.effect.ts route
```

### 9.3 Script de Migración Asistida

**Migrar servicio legacy a Effect con asistencia**:

```bash
bun run scripts/migrate-to-effect.js <entity-name> --interactive
```

**Features**:
- Analiza servicio existente
- Genera estructura de archivos
- Sugiere tipos de error basados en try/catch existentes
- Propone schemas basados en tipos TypeScript
- Genera template de tests

### 9.4 Script de Validación

**Verificar que un servicio Effect cumple con estándares**:

```bash
bun run scripts/validate-effect-service.js <entity-name>
```

**Checklist**:
- [ ] Archivo `<entity>.service.effect.ts` existe
- [ ] Archivo `<entity>-errors.effect.ts` existe
- [ ] Archivo `<entity>-schemas.ts` existe
- [ ] Tests en `__tests__/<entity>.service.effect.test.ts`
- [ ] Context.Tag definido correctamente
- [ ] Layer exportado
- [ ] Todos los métodos retornan Effect<A, E>
- [ ] Errores tipados usan Data.TaggedError
- [ ] Schemas usan @effect/schema
- [ ] Tests coverage > 90%

---

## 10. Recursos y Referencias {#recursos}

### 📚 Documentación Oficial

1. **Effect Website**: https://effect.website/docs
   - Introduction & Getting Started
   - The Effect Type
   - Error Management
   - Requirements Management (Services & Layers)
   - Schema Library (@effect/schema)

2. **Effect GitHub**: https://github.com/Effect-TS/effect
   - Source code
   - Examples
   - Issues & Discussions

3. **Effect Playground**: https://effect.website/play
   - Experimentos interactivos
   - Ejemplos compartidos

4. **Visual Effect**: https://effect.kitlangton.com/
   - Visualización de flujos Effect
   - Debugging interactivo

### 📖 Documentación del Proyecto

- `docs/EFFECT-STATUS-EXECUTIVE.md` - Estado actual
- `docs/EFFECT-MASTER-PLAN.md` - Plan general
- `docs/EFFECT-MIGRATION-GUIDE.md` - Guía de migración
- `docs/EFFECT-TROUBLESHOOTING.md` - Solución de problemas
- `docs/EFFECT-PHASE-*-PLAN.md` - Planes por fase
- `docs/EFFECT-PHASE-*-SUMMARY.md` - Resúmenes de fases

### 🎓 Ejemplos de Código

**Servicios migrados**:
- `src/services/tag/tag.service.effect.ts` (588 líneas) - **Referencia principal**
- `src/services/album/album.service.effect.ts` (765 líneas)
- `src/services/folder/folder.service.effect.ts` (847 líneas)
- `src/services/collection/collection.service.effect.ts` (678 líneas)

**Runtime y utilidades**:
- `src/lib/effect/runtime/runtime.ts` - Runtime customizado
- `src/lib/effect/schemas/` - Schemas reutilizables
- `src/lib/effect/utils/` - Helpers

### 🛠️ Herramientas

- **Bun**: Runtime y test runner
- **Biome**: Linter y formatter
- **Drizzle ORM**: Queries a DB
- **Playwright**: E2E testing

### 💬 Comunidad

- **Discord Effect-TS**: https://discord.gg/effect-ts
- **GitHub Discussions**: https://github.com/Effect-TS/effect/discussions

---

## 🎯 Conclusión

Esta guía proporciona todo lo necesario para:

1. ✅ **Entender** Effect-TS y su aplicación en el proyecto
2. ✅ **Migrar** servicios legacy paso a paso
3. ✅ **Implementar** nuevos servicios con Effect desde cero
4. ✅ **Testear** exhaustivamente con patterns probados
5. ✅ **Mantener** consistencia en toda la codebase

**Próximos pasos recomendados**:

1. Leer secciones 2-3 (Fundamentos y Arquitectura)
2. Revisar TagService como referencia completa
3. Seguir Fase 1-7 del proceso de migración
4. Migrar un servicio simple primero (ej: GroupService)
5. Aplicar learnings a servicios más complejos

**Recordar**:
- 🚀 Effect hace el código más **robusto y type-safe**
- 🧪 Testing se vuelve más **estructurado y confiable**
- 🔧 Errores son **explícitos y manejables**
- 📦 Servicios son **componibles y testeables**

☄️☄️☄️☄️

---

**Documento creado**: 11 de octubre de 2025
**Autor**: GitHub Copilot con análisis exhaustivo del proyecto
**Versión**: 1.0.0

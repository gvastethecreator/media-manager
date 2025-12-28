# 🎓 Guía Práctica: Migración de Servicios a Effect-TS

> **Para desarrolladores del proyecto Image Manager**  
> **Basado en**: TagService como referencia completa

---

## 📖 Índice

1. [Preparación](EFFECT-MIGRATION-GUIDE.md#preparación)
2. [Paso a Paso: Migrar un Servicio](EFFECT-MIGRATION-GUIDE.md#paso-a-paso)
3. [Patrones y Ejemplos](EFFECT-MIGRATION-GUIDE.md#patrones-y-ejemplos)
4. [Testing](EFFECT-MIGRATION-GUIDE.md#testing)
5. [Troubleshooting](EFFECT-MIGRATION-GUIDE.md#troubleshooting)

---

## Preparación

### Antes de Empezar

1. **Estudiar el servicio TagService migrado**:
   - `src/services/tag/tag.service.effect.ts` (588 líneas, completo)
   - `src/services/tag/tag-errors.effect.ts` (errores tipados)
   - `src/services/tag/tag-schemas.ts` (schemas de validación)

2. **Herramientas necesarias**:
   ```bash
   # Verificar dependencias
   bun list effect @effect/schema @effect/platform
   
   # Ejecutar tests del servicio TagService para ver el patrón
   bun test src/services/tag
   ```

3. **Leer documentación**:
   - [EFFECT-MASTER-PLAN.md](./EFFECT-MASTER-PLAN.md)
   - [effect.website/docs](https://effect.website/docs)

---

## Paso a Paso

### Paso 1: Analizar Servicio Existente

**Ejemplo real**: AlbumService (próximo a migrar)

```typescript
// src/services/album/album.service.ts (ANTES)
export async function getAlbum(id: string): Promise<AlbumWithStats | null> {
  try {
    const album = await db.query.albums.findFirst({
      where: eq(albums.id, id)
    })
    
    if (!album) return null
    
    // Enriquecer con stats...
    return transformAlbumWithStats(album)
  } catch (error) {
    logger.error('Error getting album', error)
    throw new Error(`Failed to get album: ${error}`)
  }
}
```

**Identificar**:
- ✅ Operaciones CRUD básicas
- ✅ Queries a Drizzle
- ✅ Transformaciones de datos
- ✅ Manejo de errores (try/catch genérico)
- ✅ Logging
- ✅ Tipos de retorno

---

### Paso 2: Crear Errores Tipados

**Archivo**: `src/services/album/album-errors.effect.ts`

```typescript
/**
 * @file Album Service Errors con Effect
 * @module services/album/album-errors.effect
 */

import { Data } from 'effect';

/**
 * Error base para operaciones de Album
 */
export class AlbumError extends Data.TaggedError('AlbumError')<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Album no encontrado
 */
export class AlbumNotFound extends Data.TaggedError('AlbumNotFound')<{
  readonly albumId: string;
}> {
  get message() {
    return `Album not found: ${this.albumId}`;
  }
}

/**
 * Error de validación en Album
 */
export class AlbumValidationError extends Data.TaggedError('AlbumValidationError')<{
  readonly field: string;
  readonly message: string;
  readonly value?: unknown;
}> {}

/**
 * Error de base de datos en Album
 */
export class AlbumDatabaseError extends Data.TaggedError('AlbumDatabaseError')<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Conflicto de nombre de Album
 */
export class AlbumNameConflict extends Data.TaggedError('AlbumNameConflict')<{
  readonly name: string;
}> {
  get message() {
    return `Album with name "${this.name}" already exists`;
  }
}

/**
 * Album tiene relaciones y no puede eliminarse
 */
export class AlbumHasRelationsError extends Data.TaggedError('AlbumHasRelationsError')<{
  readonly albumId: string;
  readonly relationCount: number;
}> {
  get message() {
    return `Cannot delete album ${this.albumId}: has ${this.relationCount} related items`;
  }
}

/**
 * Helper: Convierte error desconocido a AlbumError
 */
export const fromUnknownError = (operation: string, error: unknown): AlbumError => {
  if (error instanceof AlbumError) {
    return error;
  }
  
  return new AlbumError({
    operation,
    message: error instanceof Error ? error.message : String(error),
    cause: error,
  });
};
```

---

### Paso 3: Definir Schemas de Validación

**Archivo**: `src/services/album/album-schemas.ts`

```typescript
/**
 * @file Album Schemas con @effect/schema
 * @module services/album/album-schemas
 */

import { Schema } from '@effect/schema';

/**
 * Schema base para Album (desde DB)
 */
export class Album extends Schema.Class<Album>('Album')({
  id: Schema.String,
  name: Schema.String,
  description: Schema.NullOr(Schema.String),
  emoji: Schema.String,
  color: Schema.String,
  category: Schema.NullOr(Schema.String),
  coverImage: Schema.NullOr(Schema.String),
  isFavorite: Schema.Boolean,
  isArchived: Schema.Boolean,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
}) {}

/**
 * Input para crear Album
 */
export class AlbumCreate extends Schema.Class<AlbumCreate>('AlbumCreate')({
  name: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Name is required' }),
    Schema.maxLength(100, { message: () => 'Name is too long' })
  ),
  description: Schema.optional(Schema.String),
  emoji: Schema.optional(Schema.String),
  color: Schema.optional(Schema.String),
  category: Schema.optional(Schema.String),
  coverImage: Schema.optional(Schema.String),
}) {}

/**
 * Input para actualizar Album
 */
export class AlbumUpdate extends Schema.Class<AlbumUpdate>('AlbumUpdate')({
  id: Schema.String,
  name: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
  description: Schema.optional(Schema.NullOr(Schema.String)),
  emoji: Schema.optional(Schema.String),
  color: Schema.optional(Schema.String),
  category: Schema.optional(Schema.NullOr(Schema.String)),
  coverImage: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

/**
 * Conteos de relaciones
 */
export class AlbumCounts extends Schema.Class<AlbumCounts>('AlbumCounts')({
  images: Schema.Number,
  videos: Schema.Number,
  tags: Schema.Number,
}) {}

/**
 * Estadísticas calculadas
 */
export class AlbumStatistics extends Schema.Class<AlbumStatistics>('AlbumStatistics')({
  totalItems: Schema.Number,
  usageDiversity: Schema.Number,
  completenessScore: Schema.Number,
  popularity: Schema.Number,
}) {}

/**
 * Album con estadísticas completas
 */
export class AlbumWithStats extends Schema.Class<AlbumWithStats>('AlbumWithStats')({
  ...Album.fields,
  _count: AlbumCounts,
  statistics: AlbumStatistics,
}) {}

/**
 * Opciones de búsqueda/filtrado
 */
export class GetAlbumsOptions extends Schema.Class<GetAlbumsOptions>('GetAlbumsOptions')({
  page: Schema.optional(Schema.Number.pipe(Schema.positive())),
  pageSize: Schema.optional(Schema.Number.pipe(Schema.positive(), Schema.lessThanOrEqualTo(100))),
  query: Schema.optional(Schema.String),
  category: Schema.optional(Schema.String),
  isFavorite: Schema.optional(Schema.Boolean),
  isArchived: Schema.optional(Schema.Boolean),
  orderBy: Schema.optional(Schema.Literal('name', 'createdAt', 'updatedAt')),
  orderDirection: Schema.optional(Schema.Literal('asc', 'desc')),
}) {}

/**
 * Resultado paginado
 */
export class GetAlbumsResult extends Schema.Class<GetAlbumsResult>('GetAlbumsResult')({
  albums: Schema.Array(AlbumWithStats),
  total: Schema.Number,
  page: Schema.Number,
  pageSize: Schema.Number,
  hasMore: Schema.Boolean,
}) {}
```

---

### Paso 4: Implementar Servicio con Effect

**Archivo**: `src/services/album/album.service.effect.ts`

```typescript
/**
 * @file AlbumService con Effect
 * @module services/album/album.service.effect
 */

import { Effect, Context, Layer, pipe } from 'effect';
import { Schema } from '@effect/schema';
import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import * as crypto from 'crypto';
import { db } from '@/lib/drizzle';
import { albums, albumImages, albumVideos } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';

import {
  Album,
  AlbumCreate,
  AlbumUpdate,
  AlbumWithStats,
  GetAlbumsOptions,
  GetAlbumsResult,
  AlbumStatistics,
  AlbumCounts,
} from './album-schemas';

import {
  AlbumError,
  AlbumNotFound,
  AlbumDatabaseError,
  AlbumValidationError,
  AlbumHasRelationsError,
  fromUnknownError,
} from './album-errors.effect';

const logger = serverLogger.withContext('AlbumService.Effect');

/**
 * Interface del servicio AlbumService
 */
export interface AlbumServiceInterface {
  readonly getById: (id: string) => Effect.Effect<Album, AlbumError>;
  readonly getByIdWithStats: (id: string) => Effect.Effect<AlbumWithStats, AlbumError>;
  readonly getAll: (options?: GetAlbumsOptions) => Effect.Effect<GetAlbumsResult, AlbumError>;
  readonly create: (input: AlbumCreate) => Effect.Effect<AlbumWithStats, AlbumError>;
  readonly update: (input: AlbumUpdate) => Effect.Effect<AlbumWithStats, AlbumError>;
  readonly delete: (id: string) => Effect.Effect<void, AlbumError>;
  readonly toggleFavorite: (id: string) => Effect.Effect<Album, AlbumError>;
}

/**
 * Context.Tag para AlbumService
 */
export class AlbumService extends Context.Tag('AlbumService')<
  AlbumService,
  AlbumServiceInterface
>() {}

/**
 * Calcula estadísticas para un Album
 */
const calculateAlbumStatistics = (album: Album, counts: AlbumCounts): AlbumStatistics => {
  const totalItems = counts.images + counts.videos;
  
  // Completeness: qué tan completo está el perfil del album
  let completenessScore = 0;
  if (album.name) completenessScore += 30;
  if (album.description) completenessScore += 20;
  if (album.coverImage) completenessScore += 20;
  if (album.emoji) completenessScore += 15;
  if (album.color) completenessScore += 10;
  if (album.category) completenessScore += 5;
  
  // Usage diversity: proporción de tipos usados (images vs videos)
  const usageDiversity = totalItems > 0 
    ? Math.min(counts.images, counts.videos) / Math.max(counts.images, counts.videos, 1)
    : 0;
  
  // Popularity basada en totalItems
  const popularity = Math.min(totalItems * 5, 1000);
  
  return {
    totalItems,
    usageDiversity,
    completenessScore,
    popularity,
  };
};

/**
 * Implementación del servicio AlbumService
 */
const make = (): AlbumServiceInterface => {
  /**
   * Obtiene un album por su ID
   */
  const getById = (id: string): Effect.Effect<Album, AlbumError> =>
    Effect.gen(function* () {
      logger.info(`🔍 Buscando album: ${id}`);
      
      const result = yield* Effect.tryPromise<typeof albums.$inferSelect[], AlbumError>({
        try: () => db.select().from(albums).where(eq(albums.id, id)).limit(1),
        catch: (error: unknown) => {
          logger.error(`❌ Error al obtener album ${id}`, { error });
          return fromUnknownError('getById', error);
        },
      });
      
      if (result.length === 0) {
        logger.warn(`Album no encontrado: ${id}`);
        return yield* Effect.fail(new AlbumNotFound({ albumId: id }));
      }
      
      logger.info(`✅ Album encontrado: ${result[0].name}`);
      
      // Validar con Schema
      const validated = yield* Effect.try({
        try: () => Schema.decodeUnknownSync(Album)(result[0]),
        catch: (error) =>
          new AlbumValidationError({
            field: 'album',
            message: 'Error al validar album desde BD',
            value: result[0],
          }),
      });
      
      return validated;
    });
  
  /**
   * Obtiene conteos de relaciones para un album
   */
  const getRelationsCounts = (id: string): Effect.Effect<AlbumCounts, AlbumError> =>
    Effect.gen(function* () {
      logger.info(`📊 Obteniendo conteos para album: ${id}`);
      
      // Contar images
      const imageCountResult = yield* Effect.tryPromise<Array<{ count: number }>, AlbumError>({
        try: () => db.select({ count: count() }).from(albumImages).where(eq(albumImages.albumId, id)),
        catch: (error: unknown) => fromUnknownError('getRelationsCounts.images', error),
      });
      
      // Contar videos
      const videoCountResult = yield* Effect.tryPromise<Array<{ count: number }>, AlbumError>({
        try: () => db.select({ count: count() }).from(albumVideos).where(eq(albumVideos.albumId, id)),
        catch: (error: unknown) => fromUnknownError('getRelationsCounts.videos', error),
      });
      
      const counts: AlbumCounts = {
        images: imageCountResult[0]?.count ?? 0,
        videos: videoCountResult[0]?.count ?? 0,
        tags: 0, // TODO: implementar cuando exista relación album-tags
      };
      
      logger.info(`✅ Conteos obtenidos: ${counts.images} images, ${counts.videos} videos`);
      return counts;
    });
  
  /**
   * Obtiene un album con estadísticas completas
   */
  const getByIdWithStats = (id: string): Effect.Effect<AlbumWithStats, AlbumError> =>
    Effect.gen(function* () {
      logger.info(`📊 Obteniendo album con stats: ${id}`);
      
      const album = yield* getById(id);
      const counts = yield* getRelationsCounts(id);
      const statistics = calculateAlbumStatistics(album, counts);
      
      const albumWithStats: AlbumWithStats = {
        ...album,
        _count: counts,
        statistics,
      };
      
      logger.info(`✅ Album con stats obtenido: ${album.name}`);
      return albumWithStats;
    });
  
  /**
   * Obtiene todos los albums con opciones de filtrado
   */
  const getAll = (options: GetAlbumsOptions = {}): Effect.Effect<GetAlbumsResult, AlbumError> =>
    Effect.gen(function* () {
      logger.info('📋 Obteniendo albums con opciones:', options);
      
      const page = options.page ?? 1;
      const pageSize = options.pageSize ?? 20;
      const offset = (page - 1) * pageSize;
      
      // Construir where clause
      const conditions = [];
      if (options.query) {
        conditions.push(like(albums.name, `%${options.query}%`));
      }
      if (options.category) {
        conditions.push(eq(albums.category, options.category));
      }
      if (typeof options.isFavorite === 'boolean') {
        conditions.push(eq(albums.isFavorite, options.isFavorite));
      }
      if (typeof options.isArchived === 'boolean') {
        conditions.push(eq(albums.isArchived, options.isArchived));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      // Ordenamiento
      const orderByField = options.orderBy ?? 'createdAt';
      const orderDirection = options.orderDirection ?? 'desc';
      const orderByClause = orderDirection === 'asc' 
        ? asc(albums[orderByField]) 
        : desc(albums[orderByField]);
      
      // Query principal
      const albumsResult = yield* Effect.tryPromise<typeof albums.$inferSelect[], AlbumError>({
        try: () => 
          db.select()
            .from(albums)
            .where(whereClause)
            .orderBy(orderByClause)
            .limit(pageSize)
            .offset(offset),
        catch: (error: unknown) => fromUnknownError('getAll', error),
      });
      
      // Contar total
      const totalResult = yield* Effect.tryPromise<Array<{ count: number }>, AlbumError>({
        try: () => db.select({ count: count() }).from(albums).where(whereClause),
        catch: (error: unknown) => fromUnknownError('getAll.count', error),
      });
      
      const total = totalResult[0]?.count ?? 0;
      
      // Enriquecer con stats (en paralelo)
      const albumsWithStats = yield* Effect.all(
        albumsResult.map((album) => 
          getByIdWithStats(album.id)
        ),
        { concurrency: 5 }
      );
      
      const result: GetAlbumsResult = {
        albums: albumsWithStats,
        total,
        page,
        pageSize,
        hasMore: offset + pageSize < total,
      };
      
      logger.info(`✅ ${albumsWithStats.length} albums obtenidos (total: ${total})`);
      return result;
    });
  
  /**
   * Crea un nuevo album
   */
  const create = (input: AlbumCreate): Effect.Effect<AlbumWithStats, AlbumError> =>
    Effect.gen(function* () {
      logger.info('📝 Creando album:', input.name);
      
      // Validar input
      const validated = yield* Effect.try({
        try: () => Schema.decodeUnknownSync(AlbumCreate)(input),
        catch: (error) => 
          new AlbumValidationError({
            field: 'input',
            message: `Error de validación: ${error}`,
            value: input,
          }),
      });
      
      const id = crypto.randomUUID();
      const now = new Date();
      
      const newAlbum = {
        id,
        name: validated.name,
        description: validated.description ?? null,
        emoji: validated.emoji ?? '📁',
        color: validated.color ?? '#3b82f6',
        category: validated.category ?? null,
        coverImage: validated.coverImage ?? null,
        isFavorite: false,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      };
      
      // Insertar en DB
      yield* Effect.tryPromise({
        try: () => db.insert(albums).values(newAlbum),
        catch: (error: unknown) => {
          logger.error('❌ Error al crear album', { error });
          return new AlbumDatabaseError({
            operation: 'create',
            message: `Error al insertar album: ${error}`,
            cause: error,
          });
        },
      });
      
      logger.info(`✅ Album creado: ${newAlbum.name} (${id})`);
      
      // Retornar con stats iniciales
      return yield* getByIdWithStats(id);
    });
  
  /**
   * Actualiza un album
   */
  const update = (input: AlbumUpdate): Effect.Effect<AlbumWithStats, AlbumError> =>
    Effect.gen(function* () {
      logger.info('📝 Actualizando album:', input.id);
      
      // Validar input
      const validated = yield* Effect.try({
        try: () => Schema.decodeUnknownSync(AlbumUpdate)(input),
        catch: (error) => 
          new AlbumValidationError({
            field: 'input',
            message: `Error de validación: ${error}`,
            value: input,
          }),
      });
      
      // Verificar que existe
      yield* getById(validated.id);
      
      // Preparar update data (solo campos definidos)
      const updateData: Partial<typeof albums.$inferInsert> = {
        updatedAt: new Date(),
      };
      
      if (validated.name !== undefined) updateData.name = validated.name;
      if (validated.description !== undefined) updateData.description = validated.description;
      if (validated.emoji !== undefined) updateData.emoji = validated.emoji;
      if (validated.color !== undefined) updateData.color = validated.color;
      if (validated.category !== undefined) updateData.category = validated.category;
      if (validated.coverImage !== undefined) updateData.coverImage = validated.coverImage;
      
      // Actualizar en DB
      yield* Effect.tryPromise({
        try: () => db.update(albums).set(updateData).where(eq(albums.id, validated.id)),
        catch: (error: unknown) => {
          logger.error('❌ Error al actualizar album', { error });
          return new AlbumDatabaseError({
            operation: 'update',
            message: `Error al actualizar album: ${error}`,
            cause: error,
          });
        },
      });
      
      logger.info(`✅ Album actualizado: ${validated.id}`);
      
      // Retornar actualizado con stats
      return yield* getByIdWithStats(validated.id);
    });
  
  /**
   * Elimina un album
   */
  const deleteAlbum = (id: string): Effect.Effect<void, AlbumError> =>
    Effect.gen(function* () {
      logger.info('🗑️ Eliminando album:', id);
      
      // Verificar que existe
      yield* getById(id);
      
      // Verificar que no tiene relaciones
      const counts = yield* getRelationsCounts(id);
      const totalRelations = counts.images + counts.videos;
      
      if (totalRelations > 0) {
        logger.warn(`Album ${id} tiene ${totalRelations} relaciones`);
        return yield* Effect.fail(
          new AlbumHasRelationsError({
            albumId: id,
            relationCount: totalRelations,
          })
        );
      }
      
      // Eliminar de DB
      yield* Effect.tryPromise({
        try: () => db.delete(albums).where(eq(albums.id, id)),
        catch: (error: unknown) => {
          logger.error('❌ Error al eliminar album', { error });
          return new AlbumDatabaseError({
            operation: 'delete',
            message: `Error al eliminar album: ${error}`,
            cause: error,
          });
        },
      });
      
      logger.info(`✅ Album eliminado: ${id}`);
    });
  
  /**
   * Toggle favorite de un album
   */
  const toggleFavorite = (id: string): Effect.Effect<Album, AlbumError> =>
    Effect.gen(function* () {
      logger.info('⭐ Toggle favorite album:', id);
      
      const album = yield* getById(id);
      const newFavoriteStatus = !album.isFavorite;
      
      yield* Effect.tryPromise({
        try: () => 
          db.update(albums)
            .set({ 
              isFavorite: newFavoriteStatus,
              updatedAt: new Date(),
            })
            .where(eq(albums.id, id)),
        catch: (error: unknown) => {
          logger.error('❌ Error al toggle favorite', { error });
          return new AlbumDatabaseError({
            operation: 'toggleFavorite',
            message: `Error al actualizar favorite: ${error}`,
            cause: error,
          });
        },
      });
      
      logger.info(`✅ Album favorite=${newFavoriteStatus}: ${id}`);
      
      return yield* getById(id);
    });
  
  return {
    getById,
    getByIdWithStats,
    getAll,
    create,
    update,
    delete: deleteAlbum,
    toggleFavorite,
  };
};

/**
 * Layer para AlbumService
 */
export const AlbumServiceLive = Layer.succeed(AlbumService, make());

/**
 * Helper para ejecutar operaciones del servicio
 * (Útil para compatibilidad con código existente)
 */
export const runAlbumService = <A, E>(
  operation: (service: AlbumServiceInterface) => Effect.Effect<A, E>
): Promise<A> => {
  const program = Effect.gen(function* () {
    const service = yield* AlbumService;
    return yield* operation(service);
  });
  
  return Effect.runPromise(
    program.pipe(Effect.provide(AlbumServiceLive))
  );
};
```

---

### Paso 5: Testing

**Archivo**: `src/services/album/__tests__/album.service.effect.spec.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Effect } from 'effect';
import {
  AlbumService,
  AlbumServiceLive,
} from '../album.service.effect';
import {
  AlbumCreate,
  AlbumUpdate,
} from '../album-schemas';
import {
  AlbumNotFound,
  AlbumHasRelationsError,
} from '../album-errors.effect';
import { db } from '@/lib/drizzle';
import { albums } from '@/lib/drizzle/schema';

describe('AlbumService.Effect', () => {
  // Helper para ejecutar efectos en tests
  const runTest = <A, E>(effect: Effect.Effect<A, E>) =>
    Effect.runPromise(
      effect.pipe(Effect.provide(AlbumServiceLive))
    );
  
  let testAlbumId: string;
  
  beforeEach(async () => {
    // Crear album de prueba
    const createInput: AlbumCreate = {
      name: 'Test Album',
      description: 'Test description',
      emoji: '🎨',
      color: '#ff0000',
    };
    
    const album = await runTest(
      Effect.gen(function* () {
        const service = yield* AlbumService;
        return yield* service.create(createInput);
      })
    );
    
    testAlbumId = album.id;
  });
  
  afterEach(async () => {
    // Cleanup: eliminar albums de prueba
    await db.delete(albums).where(/* lógica de cleanup */);
  });
  
  describe('getById', () => {
    it('debería obtener album por ID', async () => {
      const album = await runTest(
        Effect.gen(function* () {
          const service = yield* AlbumService;
          return yield* service.getById(testAlbumId);
        })
      );
      
      expect(album.id).toBe(testAlbumId);
      expect(album.name).toBe('Test Album');
    });
    
    it('debería fallar con AlbumNotFound si no existe', async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const service = yield* AlbumService;
          return yield* service.getById('nonexistent-id');
        }).pipe(
          Effect.either
        )
      );
      
      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(AlbumNotFound);
      }
    });
  });
  
  describe('create', () => {
    it('debería crear un nuevo album', async () => {
      const input: AlbumCreate = {
        name: 'New Album',
        description: 'New description',
      };
      
      const album = await runTest(
        Effect.gen(function* () {
          const service = yield* AlbumService;
          return yield* service.create(input);
        })
      );
      
      expect(album.name).toBe('New Album');
      expect(album.description).toBe('New description');
      expect(album._count).toBeDefined();
      expect(album.statistics).toBeDefined();
    });
  });
  
  describe('update', () => {
    it('debería actualizar un album existente', async () => {
      const updateInput: AlbumUpdate = {
        id: testAlbumId,
        name: 'Updated Name',
      };
      
      const updated = await runTest(
        Effect.gen(function* () {
          const service = yield* AlbumService;
          return yield* service.update(updateInput);
        })
      );
      
      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Test description'); // Sin cambiar
    });
  });
  
  describe('delete', () => {
    it('debería eliminar album sin relaciones', async () => {
      await expect(
        runTest(
          Effect.gen(function* () {
            const service = yield* AlbumService;
            yield* service.delete(testAlbumId);
          })
        )
      ).resolves.toBeUndefined();
      
      // Verificar que ya no existe
      const result = await runTest(
        Effect.gen(function* () {
          const service = yield* AlbumService;
          return yield* service.getById(testAlbumId);
        }).pipe(
          Effect.either
        )
      );
      
      expect(result._tag).toBe('Left');
    });
    
    it('debería fallar si tiene relaciones', async () => {
      // TODO: Agregar images/videos al album para test
      // Luego intentar eliminar y verificar AlbumHasRelationsError
    });
  });
  
  describe('toggleFavorite', () => {
    it('debería alternar estado favorite', async () => {
      const initial = await runTest(
        Effect.gen(function* () {
          const service = yield* AlbumService;
          return yield* service.getById(testAlbumId);
        })
      );
      
      const toggled = await runTest(
        Effect.gen(function* () {
          const service = yield* AlbumService;
          return yield* service.toggleFavorite(testAlbumId);
        })
      );
      
      expect(toggled.isFavorite).toBe(!initial.isFavorite);
    });
  });
  
  describe('getAll', () => {
    it('debería obtener albums paginados', async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const service = yield* AlbumService;
          return yield* service.getAll({ page: 1, pageSize: 10 });
        })
      );
      
      expect(result.albums).toBeArray();
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });
    
    it('debería filtrar por query', async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const service = yield* AlbumService;
          return yield* service.getAll({ query: 'Test' });
        })
      );
      
      expect(result.albums.every(a => a.name.includes('Test'))).toBe(true);
    });
  });
});
```

---

## Patrones y Ejemplos

### Pattern 1: Composición con pipe()

```typescript
// Operaciones encadenadas
const enrichedAlbum = yield* getById(id).pipe(
  Effect.flatMap(album => getRelationsCounts(album.id).pipe(
    Effect.map(counts => ({ album, counts }))
  )),
  Effect.flatMap(({ album, counts }) => 
    Effect.succeed({
      ...album,
      _count: counts,
      statistics: calculateAlbumStatistics(album, counts)
    })
  ),
  Effect.tap(result => 
    Effect.sync(() => logger.info(`Album enriquecido: ${result.name}`))
  )
)
```

### Pattern 2: Error Handling con catchTags

```typescript
const safeGetAlbum = (id: string) =>
  getById(id).pipe(
    Effect.catchTags({
      AlbumNotFound: (error) => 
        Effect.succeed(null), // Retornar null en vez de error
      AlbumDatabaseError: (error) => {
        logger.error('Database error', error);
        return Effect.fail(new ServiceUnavailableError());
      },
    })
  );
```

### Pattern 3: Operaciones en Paralelo

```typescript
// Obtener múltiples albums en paralelo
const albums = yield* Effect.all(
  albumIds.map(id => getByIdWithStats(id)),
  { concurrency: 5 } // Máximo 5 concurrentes
);
```

### Pattern 4: Retry con Backoff

```typescript
import { Schedule } from 'effect';

const resilientCreate = (input: AlbumCreate) =>
  create(input).pipe(
    Effect.retry(
      Schedule.exponential('100 millis').pipe(
        Schedule.compose(Schedule.recurs(3))
      )
    ),
    Effect.timeout('5 seconds')
  );
```

---

## Troubleshooting

### Error: "Service not provided"

```typescript
// ❌ MAL
const result = await Effect.runPromise(
  Effect.gen(function* () {
    const service = yield* AlbumService;
    return yield* service.getById(id);
  })
);

// ✅ BIEN
const result = await Effect.runPromise(
  Effect.gen(function* () {
    const service = yield* AlbumService;
    return yield* service.getById(id);
  }).pipe(
    Effect.provide(AlbumServiceLive) // ← Proveer layer
  )
);
```

### Error: Type mismatch en Schema

```typescript
// ❌ Schema no coincide con tipo DB
export class Album extends Schema.Class<Album>('Album')({
  id: Schema.Number, // ← DB retorna String
})

// ✅ Usar tipo correcto
export class Album extends Schema.Class<Album>('Album')({
  id: Schema.String, // ← Coincide con DB
})
```

### Performance: Queries N+1

```typescript
// ❌ MAL: N+1 queries
const albumsWithStats = []
for (const album of albums) {
  const stats = await getStats(album.id) // ← Query por cada album
  albumsWithStats.push({ ...album, stats })
}

// ✅ BIEN: Batch query
const albumsWithStats = yield* Effect.all(
  albums.map(album => getByIdWithStats(album.id)),
  { concurrency: 10 }
);
```

---

## Checklist de Migración

Antes de considerar un servicio migrado, verificar:

- [ ] ✅ Archivo `service-name-errors.effect.ts` creado con todos los errores tipados
- [ ] ✅ Archivo `service-name-schemas.ts` con schemas completos
- [ ] ✅ Servicio implementado en `service-name.service.effect.ts`
- [ ] ✅ Context.Tag definido correctamente
- [ ] ✅ Layer `ServiceNameLive` exportado
- [ ] ✅ Todos los métodos CRUD implementados
- [ ] ✅ Logging integrado en operaciones clave
- [ ] ✅ Validación con @effect/schema en inputs
- [ ] ✅ Tests completos con cobertura >80%
- [ ] ✅ Documentación JSDoc en métodos públicos
- [ ] ✅ Sin warnings de TypeScript
- [ ] ✅ Performance validada (igual o mejor que versión anterior)

---

**Última actualización**: 11 de octubre de 2025  
**Referencia completa**: TagService en `src/services/tag/`

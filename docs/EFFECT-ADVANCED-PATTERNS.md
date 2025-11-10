# 🚀 Patrones Avanzados de Effect-TS para Image Manager

> **Técnicas y patrones probados en producción**  
> **Para desarrolladores avanzados del proyecto**

---

## 📖 Índice

1. [Resource Management](#resource-management)
2. [Batching & Caching](#batching--caching)
3. [Stream Processing](#stream-processing)
4. [Error Recovery](#error-recovery)
5. [Observability](#observability)
6. [Testing Avanzado](#testing-avanzado)

---

## Resource Management

### Pattern 1: File System Operations con Cleanup Automático

```typescript
/**
 * Procesar todas las imágenes de un folder con cleanup automático
 */
import { Effect, Scope } from 'effect';
import * as fs from 'node:fs/promises';

const processImagesInFolder = (folderPath: string) =>
  Effect.gen(function* () {
    // acquireRelease asegura cleanup automático
    const dirHandle = yield* Effect.acquireRelease(
      // Acquire: abrir directorio
      Effect.tryPromise({
        try: () => fs.opendir(folderPath),
        catch: (error) => new FileSystemError({ operation: 'opendir', error })
      }),
      // Release: cerrar siempre (success o error)
      (dir) => Effect.sync(() => dir.close())
    );
    
    const results = [];
    
    for await (const entry of dirHandle) {
      if (entry.isFile() && /\.(jpg|jpeg|png|webp)$/i.test(entry.name)) {
        const imagePath = `${folderPath}/${entry.name}`;
        
        // Procesar imagen con su propio scope
        const processed = yield* processImageFile(imagePath).pipe(
          Effect.catchAll(error => {
            logger.warn(`Error procesando ${entry.name}`, error);
            return Effect.succeed(null); // Continuar con siguiente
          })
        );
        
        if (processed) {
          results.push(processed);
        }
      }
    }
    
    return results;
  });

/**
 * Procesar un archivo de imagen individual
 */
const processImageFile = (imagePath: string) =>
  Effect.gen(function* () {
    // Leer archivo con cleanup automático
    const fileHandle = yield* Effect.acquireRelease(
      Effect.tryPromise({
        try: () => fs.open(imagePath, 'r'),
        catch: (error) => new FileSystemError({ operation: 'open', error })
      }),
      (handle) => Effect.sync(() => handle.close())
    );
    
    // Leer metadata
    const stats = yield* Effect.tryPromise({
      try: () => fileHandle.stat(),
      catch: (error) => new FileSystemError({ operation: 'stat', error })
    });
    
    // Leer contenido parcial para análisis
    const buffer = Buffer.alloc(Math.min(stats.size, 4096));
    yield* Effect.tryPromise({
      try: () => fileHandle.read(buffer, 0, buffer.length, 0),
      catch: (error) => new FileSystemError({ operation: 'read', error })
    });
    
    // Detectar tipo de imagen
    const imageType = detectImageType(buffer);
    
    return {
      path: imagePath,
      size: stats.size,
      type: imageType,
      modifiedAt: stats.mtime,
    };
  });
```

### Pattern 2: Database Transactions con Rollback

```typescript
/**
 * Transacción compleja con múltiples operaciones
 */
import { Effect } from 'effect';
import { db } from '@/lib/drizzle';

const moveImagesToAlbum = (imageIds: string[], albumId: string) =>
  Effect.gen(function* () {
    // Verificar que album existe
    const album = yield* AlbumService.getById(albumId);
    
    // Scope para transacción
    yield* Effect.acquireUseRelease(
      // Acquire: iniciar transacción
      Effect.sync(() => db.transaction()),
      // Use: operaciones dentro de transacción
      (tx) => Effect.gen(function* () {
        // Actualizar cada imagen
        for (const imageId of imageIds) {
          yield* Effect.tryPromise({
            try: () => tx.update(images)
              .set({ albumId, updatedAt: new Date() })
              .where(eq(images.id, imageId)),
            catch: (error) => new DatabaseError({
              operation: 'updateImageAlbum',
              error
            })
          });
        }
        
        // Actualizar contadores del album
        yield* Effect.tryPromise({
          try: () => tx.update(albums)
            .set({ 
              imageCount: album._count.images + imageIds.length,
              updatedAt: new Date()
            })
            .where(eq(albums.id, albumId)),
          catch: (error) => new DatabaseError({
            operation: 'updateAlbumCount',
            error
          })
        });
        
        // Commit implícito al finalizar sin errores
      }),
      // Release: rollback si hubo error
      (tx, exit) => Exit.isFailure(exit) 
        ? Effect.sync(() => tx.rollback())
        : Effect.void
    );
    
    logger.info(`✅ ${imageIds.length} imágenes movidas al album ${albumId}`);
    
    // Retornar album actualizado
    return yield* AlbumService.getByIdWithStats(albumId);
  });
```

---

## Batching & Caching

### Pattern 3: Request Batching para N+1 Queries

```typescript
/**
 * Resolver requests de imágenes en batch
 */
import { Request, RequestResolver, Effect } from 'effect';

// Definir request
class GetImageById extends Request.TaggedClass('GetImageById')<{
  readonly id: string
}, ImageError, Image> {}

// Resolver en batch
const ImageBatchResolver = RequestResolver.makeBatched(
  (requests: GetImageById[]) => 
    Effect.gen(function* () {
      const ids = requests.map(r => r.id);
      
      // Una sola query para todos los IDs
      const images = yield* Effect.tryPromise({
        try: () => db.query.images.findMany({
          where: inArray(images.id, ids)
        }),
        catch: (error) => new DatabaseError({ operation: 'batchGetImages', error })
      });
      
      // Mapear resultados a requests
      const imageMap = new Map(images.map(img => [img.id, img]));
      
      return requests.map(req => {
        const image = imageMap.get(req.id);
        return image
          ? Request.succeed(req, image)
          : Request.fail(req, new ImageNotFound({ imageId: req.id }));
      });
    })
);

// Uso en servicio
const getBatchedImages = (ids: string[]) =>
  Effect.all(
    ids.map(id => Effect.request(new GetImageById({ id }), ImageBatchResolver)),
    { batching: true } // ← Habilitar batching
  );

// Ejemplo: Obtener imágenes de múltiples folders (evita N+1)
const getImagesForFolders = (folderIds: string[]) =>
  Effect.gen(function* () {
    // Obtener folders
    const folders = yield* Effect.all(
      folderIds.map(id => FolderService.getById(id)),
      { concurrency: 5 }
    );
    
    // Extraer todos los image IDs
    const allImageIds = folders.flatMap(folder => folder.imageIds);
    
    // Batch request (una sola query para todas)
    const images = yield* getBatchedImages(allImageIds);
    
    // Agrupar por folder
    const imagesByFolder = new Map<string, Image[]>();
    for (const folder of folders) {
      imagesByFolder.set(
        folder.id,
        images.filter(img => folder.imageIds.includes(img.id))
      );
    }
    
    return imagesByFolder;
  });
```

### Pattern 4: Caching con TTL y Invalidación

```typescript
/**
 * Cache para stats de folders con invalidación automática
 */
import { Cache, Duration, Effect } from 'effect';

const makeFolderStatsCache = Effect.gen(function* () {
  // Cache con TTL de 5 minutos
  const cache = yield* Cache.make({
    capacity: 1000,
    timeToLive: Duration.minutes(5),
    lookup: (folderId: string) => 
      FolderService.getStats(folderId)
  });
  
  return {
    /**
     * Obtiene stats (cached o fresh)
     */
    getStats: (folderId: string) => 
      Cache.get(cache, folderId),
    
    /**
     * Invalida cache de un folder
     */
    invalidate: (folderId: string) => 
      Cache.invalidate(cache, folderId),
    
    /**
     * Invalida todo el cache
     */
    invalidateAll: () => 
      Cache.invalidateAll(cache),
  };
});

// Integrar en servicio
export const FolderServiceWithCache = Layer.effect(
  FolderService,
  Effect.gen(function* () {
    const baseService = make(); // Servicio original
    const statsCache = yield* makeFolderStatsCache;
    
    return {
      ...baseService,
      
      // Override getStats para usar cache
      getStats: statsCache.getStats,
      
      // Override operaciones que invalidan cache
      updateFolder: (input) => 
        Effect.gen(function* () {
          const result = yield* baseService.updateFolder(input);
          yield* statsCache.invalidate(input.id);
          return result;
        }),
      
      addImageToFolder: (folderId, imageId) =>
        Effect.gen(function* () {
          const result = yield* baseService.addImageToFolder(folderId, imageId);
          yield* statsCache.invalidate(folderId);
          return result;
        }),
    };
  })
);
```

---

## Stream Processing

### Pattern 5: Processing Large Datasets con Streams

```typescript
/**
 * Procesar miles de imágenes en streaming
 */
import { Stream, Effect, Chunk } from 'effect';

const reindexAllImages = () =>
  Effect.gen(function* () {
    // Stream de todos los folders
    const folderStream = Stream.fromIterableEffect(
      Effect.tryPromise({
        try: () => db.query.folders.findMany(),
        catch: (error) => new DatabaseError({ operation: 'getAllFolders', error })
      })
    );
    
    // Procesar cada folder en streaming
    const results = yield* folderStream.pipe(
      // Procesar folders en paralelo (chunks de 5)
      Stream.mapConcatChunk(folder => 
        Chunk.make(processFolder(folder))
      ),
      Stream.buffer(100), // Buffer de 100 items
      Stream.runCollect // Recolectar resultados
    );
    
    return {
      totalFolders: Chunk.size(results),
      totalImages: Chunk.reduce(results, 0, (acc, r) => acc + r.imageCount),
    };
  });

const processFolder = (folder: Folder) =>
  Effect.gen(function* () {
    logger.info(`📂 Procesando folder: ${folder.name}`);
    
    // Stream de imágenes del folder
    const imageStream = Stream.fromIterableEffect(
      Effect.tryPromise({
        try: () => db.query.images.findMany({
          where: eq(images.folderId, folder.id)
        }),
        catch: (error) => new DatabaseError({ operation: 'getFolderImages', error })
      })
    );
    
    // Procesar cada imagen
    let processedCount = 0;
    
    yield* imageStream.pipe(
      // Batch de 10 imágenes
      Stream.grouped(10),
      // Procesar cada batch
      Stream.mapEffect(imageBatch =>
        Effect.gen(function* () {
          for (const image of imageBatch) {
            yield* reindexImage(image).pipe(
              Effect.catchAll(error => {
                logger.error(`Error reindexing ${image.path}`, error);
                return Effect.void;
              })
            );
            processedCount++;
          }
        })
      ),
      Stream.runDrain // Ejecutar stream
    );
    
    return {
      folderId: folder.id,
      folderName: folder.name,
      imageCount: processedCount,
    };
  });
```

### Pattern 6: SSE Streaming para Progress Updates

```typescript
/**
 * Server-Sent Events para progreso de operación larga
 */
import { Stream, Effect, Schedule, Duration } from 'effect';

const streamReindexProgress = () =>
  Effect.gen(function* () {
    // Estado compartido
    const state = {
      totalFolders: 0,
      processedFolders: 0,
      totalImages: 0,
      processedImages: 0,
    };
    
    // Stream que emite updates de progreso
    const progressStream = Stream.fromSchedule(
      Schedule.spaced(Duration.seconds(1)) // Cada segundo
    ).pipe(
      Stream.map(() => ({
        type: 'progress',
        data: {
          foldersProgress: state.totalFolders > 0
            ? (state.processedFolders / state.totalFolders) * 100
            : 0,
          imagesProgress: state.totalImages > 0
            ? (state.processedImages / state.totalImages) * 100
            : 0,
          processedFolders: state.processedFolders,
          totalFolders: state.totalFolders,
          processedImages: state.processedImages,
          totalImages: state.totalImages,
        }
      }))
    );
    
    // Iniciar proceso en background
    Effect.fork(
      Effect.gen(function* () {
        // Contar total
        const folders = yield* Effect.tryPromise({
          try: () => db.query.folders.findMany(),
          catch: (error) => new DatabaseError({ operation: 'countFolders', error })
        });
        
        state.totalFolders = folders.length;
        
        // Procesar
        for (const folder of folders) {
          const images = yield* Effect.tryPromise({
            try: () => db.query.images.findMany({
              where: eq(images.folderId, folder.id)
            }),
            catch: (error) => new DatabaseError({ operation: 'getFolderImages', error })
          });
          
          state.totalImages += images.length;
          
          for (const image of images) {
            yield* reindexImage(image);
            state.processedImages++;
          }
          
          state.processedFolders++;
        }
      })
    );
    
    return progressStream;
  });

// Uso en Express route
app.get('/api/reindex/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const program = Effect.gen(function* () {
    const stream = yield* streamReindexProgress();
    
    yield* stream.pipe(
      Stream.tap(event => 
        Effect.sync(() => {
          res.write(`data: ${JSON.stringify(event.data)}\n\n`);
        })
      ),
      Stream.runDrain
    );
  });
  
  Effect.runPromise(program).finally(() => {
    res.write('data: {"type":"complete"}\n\n');
    res.end();
  });
});
```

---

## Error Recovery

### Pattern 7: Circuit Breaker para APIs Externas

```typescript
/**
 * Circuit breaker para llamadas a APIs externas (ej: AI metadata)
 */
import { Effect, Schedule, Duration } from 'effect';

class CircuitBreakerOpen extends Data.TaggedError('CircuitBreakerOpen')<{
  readonly service: string;
  readonly failureCount: number;
}> {}

const makeCircuitBreaker = (serviceName: string) => {
  let failureCount = 0;
  let isOpen = false;
  let lastFailureTime = 0;
  
  const FAILURE_THRESHOLD = 5;
  const RESET_TIMEOUT = Duration.toMillis(Duration.minutes(1));
  
  return {
    call: <A, E>(effect: Effect.Effect<A, E>) =>
      Effect.gen(function* () {
        // Verificar si circuit está abierto
        if (isOpen) {
          const now = Date.now();
          if (now - lastFailureTime < RESET_TIMEOUT) {
            logger.warn(`🔴 Circuit breaker open for ${serviceName}`);
            return yield* Effect.fail(
              new CircuitBreakerOpen({ 
                service: serviceName,
                failureCount 
              })
            );
          } else {
            // Intentar reset
            logger.info(`🟡 Attempting circuit breaker reset for ${serviceName}`);
            isOpen = false;
            failureCount = 0;
          }
        }
        
        // Intentar operación
        const result = yield* effect.pipe(
          Effect.tapError(error => 
            Effect.sync(() => {
              failureCount++;
              lastFailureTime = Date.now();
              
              if (failureCount >= FAILURE_THRESHOLD) {
                isOpen = true;
                logger.error(`🔴 Circuit breaker opened for ${serviceName} after ${failureCount} failures`);
              }
            })
          ),
          Effect.tap(() => 
            Effect.sync(() => {
              // Reset en success
              if (failureCount > 0) {
                logger.info(`🟢 Circuit breaker reset for ${serviceName}`);
                failureCount = 0;
                isOpen = false;
              }
            })
          )
        );
        
        return result;
      }),
  };
};

// Uso con API de AI metadata
const aiMetadataCircuitBreaker = makeCircuitBreaker('AI-Metadata-API');

const getAIMetadata = (imagePath: string) =>
  aiMetadataCircuitBreaker.call(
    Effect.gen(function* () {
      const response = yield* Effect.tryPromise({
        try: () => fetch(`https://ai-api.example.com/analyze`, {
          method: 'POST',
          body: JSON.stringify({ image: imagePath }),
        }),
        catch: (error) => new AIServiceError({ operation: 'analyze', error })
      });
      
      if (!response.ok) {
        return yield* Effect.fail(
          new AIServiceError({ 
            operation: 'analyze',
            error: `HTTP ${response.status}`
          })
        );
      }
      
      return yield* Effect.tryPromise({
        try: () => response.json(),
        catch: (error) => new AIServiceError({ operation: 'parseResponse', error })
      });
    }).pipe(
      // Retry con backoff exponencial
      Effect.retry(
        Schedule.exponential(Duration.millis(100)).pipe(
          Schedule.compose(Schedule.recurs(3))
        )
      ),
      // Timeout de 30 segundos
      Effect.timeout(Duration.seconds(30))
    )
  );
```

### Pattern 8: Fallback Strategies

```typescript
/**
 * Estrategias de fallback múltiples
 */
const getThumbnailWithFallbacks = (imageId: string) =>
  Effect.gen(function* () {
    // Estrategia 1: Cache
    const cachedThumb = yield* getCachedThumbnail(imageId).pipe(
      Effect.catchAll(() => Effect.succeed(null))
    );
    
    if (cachedThumb) {
      return cachedThumb;
    }
    
    // Estrategia 2: Generar thumbnail
    const generatedThumb = yield* generateThumbnail(imageId).pipe(
      Effect.catchAll(() => Effect.succeed(null))
    );
    
    if (generatedThumb) {
      // Cachear para próxima vez
      yield* cacheThumbnail(imageId, generatedThumb).pipe(
        Effect.catchAll(() => Effect.void) // Ignorar error de cache
      );
      return generatedThumb;
    }
    
    // Estrategia 3: Placeholder genérico
    logger.warn(`Usando placeholder para imagen ${imageId}`);
    return yield* getPlaceholderThumbnail();
  });
```

---

## Observability

### Pattern 9: Métricas con Effect Metrics

```typescript
/**
 * Sistema de métricas para servicios
 */
import { Metric, Effect } from 'effect';

// Definir métricas
const serviceMetrics = {
  requestCount: Metric.counter('service_requests_total', {
    description: 'Total service requests',
  }),
  
  requestDuration: Metric.histogram('service_request_duration_seconds', {
    description: 'Request duration in seconds',
    boundaries: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  }),
  
  errorCount: Metric.counter('service_errors_total', {
    description: 'Total service errors',
  }),
  
  cacheHitRate: Metric.gauge('service_cache_hit_rate', {
    description: 'Cache hit rate percentage',
  }),
};

// Instrumentar operación
const instrumentedOperation = <A, E>(
  operationName: string,
  effect: Effect.Effect<A, E>
) =>
  Effect.gen(function* () {
    const startTime = Date.now();
    
    // Incrementar contador
    yield* Metric.increment(serviceMetrics.requestCount);
    
    // Ejecutar operación
    const result = yield* effect.pipe(
      Effect.tapError(() => 
        Metric.increment(serviceMetrics.errorCount)
      )
    );
    
    // Registrar duración
    const duration = (Date.now() - startTime) / 1000;
    yield* Metric.set(serviceMetrics.requestDuration, duration);
    
    logger.debug(`${operationName} took ${duration}s`);
    
    return result;
  });

// Uso
const getImageWithMetrics = (id: string) =>
  instrumentedOperation(
    `getImage-${id}`,
    ImageService.getById(id)
  );
```

### Pattern 10: Distributed Tracing

```typescript
/**
 * Tracing distribuido para debugging
 */
import { Tracer, Effect } from 'effect';

const tracedImageProcessing = (imagePath: string) =>
  Effect.gen(function* () {
    const span = yield* Tracer.span('processImage', {
      attributes: {
        imagePath,
        operation: 'full-processing'
      }
    });
    
    // Sub-span: Leer archivo
    const imageData = yield* Tracer.span('readImageFile', {
      attributes: { imagePath }
    }).pipe(
      Effect.flatMap(() => readImageFile(imagePath))
    );
    
    // Sub-span: Extraer metadata
    const metadata = yield* Tracer.span('extractMetadata', {
      attributes: { imagePath }
    }).pipe(
      Effect.flatMap(() => extractImageMetadata(imageData))
    );
    
    // Sub-span: Generar thumbnail
    const thumbnail = yield* Tracer.span('generateThumbnail', {
      attributes: { imagePath, size: '256x256' }
    }).pipe(
      Effect.flatMap(() => generateThumbnail(imageData, { width: 256, height: 256 }))
    );
    
    // Sub-span: Guardar en DB
    yield* Tracer.span('saveToDatabase', {
      attributes: { imagePath }
    }).pipe(
      Effect.flatMap(() => saveImageToDatabase({
        path: imagePath,
        metadata,
        thumbnail,
      }))
    );
    
    span.end();
    
    return { metadata, thumbnail };
  });
```

---

## Testing Avanzado

### Pattern 11: Test Layers para Mocking

```typescript
/**
 * Layers de test para servicios mock
 */
import { Layer, Effect } from 'effect';

// Mock de ImageService para tests
const ImageServiceMock = Layer.succeed(
  ImageService,
  {
    getById: (id: string) => 
      Effect.succeed({
        id,
        path: `/test/images/${id}.jpg`,
        name: `Test Image ${id}`,
        // ... resto de campos mock
      }),
    
    getAll: (options) => 
      Effect.succeed({
        images: [
          /* mock images */
        ],
        total: 10,
        page: options.page ?? 1,
        pageSize: options.pageSize ?? 20,
      }),
    
    // ... resto de métodos mock
  }
);

// Test usando mock
describe('AlbumService with mocked ImageService', () => {
  it('should create album with images', async () => {
    const program = Effect.gen(function* () {
      const albumService = yield* AlbumService;
      const imageService = yield* ImageService;
      
      // Crear album
      const album = yield* albumService.create({
        name: 'Test Album',
      });
      
      // Obtener imágenes (mock)
      const images = yield* imageService.getAll({ pageSize: 5 });
      
      // Agregar al album
      for (const image of images.images) {
        yield* albumService.addImage(album.id, image.id);
      }
      
      return yield* albumService.getByIdWithStats(album.id);
    });
    
    const result = await Effect.runPromise(
      program.pipe(
        Effect.provide(AlbumServiceLive),
        Effect.provide(ImageServiceMock) // ← Usar mock
      )
    );
    
    expect(result._count.images).toBe(5);
  });
});
```

### Pattern 12: Property-Based Testing

```typescript
/**
 * Property-based testing con Effect + fast-check
 */
import * as fc from 'fast-check';
import { Effect } from 'effect';

describe('ImageService properties', () => {
  it('create + getById should be consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generadores de datos aleatorios
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          path: fc.string({ minLength: 5, maxLength: 255 }),
          width: fc.integer({ min: 1, max: 10000 }),
          height: fc.integer({ min: 1, max: 10000 }),
        }),
        async (imageData) => {
          const program = Effect.gen(function* () {
            const service = yield* ImageService;
            
            // Crear imagen
            const created = yield* service.create(imageData);
            
            // Obtener por ID
            const retrieved = yield* service.getById(created.id);
            
            // Verificar consistencia
            expect(retrieved.name).toBe(created.name);
            expect(retrieved.path).toBe(created.path);
            expect(retrieved.width).toBe(created.width);
            expect(retrieved.height).toBe(created.height);
            
            // Cleanup
            yield* service.delete(created.id);
          });
          
          await Effect.runPromise(
            program.pipe(Effect.provide(ImageServiceLive))
          );
        }
      ),
      { numRuns: 100 } // Ejecutar 100 veces con datos aleatorios
    );
  });
});
```

---

## Conclusión

Estos patrones avanzados permiten:

1. ✅ **Resource safety** automático
2. ✅ **Performance** óptimo con batching/caching
3. ✅ **Resilience** con circuit breakers y fallbacks
4. ✅ **Observability** completa con métricas y tracing
5. ✅ **Testability** mejorada con mocks y property-based testing

Todos los patrones son **type-safe** y **composables**.

---

**Última actualización**: 11 de octubre de 2025  
**Mantener actualizado** conforme se descubran nuevos patrones

# Análisis y Optimización del Sistema de Caché

## Estado Actual

El sistema de caché actual en la aplicación está implementado principalmente en:

- `src/lib/cache.ts`: Implementación principal de la clase CacheManager
- `src/config/cache.config.ts`: Configuración para diferentes tipos de caché
- `src/providers/cache-provider.tsx`: Proveedor de caché para la aplicación

El sistema actual utiliza una implementación personalizada basada en un Map con expiración y limpieza manual. Además, tiene diferentes instancias para distintos tipos de datos:

```typescript
// Configuración actual
export const cacheConfig: CacheConfig = {
	default: {
		max: 500,
		ttl: 1000 * 60 * 60, // 1 hora
		updateAgeOnGet: true,
		allowStale: false,
		cleanupInterval: 1000 * 60 * 15, // 15 minutos
		statsInterval: 1000 * 60 * 5, // 5 minutos
	},
	thumbnails: {
		max: 1000,
		ttl: 1000 * 60 * 60 * 24, // 24 horas
		cleanupInterval: 1000 * 60 * 30, // 30 minutos
		updateAgeOnGet: true,
		allowStale: true,
	},
	stats: {
		max: 200,
		ttl: 1000 * 60 * 5, // 5 minutos
		cleanupInterval: 1000 * 60 * 1, // 1 minuto
		updateAgeOnGet: true,
		allowStale: true,
	},
	// ...otras configuraciones...
};
```

La implementación básica de CacheManager:

```typescript
export class CacheManager<T> {
	private cache: Map<string, { value: T; timestamp: number }>;
	private ttl: number;
	private maxSize: number;
	// ...otros campos...

	constructor(options: CacheOptions = {}) {
		this.cache = new Map();
		this.ttl = options.ttl || 5 * 60 * 1000; // 5 minutos por defecto
		this.maxSize = options.maxSize || 1000;
		// ...inicialización...
	}

	async set(key: string, value: T, _customTtl?: number): Promise<void> {
		if (this.cache.size >= this.maxSize) {
			this.evictOldest();
		}

		this.cache.set(key, {
			value,
			timestamp: Date.now(),
		});
	}

	async get(key: string): Promise<T | undefined> {
		const item = this.cache.get(key);
		// ...lógica de get y caducidad...
	}

	// ...otros métodos...
}
```

## Problemas Identificados

1. **Rendimiento Subóptimo**:

   - La implementación actual basada en `Map` no es óptima para grandes conjuntos de datos
   - La comprobación de caducidad se realiza en cada operación de obtención
   - No hay estadísticas detalladas de rendimiento (hit rates, miss rates, etc.)

2. **Falta de Persistencia**:

   - La caché se pierde al reiniciar la aplicación
   - No hay sincronización entre instancias de la aplicación

3. **Gestión Manual de Recursos**:

   - La limpieza de recursos antiguos se maneja manualmente
   - Posible acumulación de memoria si la limpieza no funciona correctamente

4. **Integración Limitada con React Query**:

   - No hay una integración óptima entre este sistema y la caché de React Query
   - Potencial duplicación de datos en memoria

5. **Inconsistencia entre Caché en Memoria y Filesystem**:
   - Para thumbnails, existe una caché en sistema de archivos que no está bien sincronizada con la caché en memoria
   - Posibles inconsistencias entre estas dos capas

## Propuesta de Optimización

### 1. Migración a LRU-Cache con Tipado Fuerte

Reemplazar la implementación personalizada con la biblioteca `lru-cache` ya incluida en las dependencias:

```typescript
import { LRUCache } from 'lru-cache';

// Definición de tipos
export interface CacheOptions<T> {
	max?: number; // Máximo número de elementos
	ttl?: number; // Tiempo de vida en ms
	updateAgeOnGet?: boolean;
	allowStale?: boolean;
	onEviction?: (key: string, value: T) => void;
}

export class EnhancedCache<T> {
	private cache: LRUCache<string, T>;
	private metrics: CacheMetrics;
	private name: string;

	constructor(name: string, options: CacheOptions<T> = {}) {
		this.name = name;
		this.metrics = {
			hits: 0,
			misses: 0,
			sets: 0,
			evictions: 0,
		};

		this.cache = new LRUCache<string, T>({
			max: options.max || 1000,
			ttl: options.ttl || 5 * 60 * 1000, // 5 minutos
			updateAgeOnGet: options.updateAgeOnGet ?? true,
			allowStale: options.allowStale ?? false,
			fetchMethod: undefined,
			dispose: (value, key) => {
				this.metrics.evictions++;
				options.onEviction?.(key as string, value);
			},
		});
	}

	set(key: string, value: T, ttl?: number): void {
		this.metrics.sets++;
		this.cache.set(key, value, { ttl });
	}

	get(key: string): T | undefined {
		const value = this.cache.get(key);
		if (value === undefined) {
			this.metrics.misses++;
		} else {
			this.metrics.hits++;
		}
		return value;
	}

	has(key: string): boolean {
		return this.cache.has(key);
	}

	delete(key: string): void {
		this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
		// Resetear métricas al limpiar
		this.resetMetrics();
	}

	// Métricas
	getMetrics(): CacheMetrics & { hitRate: number } {
		const total = this.metrics.hits + this.metrics.misses;
		const hitRate = total === 0 ? 0 : this.metrics.hits / total;
		return { ...this.metrics, hitRate };
	}

	private resetMetrics(): void {
		this.metrics = {
			hits: 0,
			misses: 0,
			sets: 0,
			evictions: 0,
		};
	}
}

interface CacheMetrics {
	hits: number;
	misses: number;
	sets: number;
	evictions: number;
}
```

### 2. Implementación de Caché Multinivel para Thumbnails

Para thumbnails, implementar un sistema de caché multinivel:

```typescript
export class MultiLevelCache<T> {
	private memoryCache: EnhancedCache<T>;
	private diskCache?: DiskCache<T>;

	constructor(options: MultiLevelCacheOptions<T>) {
		this.memoryCache = new EnhancedCache<T>(options.name, options.memoryOptions);

		if (options.useDiskCache) {
			this.diskCache = new DiskCache<T>({
				basePath: options.diskCachePath || '.cache',
				ttl: options.diskOptions?.ttl || 24 * 60 * 60 * 1000, // 1 día
				serialize: options.serialize || JSON.stringify,
				deserialize: options.deserialize || JSON.parse,
			});
		}
	}

	async get(key: string): Promise<T | undefined> {
		// 1. Intentar obtener de la caché en memoria
		const memValue = this.memoryCache.get(key);
		if (memValue !== undefined) {
			return memValue;
		}

		// 2. Si no está en memoria y tenemos caché en disco, intentar allí
		if (this.diskCache) {
			try {
				const diskValue = await this.diskCache.get(key);
				if (diskValue !== undefined) {
					// Guardar también en memoria para futuros accesos
					this.memoryCache.set(key, diskValue);
					return diskValue;
				}
			} catch (error) {
				console.warn(`Error accessing disk cache for key ${key}:`, error);
			}
		}

		return undefined;
	}

	async set(key: string, value: T, options?: { ttl?: number }): Promise<void> {
		// 1. Guardar en memoria
		this.memoryCache.set(key, value, options?.ttl);

		// 2. Guardar en disco si está habilitado
		if (this.diskCache) {
			try {
				await this.diskCache.set(key, value, options?.ttl);
			} catch (error) {
				console.warn(`Error saving to disk cache for key ${key}:`, error);
			}
		}
	}

	// ... otros métodos ...
}
```

### 3. Integración con React Query

Mejorar la integración con React Query configurándolo para usar el sistema de caché optimizado:

```typescript
// src/lib/react-query.ts
import { QueryClient } from '@tanstack/react-query';
import { cacheStorage } from '@/core/cache/cache-storage';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			gcTime: 1000 * 60 * 60, // 1 hora
			staleTime: 1000 * 60, // 1 minuto
			retry: (failureCount, error) => {
				// Estrategia de reintento personalizada
				if (error instanceof NetworkError) return failureCount < 3;
				return failureCount < 1;
			},
			refetchOnWindowFocus: (query) => {
				// Solo refrescar datos que cambian con frecuencia
				return ['stats', 'notifications'].includes(query.queryKey[0] as string);
			},
		},
	},
});

// Extender con método personalizado para la caché persistente
export const enhancedQueryClient = {
	...queryClient,
	async persistQuery(queryKey: unknown[], data: unknown, ttl?: number) {
		// Guardar en caché de React Query
		queryClient.setQueryData(queryKey, data);

		// Guardar también en nuestra caché persistente
		const cacheKey = JSON.stringify(queryKey);
		await cacheStorage.set(cacheKey, data, ttl);
	},
	async getPersistedQuery(queryKey: unknown[]) {
		// Intentar obtener de React Query primero
		const queryData = queryClient.getQueryData(queryKey);
		if (queryData) return queryData;

		// Si no está en React Query, intentar en nuestra caché persistente
		const cacheKey = JSON.stringify(queryKey);
		return await cacheStorage.get(cacheKey);
	},
};
```

### 4. Persistencia de Caché para Datos Cruciales

Implementar persistencia para datos importantes usando IndexedDB en clientes:

```typescript
// src/core/cache/persistent-cache.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CacheDB extends DBSchema {
	'cache-entries': {
		key: string;
		value: {
			data: unknown;
			expires: number | null;
		};
	};
}

export class PersistentCache {
	private dbPromise: Promise<IDBPDatabase<CacheDB>>;

	constructor() {
		this.dbPromise = openDB<CacheDB>('app-cache', 1, {
			upgrade(db) {
				db.createObjectStore('cache-entries');
			},
		});
	}

	async set(key: string, value: unknown, ttl?: number): Promise<void> {
		const expires = ttl ? Date.now() + ttl : null;
		const db = await this.dbPromise;
		await db.put('cache-entries', { data: value, expires }, key);
	}

	async get(key: string): Promise<unknown | undefined> {
		const db = await this.dbPromise;
		const entry = await db.get('cache-entries', key);

		if (!entry) return undefined;

		// Comprobar si ha expirado
		if (entry.expires && entry.expires < Date.now()) {
			await this.delete(key);
			return undefined;
		}

		return entry.data;
	}

	async delete(key: string): Promise<void> {
		const db = await this.dbPromise;
		await db.delete('cache-entries', key);
	}

	async clear(): Promise<void> {
		const db = await this.dbPromise;
		await db.clear('cache-entries');
	}

	// Método para limpiar entradas expiradas
	async cleanup(): Promise<void> {
		const db = await this.dbPromise;
		const now = Date.now();
		const tx = db.transaction('cache-entries', 'readwrite');
		const store = tx.objectStore('cache-entries');
		const keys = await store.getAllKeys();

		for (const key of keys) {
			const entry = await store.get(key);
			if (entry && entry.expires && entry.expires < now) {
				await store.delete(key);
			}
		}

		await tx.done;
	}
}
```

### 5. Sistema de Telemetría y Monitoreo

Implementar un sistema para monitorear el rendimiento de la caché:

```typescript
// src/core/telemetry/cache-metrics.ts
export class CacheMetricsCollector {
	private caches: Map<string, EnhancedCache<unknown>>;
	private metricsHistory: Map<string, CacheMetricSnapshot[]>;
	private intervalId?: NodeJS.Timeout;

	constructor() {
		this.caches = new Map();
		this.metricsHistory = new Map();
	}

	registerCache(name: string, cache: EnhancedCache<unknown>): void {
		this.caches.set(name, cache);
		this.metricsHistory.set(name, []);
	}

	startCollection(intervalMs: number = 60000): void {
		if (this.intervalId) {
			clearInterval(this.intervalId);
		}

		this.intervalId = setInterval(() => {
			this.collectMetricsSnapshot();
		}, intervalMs);

		// Colectar métricas iniciales
		this.collectMetricsSnapshot();
	}

	stopCollection(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = undefined;
		}
	}

	private collectMetricsSnapshot(): void {
		const timestamp = Date.now();

		for (const [name, cache] of this.caches.entries()) {
			const metrics = cache.getMetrics();
			const history = this.metricsHistory.get(name) || [];

			// Guardar snapshot
			history.push({
				timestamp,
				metrics,
			});

			// Limitar historial a últimas 100 entradas
			if (history.length > 100) {
				history.shift();
			}

			this.metricsHistory.set(name, history);
		}
	}

	getMetricsHistory(): Record<string, CacheMetricSnapshot[]> {
		const result: Record<string, CacheMetricSnapshot[]> = {};
		for (const [name, history] of this.metricsHistory.entries()) {
			result[name] = [...history];
		}
		return result;
	}

	getCurrentMetrics(): Record<string, CacheMetrics & { hitRate: number }> {
		const result: Record<string, CacheMetrics & { hitRate: number }> = {};
		for (const [name, cache] of this.caches.entries()) {
			result[name] = cache.getMetrics();
		}
		return result;
	}
}

interface CacheMetricSnapshot {
	timestamp: number;
	metrics: CacheMetrics & { hitRate: number };
}
```

## Plan de Implementación

### Fase 1: Refactorización de las Clases Base (2-3 días)

1. **Implementar EnhancedCache**:

   - Migrar de Map a LRUCache
   - Añadir sistema de métricas
   - Implementar unificación de configuración

2. **Crear Sistema Multinivel para Thumbnails**:
   - Implementar DiskCache
   - Implementar MultiLevelCache
   - Migrar thumbnail cache existente

### Fase 2: Integración con React Query (1-2 días)

1. **Optimizar Configuración de React Query**:

   - Ajustar staleTime y gcTime
   - Implementar estrategias de revalidación

2. **Crear Hooks Mejorados**:
   - Implementar hooks que combinen React Query y caché persistente
   - Añadir soporte para actualización optimista

### Fase 3: Persistencia y Monitoreo (2-3 días)

1. **Implementar Persistencia para Datos Críticos**:

   - Crear PersistentCache con IndexedDB
   - Integrar con sistema existente

2. **Crear Sistema de Monitoreo**:
   - Implementar CacheMetricsCollector
   - Crear dashboard para visualizar métricas
   - Configurar alertas para problemas

## Ejemplo de Uso

```typescript
// Creación de instancias de caché
const imagesCache = new MultiLevelCache<ImageData>({
	name: 'images',
	memoryOptions: {
		max: 100,
		ttl: 1000 * 60 * 30, // 30 minutos
	},
	useDiskCache: true,
	diskCachePath: '.image-cache',
	serialize: (data) => Buffer.from(JSON.stringify(data)),
	deserialize: (buffer) => JSON.parse(buffer.toString()),
});

// Hook personalizado para usar la caché
export function useImageData(imageId: string) {
	return useQuery({
		queryKey: ['image', imageId],
		queryFn: async () => {
			// 1. Intentar obtener de caché
			const cached = await imagesCache.get(imageId);
			if (cached) {
				return cached;
			}

			// 2. Si no está en caché, obtener de la API
			const data = await fetchImageData(imageId);

			// 3. Guardar en caché para futuros accesos
			await imagesCache.set(imageId, data);

			return data;
		},
		staleTime: 1000 * 60 * 5, // 5 minutos
	});
}
```

## Beneficios Esperados

1. **Mayor Rendimiento**: Implementación optimizada de LRUCache vs. Map
2. **Persistencia**: Datos importantes preservados entre sesiones
3. **Monitoreo**: Métricas detalladas para identificar problemas
4. **Mejor Experiencia de Usuario**: Reducción de tiempo de carga para datos frecuentes
5. **Reducción de Carga de Servidor**: Menos peticiones a la API/base de datos

## Conclusión

La optimización del sistema de caché proporcionará mejoras significativas en rendimiento y experiencia de usuario. El enfoque multinivel permite balancear velocidad (memoria) y persistencia (disco/IndexedDB), mientras que la integración con React Query simplifica el desarrollo.

Implementar estas mejoras permitirá a la aplicación escalar mejor, especialmente para conjuntos de datos grandes como las colecciones de imágenes, reduciendo la carga en el servidor y mejorando la experiencia del usuario.

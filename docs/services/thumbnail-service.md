# 🖼️ Servicio de Thumbnails

## 📝 Descripción

El servicio de thumbnails es un componente especializado que maneja la generación, gestión y optimización de miniaturas para las imágenes en la aplicación. Implementa un sistema robusto de cola, caché y optimización para garantizar un rendimiento óptimo.

## 🔧 Características Principales

### Gestión de Calidad

```typescript
compressed: { quality: 60, width: 200, height: 200 }
low: { quality: 70, width: 300, height: 300 }
mid: { quality: 80, width: 400, height: 400 }
high: { quality: 90, width: 500, height: 500 }
ultra: { quality: 100, width: 800, height: 800 }
```

### Sistema de Cola Mejorado

- Cola de pre-generación para procesamiento asíncrono
- Procesamiento en segundo plano con prioridades
- Control de concurrencia configurable
- Reintentos automáticos con backoff exponencial
- Límites de memoria configurables
- Cancelación de tareas
- Pausado/Reanudación de cola

### Monitoreo y Estadísticas

```typescript
interface ThumbnailStats {
	total: number;
	totalSize: number;
	pending: number;
	withThumbnail: number;
	recentlyProcessed: {
		id: string;
		path: string;
		processedAt: Date;
		quality: ThumbnailQuality;
		size: number;
		processingTime: number;
	}[];
	errors: ThumbnailError[];
	performance: {
		averageProcessingTime: number;
		peakMemoryUsage: number;
		successRate: number;
	};
}
```

## 🏗️ Estructura

### Configuración

```typescript
interface ThumbnailConfig {
	quality: ThumbnailQuality;
	width: number;
	height: number;
	format: "webp" | "jpeg" | "png";
	compression: {
		enabled: boolean;
		level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
	};
	cache: {
		enabled: boolean;
		maxAge: number;
		maxSize: number;
	};
	queue: {
		concurrency: number;
		maxRetries: number;
		backoffDelay: number;
		timeout: number;
		maxMemory: number;
	};
}

type ThumbnailQuality = "compressed" | "low" | "mid" | "high" | "ultra";
```

### Gestión de Errores

```typescript
interface ThumbnailError {
	imageId: string;
	imagePath: string;
	error: string;
	timestamp: Date;
	attempts: number;
	lastAttempt: {
		quality: ThumbnailQuality;
		error: string;
		memoryUsage: number;
	};
}
```

## 📚 Métodos Principales

### `getThumbnail`

```typescript
async function getThumbnail(
	imageId: string,
	options: {
		quality: ThumbnailQuality;
		priority?: "high" | "normal" | "low";
		force?: boolean;
		timeout?: number;
	}
): Promise<ThumbnailResult>;
```

- Recupera thumbnails con sistema de caché multinivel
- Soporte para prioridades
- Reintentos automáticos con backoff exponencial
- Timeout configurable
- Conversión a base64/blob/buffer
- Soporte para streaming

### `generateThumbnail`

```typescript
async function generateThumbnail(
	imagePath: string,
	options: {
		quality: ThumbnailQuality;
		format?: "webp" | "jpeg" | "png";
		compression?: {
			enabled: boolean;
			level: number;
		};
	}
): Promise<ThumbnailResult>;
```

- Generación en múltiples calidades
- Optimización automática
- Compresión configurable
- Manejo de memoria optimizado
- Soporte para cancelación
- Eventos de progreso

### `reprocessAll`

```typescript
async function reprocessAll(options: {
	filter?: (image: ImageMetadata) => boolean;
	batchSize?: number;
	onProgress?: (progress: ReprocessProgress) => void;
	onError?: (error: ThumbnailError) => void;
}): Promise<ReprocessResult>;
```

- Reprocesamiento selectivo
- Procesamiento por lotes
- Sistema de eventos SSE
- Pausado/Reanudación
- Estadísticas detalladas

### `optimizeThumbnails`

```typescript
async function optimizeThumbnails(options: {
	minSavings?: number;
	aggressive?: boolean;
	onProgress?: (progress: OptimizationProgress) => void;
}): Promise<OptimizationResult>;
```

- Optimización inteligente
- Modo agresivo opcional
- Preservación de calidad
- Análisis de ahorro
- Reporte detallado

### `cleanThumbnails`

```typescript
async function cleanThumbnails(options: {
	dryRun?: boolean;
	older?: Date;
	unused?: boolean;
	onProgress?: (progress: CleanupProgress) => void;
}): Promise<CleanupResult>;
```

- Modo simulación
- Limpieza selectiva
- Validación de integridad
- Backup automático
- Reporte detallado

## 🔄 Sistema de Eventos SSE

### Tipos de Eventos

```typescript
type ThumbnailEventType =
	| "start"
	| "progress"
	| "error"
	| "warning"
	| "complete"
	| "pause"
	| "resume";

interface ThumbnailEvent {
	type: ThumbnailEventType;
	data: {
		// Datos comunes
		status?: string;
		current?: number;
		total?: number;
		progress?: number;

		// Datos específicos
		currentFile?: string;
		lastProcessed?: {
			id: string;
			path: string;
			processedAt: string;
			quality: ThumbnailQuality;
			saved?: number;
			freed?: number;
			processingTime?: number;
			memoryUsage?: number;
		};
		error?: string;
		warning?: string;
		imageId?: string;

		// Métricas
		performance?: {
			cpu: number;
			memory: number;
			diskIO: number;
		};

		// Resultados
		processed?: number;
		optimized?: number;
		cleaned?: number;
		errors?: number;
		warnings?: number;
		totalSaved?: number;
		totalFreed?: number;
		averageProcessingTime?: number;
	};
}

type ThumbnailEventCallback = (event: ThumbnailEvent) => void;
```

## 🔐 Seguridad y Optimización

### Timeouts y Reintentos

- Timeout por defecto: 5 minutos
- Máximo de reintentos: 3
- Delay entre reintentos: Exponencial (1s, 2s, 4s)
- Pausa entre procesamiento: Adaptativa

### Caché Multinivel

- Memoria (LRU)
- Disco (persistente)
- CDN (opcional)
- Invalidación inteligente
- Precarga predictiva

### Optimización de Recursos

- Gestión de memoria dinámica
- Liberación proactiva
- Compresión adaptativa
- Procesamiento por lotes
- Priorización inteligente

## 📈 Monitoreo

### Métricas en Tiempo Real

- Rendimiento del procesamiento
- Uso de recursos
- Tasa de éxito/error
- Tiempo de respuesta
- Uso de caché
- Ahorro de espacio

### Alertas y Notificaciones

- Errores críticos
- Uso excesivo de recursos
- Degradación de rendimiento
- Problemas de caché
- Espacio insuficiente

## 🔗 Integración

### API REST

```typescript
// Endpoints principales
GET /api/thumbnails/:imageId
POST /api/thumbnails/generate
POST /api/thumbnails/reprocess
POST /api/thumbnails/optimize
DELETE /api/thumbnails/clean

// Endpoints de monitoreo
GET /api/thumbnails/stats
GET /api/thumbnails/health
GET /api/thumbnails/metrics
```

### WebSocket/SSE

```typescript
// Eventos en tiempo real
//api/thumbnails/events
ws: GET / api / thumbnails / sse;
```

## 📝 Notas Técnicas

### Mejores Prácticas

- Uso de workers para procesamiento pesado
- Implementación de circuit breaker
- Manejo de memoria optimizado
- Logging estructurado
- Métricas detalladas
- Testing exhaustivo

### Consideraciones de Rendimiento

- Procesamiento asíncrono
- Caché multinivel
- Compresión adaptativa
- Priorización inteligente
- Gestión de recursos
- Monitoreo proactivo

# 🖼️ Servicio de Thumbnails

## 📝 Descripción

El servicio de thumbnails es un componente especializado que maneja la generación, gestión y optimización de miniaturas para las imágenes en la aplicación.

## 🔧 Características Principales

### Gestión de Calidad

```typescript
compressed: { quality: 60, width: 200, height: 200 }
low: { quality: 70, width: 300, height: 300 }
mid: { quality: 80, width: 400, height: 400 }
high: { quality: 90, width: 500, height: 500 }
```

### Sistema de Cola

- Cola de pre-generación para procesamiento asíncrono
- Procesamiento en segundo plano
- Control de concurrencia
- Reintentos automáticos

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
	}[];
	errors: ThumbnailError[];
}
```

## 🏗️ Estructura

### Configuración

```typescript
interface ThumbnailConfig {
	quality: ThumbnailQuality;
	width: number;
	height: number;
	format: "webp";
}

type ThumbnailQuality = "compressed" | "low" | "mid" | "high";
```

### Gestión de Errores

```typescript
interface ThumbnailError {
	imageId: string;
	imagePath: string;
	error: string;
	timestamp: Date;
}
```

## 📚 Métodos Principales

### `getThumbnail`

- Recupera thumbnails con sistema de caché
- Reintentos automáticos (3 intentos)
- Timeout de 5 minutos
- Conversión a base64

### `generateThumbnail`

- Genera thumbnails en diferentes calidades
- Optimización automática
- Manejo de errores robusto
- Actualización de estadísticas

### `reprocessAll`

- Reprocesa todos los thumbnails
- Sistema de eventos SSE para progreso
- Manejo de errores por evento
- Callbacks de progreso

### `optimizeThumbnails`

- Optimiza thumbnails existentes
- Reduce tamaño manteniendo calidad
- Monitoreo de progreso
- Gestión de errores

### `cleanThumbnails`

- Limpieza de thumbnails huérfanos
- Validación de integridad
- Reporte de limpieza
- Manejo seguro de eliminación

## 🔄 Sistema de Eventos SSE

### Tipos de Eventos

```typescript
type ThumbnailEventType = "start" | "progress" | "error" | "complete";

interface ThumbnailEvent {
	type: ThumbnailEventType;
	data: {
		// Datos comunes
		status?: string;
		current?: number;
		total?: number;
		progress?: number;

		// Datos específicos por tipo
		currentFile?: string;
		lastProcessed?: {
			id: string;
			path: string;
			processedAt: string;
			saved?: number;
			freed?: number;
		};
		error?: string;
		imageId?: string;

		// Datos de completado
		processed?: number;
		optimized?: number;
		cleaned?: number;
		errors?: number;
		totalSaved?: number;
		totalFreed?: number;
	};
}

type ThumbnailEventCallback = (event: ThumbnailEvent) => void;
```

### Flujo de Eventos

1. **Inicio (`start`)**

   ```typescript
   {
   	type: 'start',
   	data: {
   		total: number;
   		status: string;
   	}
   }
   ```

2. **Progreso (`progress`)**

   ```typescript
   {
   	type: 'progress',
   	data: {
   		current: number;
   		total: number;
   		progress: number;
   		currentFile: string;
   		status: string;
   		lastProcessed: {
   			id: string;
   			path: string;
   			processedAt: string;
   			saved?: number;
   			freed?: number;
   		}
   	}
   }
   ```

3. **Error (`error`)**

   ```typescript
   {
   	type: 'error',
   	data: {
   		imageId?: string;
   		path?: string;
   		error: string;
   	}
   }
   ```

4. **Completado (`complete`)**
   ```typescript
   {
   	type: 'complete',
   	data: {
   		processed?: number;
   		optimized?: number;
   		cleaned?: number;
   		errors: number;
   		total: number;
   		totalSaved?: number;
   		totalFreed?: number;
   	}
   }
   ```

## 🔐 Seguridad y Optimización

### Timeouts y Reintentos

- Timeout por defecto: 5 minutos
- Máximo de reintentos: 3
- Delay entre reintentos: 1 segundo
- Pausa entre procesamiento: 100ms

### Caché

- Sistema de caché en memoria
- Claves únicas por imagen y calidad
- Invalidación automática
- Limpieza periódica

## 📈 Monitoreo

### Métricas Disponibles

- Total de thumbnails
- Tamaño total
- Pendientes de procesamiento
- Errores de generación
- Últimos procesados
- Espacio ahorrado
- Espacio liberado

### Mantenimiento

- Limpieza periódica
- Optimización bajo demanda
- Regeneración masiva
- Validación de integridad

## 🔗 Diagramas de Flujo

### Generación de Thumbnail

```mermaid
flowchart TD
	A[Solicitud] --> B{Cola Disponible}
	B -->|Sí| C[Agregar a Cola]
	B -->|No| D[Cola Llena]
	C --> E[Procesar]
	E --> F{Error}
	F -->|Sí| G[Reintentar]
	F -->|No| H[Guardar]
	G -->|Max Intentos| I[Error Final]
	H --> J[Actualizar Stats]
	J --> K[Notificar]
```

### Sistema de Cola

```mermaid
flowchart TD
	A[Nueva Tarea] --> B[Pre-Generación]
	B --> C{Cola Activa}
	C -->|Sí| D[Encolar]
	C -->|No| E[Iniciar Cola]
	D --> F[Esperar Turno]
	E --> F
	F --> G[Procesar]
	G --> H[Siguiente]
```

### Monitoreo y Eventos SSE

```mermaid
flowchart TD
	A[Inicio] --> B[Conectar SSE]
	B --> C{Tipo Evento}
	C -->|Start| D[Inicializar UI]
	C -->|Progress| E[Actualizar Progreso]
	C -->|Error| F[Manejar Error]
	C -->|Complete| G[Finalizar]
	D --> H[Siguiente Evento]
	E --> H
	F --> I[Reintentar/Parar]
	G --> J[Cerrar Conexión]
```

### Mantenimiento

```mermaid
flowchart TD
	A[Inicio] --> B[Verificar Stats]
	B --> C{Problemas}
	C -->|Sí| D[Limpiar Cache]
	C -->|No| E[OK]
	D --> F[Reindexar]
	F --> G[Actualizar]
	G --> H[Verificar]
```

## 🔗 Dependencias

- Sharp: Procesamiento de imágenes
- EventSource: Sistema de eventos SSE
- Cache: Sistema de caché
- Prisma: Persistencia

## 🚧 Áreas de Mejora

- Implementar procesamiento en lote más eficiente
- Mejorar sistema de prioridades
- Añadir compresión adaptativa
- Optimizar uso de memoria
- Mejorar manejo de reconexión SSE
- Implementar retry con backoff exponencial

## 📝 Notas Técnicas

- Patrón Singleton
- Procesamiento asíncrono
- Sistema de eventos SSE
- Gestión de memoria optimizada
- Manejo de errores robusto
- Feedback en tiempo real

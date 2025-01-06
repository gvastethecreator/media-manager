# 📁 Servicio de Carpetas

## 📝 Descripción

El servicio de carpetas gestiona la indexación, monitoreo y mantenimiento de carpetas en el sistema, proporcionando una interfaz para el manejo de directorios y su contenido. Utiliza Server-Sent Events (SSE) para proporcionar actualizaciones en tiempo real del progreso de indexación.

## 🔧 Características Principales

### Estructura de Carpeta

```typescript
interface FolderResponse {
	id: string;
	name: string;
	path: string;
	isWatched: boolean;
	totalFiles: number;
	totalSize: number;
	lastIndexed: string | null;
	createdAt: string;
	updatedAt: string;
	_count?: {
		images: number;
	};
}
```

### Sistema de Eventos y Callbacks

```typescript
interface ProcessStatus {
	status?: string;
	current?: number;
	total?: number;
	progress?: number;
	currentFile?: string;
}

interface IndexCallbacks {
	onProgress?: (status: ProcessStatus) => void;
	onError?: (error: Error) => void;
	onComplete?: () => void;
}
```

## 📚 Métodos Principales

### `getFolders`

- Recupera todas las carpetas indexadas
- Incluye estadísticas básicas
- Manejo de errores integrado
- Respuesta tipada

### `addFolder`

- Agrega nueva carpeta al sistema
- Implementa SSE para progreso en tiempo real
- Sistema de callbacks para estados
- Manejo de errores robusto
- Eventos de progreso detallados

### `indexFolder`

- Indexa contenido de carpeta
- SSE para monitoreo en tiempo real
- Callbacks para estados del proceso
- Logging detallado
- Progreso por archivo

### `reindexFolder`

- Re-indexa carpeta existente
- Mantiene mismos callbacks
- Actualiza estadísticas
- Preserva configuración
- SSE para progreso

### `deleteFolder`

- Elimina carpeta del sistema
- Limpieza de recursos asociados
- Validación de existencia
- Manejo seguro de errores

## 🔄 Flujo de Trabajo

### Indexación

1. Creación/Selección de carpeta
2. Inicio de indexación con SSE
3. Monitoreo de progreso en tiempo real
4. Actualización de estadísticas
5. Finalización y callbacks

### Eventos SSE

#### Tipos de Eventos

- `progress`: Actualización de progreso
- `error`: Notificación de errores
- `complete`: Finalización del proceso

#### Estructura de Eventos

```typescript
// Evento de Progreso
{
	type: 'progress',
	data: {
		status: string,
		current: number,
		total: number,
		progress: number,
		currentFile?: string
	}
}

// Evento de Error
{
	type: 'error',
	data: {
		type: string,
		message: string
	}
}

// Evento de Completado
{
	type: 'complete',
	data: {
		folder: FolderResponse,
		stats: {
			processed: number,
			total: number,
			totalSize: number
		}
	}
}
```

## 🔐 Seguridad

### Validaciones

- Verificación de rutas
- Permisos de acceso
- Existencia de carpeta
- Integridad de datos
- Manejo de conexiones SSE

## 📈 Optimizaciones

### Proceso de Indexación

- Indexación asíncrona con SSE
- Procesamiento por lotes
- Caché de resultados
- Reintento automático
- Progreso en tiempo real

### Monitoreo

- Eventos SSE en tiempo real
- Actualización progresiva
- Gestión de memoria
- Control de concurrencia
- Estado detallado por archivo

## 🔗 Dependencias

- EventSourcePolyfill
- Fetch API
- Sistema de archivos
- API de carpetas
- TransformStream para SSE

## 🚧 Áreas de Mejora

- Optimizar manejo de errores
- Mejorar reconexión SSE
- Añadir filtros avanzados
- Implementar búsqueda
- Caché de thumbnails

## 📝 Notas Técnicas

- Uso de EventSource
- Manejo asíncrono
- Logging detallado
- Tipado estricto
- SSE para tiempo real

## 🔄 Integración

### API Endpoints

- `/api/folders`: CRUD básico con SSE
- `/api/folders/:id/index`: Indexación con SSE
- `/api/folders/:id`: Operaciones específicas

### Eventos SSE

- Progreso de indexación
- Errores del proceso
- Completado de operaciones
- Estado del sistema
- Progreso por archivo

## 🔄 Diagramas de Flujo

### Indexación de Carpeta con SSE

```mermaid
flowchart TD
	A[Nueva Carpeta] --> B[Iniciar SSE]
	B --> C[Validar Path]
	C --> D[Crear Registro]
	D --> E[Iniciar Indexado]
	E --> F{Archivos}
	F -->|Imagen| G[Procesar]
	F -->|Otro| H[Ignorar]
	G --> I[Enviar Progreso]
	I --> J[Siguiente]
	J --> F
	F -->|Fin| K[Enviar Complete]
```

### Sistema de Eventos SSE

```mermaid
flowchart TD
	A[Proceso] --> B{Evento}
	B -->|Progress| C[Enviar Status]
	B -->|Error| D[Enviar Error]
	B -->|Complete| E[Enviar Complete]
	C --> F[Actualizar UI]
	D --> G[Manejar Error]
	E --> H[Finalizar]
```

### Monitoreo de Carpeta

```mermaid
flowchart TD
	A[SSE] --> B{Tipo}
	B -->|Progress| C[Actualizar]
	B -->|Error| D[Notificar]
	B -->|Complete| E[Finalizar]
	C --> F[UI]
	D --> F
	E --> F
```

### Gestión de Errores

```mermaid
flowchart TD
	A[Error] --> B{Tipo}
	B -->|SSE| C[Reconectar]
	B -->|Path| D[Validar]
	B -->|IO| E[Reintentar]
	C --> F[Notificar]
	D --> F
	E -->|Max| F
```

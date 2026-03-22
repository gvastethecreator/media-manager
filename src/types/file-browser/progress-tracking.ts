/**
 * @file Tipos para el sistema de seguimiento de progreso
 * @module types/file-browser/progress-tracking
 * @description Define todas las interfaces y tipos para el sistema de progreso
 */

/**
 * Estados posibles de una operación de progreso
 */
export type ProgressStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

/**
 * Tipos de operaciones disponibles
 */
export type OperationType =
	| 'file_copy'
	| 'file_move'
	| 'file_delete'
	| 'file_upload'
	| 'file_download'
	| 'file_compress'
	| 'file_extract'
	| 'image_resize'
	| 'image_convert'
	| 'video_convert'
	| 'audio_convert'
	| 'thumbnail_generate'
	| 'metadata_extract'
	| 'search_index'
	| 'backup_create'
	| 'backup_restore'
	| 'sync_files'
	| 'batch_operation'
	| 'custom';

/**
 * Información de progreso de una operación
 */
export interface ProgressInfo {
	/** Valor actual del progreso */
	current: number;
	/** Duración total en milisegundos */
	duration: number;
	/** Tiempo de finalización */
	endTime: number | null;
	/** Tiempo estimado de finalización (timestamp) */
	eta: number | null;
	/** Porcentaje completado (0-100) */
	percentage: number;
	/** Velocidad actual (items/segundo o bytes/segundo) */
	speed: number;
	/** Tiempo de inicio */
	startTime: number | null;
	/** Valor total del progreso */
	total: number;
}

/**
 * Información de items procesados
 */
export interface ItemsInfo {
	/** Items fallidos */
	failed: number;
	/** Items procesados */
	processed: number;
	/** Items restantes */
	remaining: number;
	/** Items omitidos */
	skipped: number;
	/** Total de items */
	total: number;
}

/**
 * Información de tamaño procesado
 */
export interface SizeInfo {
	/** Bytes procesados */
	processed: number;
	/** Bytes restantes */
	remaining: number;
	/** Total de bytes */
	total: number;
}

/**
 * Paso individual de una operación
 */
export interface ProgressStep {
	/** Datos específicos del paso */
	data?: Record<string, any>;
	/** Descripción del paso */
	description?: string;
	/** Tiempo de finalización */
	endTime: number | null;
	/** Error si el paso falló */
	error: string | null;
	/** Duración estimada en milisegundos */
	estimatedDuration?: number;
	/** ID único del paso */
	id: string;
	/** Metadatos del paso */
	metadata: Record<string, any>;
	/** Nombre del paso */
	name: string;
	/** Si el paso es opcional */
	optional: boolean;
	/** Orden del paso */
	order: number;
	/** Progreso del paso (0-100) */
	progress: number;
	/** Tiempo de inicio */
	startTime: number | null;
	/** Estado del paso */
	status: ProgressStatus;
}

/**
 * Callbacks para una operación de progreso
 */
export interface ProgressCallbacks {
	/** Callback de cancelación */
	onCancel?: (operation: ProgressOperation) => void;
	/** Callback cuando se completa la operación */
	onComplete?: (operation: ProgressOperation) => void;
	/** Callback de error */
	onError?: (error: Error, operation: ProgressOperation) => void;
	/** Callback de pausa */
	onPause?: (operation: ProgressOperation) => void;
	/** Callback de progreso */
	onProgress?: (operation: ProgressOperation) => void;
	/** Callback de reanudación */
	onResume?: (operation: ProgressOperation) => void;
	/** Callback cuando se completa un paso */
	onStepComplete?: (step: ProgressStep, operation: ProgressOperation) => void;
}

/**
 * Operación de progreso completa
 */
export interface ProgressOperation {
	/** Callbacks de la operación */
	callbacks?: ProgressCallbacks;
	/** Si la operación se puede cancelar */
	cancellable?: boolean;
	/** Timestamp de creación */
	createdAt: number;
	/** Paso actual */
	currentStep: string | null;
	/** Descripción de la operación */
	description?: string;
	/** Error si la operación falló */
	error: string | null;
	/** ID único de la operación */
	id: string;
	/** Información de items */
	items: ItemsInfo;
	/** Metadatos adicionales */
	metadata: Record<string, any>;
	/** Nombre de la operación */
	name: string;
	/** Si la operación se puede pausar */
	pausable?: boolean;
	/** Si la operación está pausada */
	paused?: boolean;
	/** Prioridad de la operación */
	priority: number;
	/** Información de progreso */
	progress: ProgressInfo;
	/** ID de la cola */
	queueId?: string;
	/** Número de reintentos */
	retryCount: number;
	/** Información de tamaño */
	size: SizeInfo;
	/** Timestamp de inicio */
	startTime: number | null;
	/** Estado actual */
	status: ProgressStatus;
	/** Pasos de la operación */
	steps: ProgressStep[];
	/** Tipo de operación */
	type: OperationType;
	/** Timestamp de última actualización */
	updatedAt: number;
}

/**
 * Cola de operaciones
 */
export interface ProgressQueue {
	/** Operaciones actualmente ejecutándose */
	activeOperations: string[];
	/** Timestamp de creación */
	createdAt: number;
	/** Descripción de la cola */
	description?: string;
	/** ID único de la cola */
	id: string;
	/** Máximo de operaciones concurrentes */
	maxConcurrent: number;
	/** Metadatos de la cola */
	metadata: Record<string, any>;
	/** Nombre de la cola */
	name: string;
	/** IDs de operaciones en la cola */
	operationIds: string[];
	/** Si la cola está pausada */
	paused: boolean;
	/** Prioridad de la cola */
	priority: 'low' | 'normal' | 'high' | 'critical';
	/** Timestamp de última actualización */
	updatedAt: number;
}

/**
 * Notificación de progreso
 */
export interface ProgressNotification {
	/** ID único de la notificación */
	id: string;
	/** Mensaje de la notificación */
	message: string;
	/** Metadatos adicionales */
	metadata?: Record<string, any>;
	/** ID de la operación relacionada */
	operationId?: string;
	/** Si la notificación ha sido leída */
	read: boolean;
	/** Timestamp de la notificación */
	timestamp: number;
	/** Título de la notificación */
	title: string;
	/** Tipo de notificación */
	type: 'info' | 'success' | 'warning' | 'error';
}

/**
 * Actividad reciente
 */
export interface RecentActivity {
	/** Información adicional */
	metadata?: Record<string, any>;
	/** ID de la operación */
	operationId: string;
	/** Timestamp de la actividad */
	timestamp: number;
	/** Tipo de actividad */
	type: 'created' | 'started' | 'completed' | 'failed' | 'cancelled';
}

/**
 * Estadísticas del sistema de progreso
 */
export interface ProgressStatistics {
	/** Operaciones activas */
	activeOperations: number;
	/** Duración promedio */
	averageDuration: number;
	/** Velocidad promedio */
	averageSpeed: number;
	/** Operaciones canceladas */
	cancelledOperations: number;
	/** Operaciones completadas */
	completedOperations: number;
	/** Operaciones fallidas */
	failedOperations: number;
	/** Uso de memoria */
	memoryUsage: number;
	/** Operaciones por estado */
	operationsByStatus: Record<string, number>;
	/** Operaciones por tipo */
	operationsByType: Record<string, number>;
	/** Actividad reciente */
	recentActivity: RecentActivity[];
	/** Tasa de éxito */
	successRate: number;
	/** Total de operaciones */
	totalOperations: number;
	/** Total de items procesados */
	totalProcessedItems: number;
	/** Total de bytes procesados */
	totalProcessedSize: number;
}

/**
 * Configuración del sistema de progreso
 */
export interface ProgressSystemConfig {
	/** Si se debe limpiar automáticamente */
	autoCleanup: boolean;
	/** Tamaño del lote */
	batchSize: number;
	/** Intervalo de limpieza en milisegundos */
	cleanupInterval: number;
	/** Operaciones concurrentes */
	concurrentOperations: number;
	/** Si se deben habilitar métricas */
	enableMetrics: boolean;
	/** Si se deben habilitar notificaciones */
	enableNotifications: boolean;
	/** Si se debe habilitar persistencia */
	enablePersistence: boolean;
	/** Si se debe habilitar la cola */
	enableQueue: boolean;
	/** Precisión de estimación */
	estimationAccuracy: number;
	/** Máximo número de notificaciones */
	maxNotifications: number;
	/** Máximo número de operaciones */
	maxOperations: number;
	/** Límite de memoria */
	memoryLimit: number;
	/** Número de reintentos */
	retryAttempts: number;
	/** Delay entre reintentos */
	retryDelay: number;
}

/**
 * Eventos del sistema de progreso
 */
export interface ProgressEvents {
	/** Cuando cambia la configuración */
	onConfigChanged?: (config: ProgressSystemConfig) => void;
	/** Cuando ocurre un error */
	onError?: (error: Error) => void;
	/** Cuando se agrega una notificación */
	onNotificationAdded?: (notification: ProgressNotification) => void;
	/** Cuando se cancela una operación */
	onOperationCancelled?: (operation: ProgressOperation) => void;
	/** Cuando se completa una operación */
	onOperationCompleted?: (operation: ProgressOperation) => void;
	/** Cuando se crea una operación */
	onOperationCreated?: (operation: ProgressOperation) => void;
	/** Cuando falla una operación */
	onOperationFailed?: (operation: ProgressOperation, error: Error) => void;
	/** Cuando se pausa una operación */
	onOperationPaused?: (operation: ProgressOperation) => void;
	/** Cuando hay progreso en una operación */
	onOperationProgress?: (operation: ProgressOperation) => void;
	/** Cuando se reanuda una operación */
	onOperationResumed?: (operation: ProgressOperation) => void;
	/** Cuando se inicia una operación */
	onOperationStarted?: (operation: ProgressOperation) => void;
	/** Cuando se actualiza una cola */
	onQueueUpdated?: (queue: ProgressQueue) => void;
	/** Cuando se actualizan las estadísticas */
	onStatisticsUpdated?: (statistics: ProgressStatistics) => void;
}

/**
 * Filtros para operaciones
 */
export interface ProgressFilter {
	/** Mostrar solo operaciones activas */
	activeOnly?: boolean;
	/** Mostrar solo operaciones cancelables */
	cancellableOnly?: boolean;
	/** Mostrar solo operaciones completadas */
	completedOnly?: boolean;
	/** Filtrar por rango de fechas */
	dateRange?: {
		start: number;
		end: number;
	};
	/** Filtrar por IDs de entidades */
	entityIds?: string[];
	/** Mostrar solo operaciones con errores */
	errorOnly?: boolean;
	/** Filtrar por tipo de operación */
	operationType?: OperationType;
	/** Mostrar solo operaciones pausables */
	pausableOnly?: boolean;
	/** Filtrar por prioridad */
	priorities?: ('low' | 'normal' | 'high' | 'critical')[];
	/** Filtrar por prioridad */
	priority?: number[];
	/** Filtrar por cola */
	queueId?: string;
	/** Filtrar por texto */
	searchText?: string;
	/** Filtrar por estado */
	statuses?: ProgressStatus[];
	/** Filtrar por tipo */
	types?: OperationType[];
	/** Filtrar por ID de usuario */
	userId?: string;
}

/**
 * Opciones de ordenamiento
 */
export interface ProgressSortOptions {
	/** Dirección del ordenamiento */
	direction: 'asc' | 'desc';
	/** Campo por el que ordenar */
	field: 'createdAt' | 'updatedAt' | 'name' | 'type' | 'priority' | 'progress';
}

/**
 * Opciones de vista para el progreso
 */
export interface ProgressViewOptions {
	/** Página actual */
	currentPage?: number;
	/** Número de items por página */
	itemsPerPage?: number;
	/** Mostrar operaciones canceladas */
	showCancelled?: boolean;
	/** Mostrar operaciones completadas */
	showCompleted?: boolean;
	/** Mostrar operaciones fallidas */
	showFailed?: boolean;
	/** Mostrar notificaciones */
	showNotifications?: boolean;
	/** Mostrar estadísticas */
	showStatistics?: boolean;
	/** Mostrar detalles de pasos */
	showSteps?: boolean;
	/** Modo de vista */
	viewMode?: 'list' | 'grid' | 'compact';
}

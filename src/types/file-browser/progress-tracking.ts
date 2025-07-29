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
  /** Valor total del progreso */
  total: number;
  /** Porcentaje completado (0-100) */
  percentage: number;
  /** Velocidad actual (items/segundo o bytes/segundo) */
  speed: number;
  /** Tiempo estimado de finalización (timestamp) */
  eta: number | null;
  /** Tiempo de inicio */
  startTime: number | null;
  /** Tiempo de finalización */
  endTime: number | null;
  /** Duración total en milisegundos */
  duration: number;
}

/**
 * Información de items procesados
 */
export interface ItemsInfo {
  /** Items procesados */
  processed: number;
  /** Total de items */
  total: number;
  /** Items fallidos */
  failed: number;
  /** Items omitidos */
  skipped: number;
  /** Items restantes */
  remaining: number;
}

/**
 * Información de tamaño procesado
 */
export interface SizeInfo {
  /** Bytes procesados */
  processed: number;
  /** Total de bytes */
  total: number;
  /** Bytes restantes */
  remaining: number;
}

/**
 * Paso individual de una operación
 */
export interface ProgressStep {
  /** ID único del paso */
  id: string;
  /** Nombre del paso */
  name: string;
  /** Descripción del paso */
  description?: string;
  /** Estado del paso */
  status: ProgressStatus;
  /** Progreso del paso (0-100) */
  progress: number;
  /** Tiempo de inicio */
  startTime: number | null;
  /** Tiempo de finalización */
  endTime: number | null;
  /** Duración estimada en milisegundos */
  estimatedDuration?: number;
  /** Orden del paso */
  order: number;
  /** Si el paso es opcional */
  optional: boolean;
  /** Metadatos del paso */
  metadata: Record<string, any>;
  /** Error si el paso falló */
  error: string | null;
  /** Datos específicos del paso */
  data?: Record<string, any>;
}

/**
 * Callbacks para una operación de progreso
 */
export interface ProgressCallbacks {
  /** Callback de progreso */
  onProgress?: (operation: ProgressOperation) => void;
  /** Callback cuando se completa un paso */
  onStepComplete?: (step: ProgressStep, operation: ProgressOperation) => void;
  /** Callback cuando se completa la operación */
  onComplete?: (operation: ProgressOperation) => void;
  /** Callback de error */
  onError?: (error: Error, operation: ProgressOperation) => void;
  /** Callback de cancelación */
  onCancel?: (operation: ProgressOperation) => void;
  /** Callback de pausa */
  onPause?: (operation: ProgressOperation) => void;
  /** Callback de reanudación */
  onResume?: (operation: ProgressOperation) => void;
}

/**
 * Operación de progreso completa
 */
export interface ProgressOperation {
  /** ID único de la operación */
  id: string;
  /** Tipo de operación */
  type: OperationType;
  /** Nombre de la operación */
  name: string;
  /** Descripción de la operación */
  description?: string;
  /** Estado actual */
  status: ProgressStatus;
  /** Información de progreso */
  progress: ProgressInfo;
  /** Información de items */
  items: ItemsInfo;
  /** Información de tamaño */
  size: SizeInfo;
  /** Pasos de la operación */
  steps: ProgressStep[];
  /** Paso actual */
  currentStep: string | null;
  /** Prioridad de la operación */
  priority: number;
  /** ID de la cola */
  queueId?: string;
  /** Metadatos adicionales */
  metadata: Record<string, any>;
  /** Error si la operación falló */
  error: string | null;
  /** Número de reintentos */
  retryCount: number;
  /** Timestamp de creación */
  createdAt: number;
  /** Timestamp de última actualización */
  updatedAt: number;
  /** Timestamp de inicio */
  startTime: number | null;
  /** Callbacks de la operación */
  callbacks?: ProgressCallbacks;
  /** Si la operación se puede cancelar */
  cancellable?: boolean;
  /** Si la operación se puede pausar */
  pausable?: boolean;
  /** Si la operación está pausada */
  paused?: boolean;
}

/**
 * Cola de operaciones
 */
export interface ProgressQueue {
  /** ID único de la cola */
  id: string;
  /** Nombre de la cola */
  name: string;
  /** Descripción de la cola */
  description?: string;
  /** IDs de operaciones en la cola */
  operationIds: string[];
  /** Máximo de operaciones concurrentes */
  maxConcurrent: number;
  /** Operaciones actualmente ejecutándose */
  activeOperations: string[];
  /** Prioridad de la cola */
  priority: 'low' | 'normal' | 'high' | 'critical';
  /** Si la cola está pausada */
  paused: boolean;
  /** Timestamp de creación */
  createdAt: number;
  /** Timestamp de última actualización */
  updatedAt: number;
  /** Metadatos de la cola */
  metadata: Record<string, any>;
}

/**
 * Notificación de progreso
 */
export interface ProgressNotification {
  /** ID único de la notificación */
  id: string;
  /** Tipo de notificación */
  type: 'info' | 'success' | 'warning' | 'error';
  /** Título de la notificación */
  title: string;
  /** Mensaje de la notificación */
  message: string;
  /** ID de la operación relacionada */
  operationId?: string;
  /** Timestamp de la notificación */
  timestamp: number;
  /** Si la notificación ha sido leída */
  read: boolean;
  /** Metadatos adicionales */
  metadata?: Record<string, any>;
}

/**
 * Actividad reciente
 */
export interface RecentActivity {
  /** Timestamp de la actividad */
  timestamp: number;
  /** Tipo de actividad */
  type: 'created' | 'started' | 'completed' | 'failed' | 'cancelled';
  /** ID de la operación */
  operationId: string;
  /** Información adicional */
  metadata?: Record<string, any>;
}

/**
 * Estadísticas del sistema de progreso
 */
export interface ProgressStatistics {
  /** Total de operaciones */
  totalOperations: number;
  /** Operaciones activas */
  activeOperations: number;
  /** Operaciones completadas */
  completedOperations: number;
  /** Operaciones fallidas */
  failedOperations: number;
  /** Operaciones canceladas */
  cancelledOperations: number;
  /** Total de items procesados */
  totalProcessedItems: number;
  /** Total de bytes procesados */
  totalProcessedSize: number;
  /** Velocidad promedio */
  averageSpeed: number;
  /** Duración promedio */
  averageDuration: number;
  /** Tasa de éxito */
  successRate: number;
  /** Uso de memoria */
  memoryUsage: number;
  /** Operaciones por tipo */
  operationsByType: Record<string, number>;
  /** Operaciones por estado */
  operationsByStatus: Record<string, number>;
  /** Actividad reciente */
  recentActivity: RecentActivity[];
}

/**
 * Configuración del sistema de progreso
 */
export interface ProgressSystemConfig {
  /** Máximo número de operaciones */
  maxOperations: number;
  /** Máximo número de notificaciones */
  maxNotifications: number;
  /** Si se debe limpiar automáticamente */
  autoCleanup: boolean;
  /** Intervalo de limpieza en milisegundos */
  cleanupInterval: number;
  /** Número de reintentos */
  retryAttempts: number;
  /** Delay entre reintentos */
  retryDelay: number;
  /** Tamaño del lote */
  batchSize: number;
  /** Operaciones concurrentes */
  concurrentOperations: number;
  /** Precisión de estimación */
  estimationAccuracy: number;
  /** Límite de memoria */
  memoryLimit: number;
  /** Si se deben habilitar métricas */
  enableMetrics: boolean;
  /** Si se deben habilitar notificaciones */
  enableNotifications: boolean;
  /** Si se debe habilitar la cola */
  enableQueue: boolean;
  /** Si se debe habilitar persistencia */
  enablePersistence: boolean;
}

/**
 * Eventos del sistema de progreso
 */
export interface ProgressEvents {
  /** Cuando se crea una operación */
  onOperationCreated?: (operation: ProgressOperation) => void;
  /** Cuando se inicia una operación */
  onOperationStarted?: (operation: ProgressOperation) => void;
  /** Cuando hay progreso en una operación */
  onOperationProgress?: (operation: ProgressOperation) => void;
  /** Cuando se completa una operación */
  onOperationCompleted?: (operation: ProgressOperation) => void;
  /** Cuando falla una operación */
  onOperationFailed?: (operation: ProgressOperation, error: Error) => void;
  /** Cuando se cancela una operación */
  onOperationCancelled?: (operation: ProgressOperation) => void;
  /** Cuando se pausa una operación */
  onOperationPaused?: (operation: ProgressOperation) => void;
  /** Cuando se reanuda una operación */
  onOperationResumed?: (operation: ProgressOperation) => void;
  /** Cuando se actualiza una cola */
  onQueueUpdated?: (queue: ProgressQueue) => void;
  /** Cuando se agrega una notificación */
  onNotificationAdded?: (notification: ProgressNotification) => void;
  /** Cuando se actualizan las estadísticas */
  onStatisticsUpdated?: (statistics: ProgressStatistics) => void;
  /** Cuando cambia la configuración */
  onConfigChanged?: (config: ProgressSystemConfig) => void;
  /** Cuando ocurre un error */
  onError?: (error: Error) => void;
}

/**
 * Filtros para operaciones
 */
export interface ProgressFilter {
  /** Filtrar por tipo */
  types?: OperationType[];
  /** Filtrar por estado */
  statuses?: ProgressStatus[];
  /** Filtrar por prioridad */
  priorities?: ('low' | 'normal' | 'high' | 'critical')[];
  /** Filtrar por rango de fechas */
  dateRange?: {
    start: number;
    end: number;
  };
  /** Filtrar por cola */
  queueId?: string;
  /** Filtrar por texto */
  searchText?: string;
  /** Mostrar solo operaciones activas */
  activeOnly?: boolean;
  /** Mostrar solo operaciones completadas */
  completedOnly?: boolean;
  /** Mostrar solo operaciones con errores */
  errorOnly?: boolean;
  /** Mostrar solo operaciones cancelables */
  cancellableOnly?: boolean;
  /** Mostrar solo operaciones pausables */
  pausableOnly?: boolean;
  /** Filtrar por ID de usuario */
  userId?: string;
  /** Filtrar por IDs de entidades */
  entityIds?: string[];
  /** Filtrar por tipo de operación */
  operationType?: OperationType;
  /** Filtrar por prioridad */
  priority?: number[];
}

/**
 * Opciones de ordenamiento
 */
export interface ProgressSortOptions {
  /** Campo por el que ordenar */
  field: 'createdAt' | 'updatedAt' | 'name' | 'type' | 'priority' | 'progress';
  /** Dirección del ordenamiento */
  direction: 'asc' | 'desc';
}

/**
 * Opciones de vista para el progreso
 */
export interface ProgressViewOptions {
  /** Mostrar operaciones completadas */
  showCompleted?: boolean;
  /** Mostrar operaciones fallidas */
  showFailed?: boolean;
  /** Mostrar operaciones canceladas */
  showCancelled?: boolean;
  /** Mostrar detalles de pasos */
  showSteps?: boolean;
  /** Mostrar estadísticas */
  showStatistics?: boolean;
  /** Mostrar notificaciones */
  showNotifications?: boolean;
  /** Número de items por página */
  itemsPerPage?: number;
  /** Página actual */
  currentPage?: number;
  /** Modo de vista */
  viewMode?: 'list' | 'grid' | 'compact';
}
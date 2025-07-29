/**
 * @file Tipos para el sistema de deshacer/rehacer
 * @module types/file-browser/undo-redo
 * @description Define todas las interfaces y tipos para el sistema de undo/redo
 */

/**
 * Estados posibles de una acción
 */
export type ActionState = 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';

/**
 * Tipos de acciones disponibles
 */
export type UndoableActionType = 
  | 'file_move'
  | 'file_copy'
  | 'file_delete'
  | 'file_rename'
  | 'file_create'
  | 'folder_create'
  | 'folder_delete'
  | 'selection_change'
  | 'view_change'
  | 'filter_change'
  | 'sort_change'
  | 'metadata_update'
  | 'tag_add'
  | 'tag_remove'
  | 'favorite_toggle'
  | 'custom';

/**
 * Prioridades de las acciones
 */
export type ActionPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Contexto de una acción
 */
export interface ActionContext {
  /** ID del usuario que ejecutó la acción */
  userId?: string;
  /** Sesión en la que se ejecutó */
  sessionId?: string;
  /** Información adicional del contexto */
  metadata?: Record<string, any>;
  /** Ubicación donde se ejecutó la acción */
  location?: string;
  /** Dispositivo desde el que se ejecutó */
  device?: string;
}

/**
 * Callbacks para una acción deshacer/rehacer
 */
export interface ActionCallbacks {
  /** Función para ejecutar la acción */
  execute: () => Promise<void> | void;
  /** Función para deshacer la acción */
  undo?: () => Promise<void> | void;
  /** Función para rehacer la acción */
  redo?: () => Promise<void> | void;
  /** Función de validación antes de ejecutar */
  validate?: () => Promise<boolean> | boolean;
  /** Función de limpieza después de la acción */
  cleanup?: () => Promise<void> | void;
}

/**
 * Acción que puede ser deshecha/rehecha
 */
export interface UndoableAction {
  /** ID único de la acción */
  id: string;
  /** Nombre descriptivo de la acción */
  name: string;
  /** Descripción detallada */
  description?: string;
  /** Tipo de acción */
  type: UndoableActionType;
  /** Estado actual de la acción */
  state: ActionState;
  /** Timestamp de creación */
  timestamp: number;
  /** Prioridad de la acción */
  priority?: ActionPriority;
  /** Contexto de la acción */
  context?: ActionContext;
  /** Callbacks de la acción */
  callbacks: ActionCallbacks;
  /** Datos asociados a la acción */
  data?: Record<string, any>;
  /** Tags para categorizar la acción */
  tags?: string[];
  /** Si la acción puede ser deshecha */
  canUndo?: boolean;
  /** Si la acción puede ser rehecha */
  canRedo?: boolean;
  /** Tiempo de expiración de la acción */
  expiresAt?: number;
  /** ID del grupo al que pertenece */
  groupId?: string;
}

/**
 * Grupo de acciones relacionadas
 */
export interface ActionGroup {
  /** ID único del grupo */
  id: string;
  /** Nombre del grupo */
  name: string;
  /** Descripción del grupo */
  description?: string;
  /** IDs de las acciones en el grupo */
  actions: string[];
  /** Timestamp de inicio */
  startTime: number;
  /** Timestamp de fin */
  endTime?: number;
  /** Estado del grupo */
  state: 'active' | 'completed' | 'cancelled';
  /** Metadatos del grupo */
  metadata?: Record<string, any>;
}

/**
 * Snapshot del estado del sistema
 */
export interface StateSnapshot {
  /** ID único del snapshot */
  id: string;
  /** Nombre del snapshot */
  name: string;
  /** Descripción del snapshot */
  description?: string;
  /** Timestamp de creación */
  timestamp: number;
  /** Acciones en el snapshot */
  actions: UndoableAction[];
  /** Índice actual en el snapshot */
  currentIndex: number;
  /** Grupos en el snapshot */
  groups: ActionGroup[];
  /** Tamaño del snapshot en bytes */
  size?: number;
  /** Checksum para verificar integridad */
  checksum?: string;
  /** Metadatos adicionales */
  metadata?: Record<string, any>;
}

/**
 * Configuración del historial
 */
export interface HistoryConfig {
  /** Máximo número de acciones en el historial */
  maxActions: number;
  /** Máximo número de grupos */
  maxGroups: number;
  /** Si se debe limpiar automáticamente */
  autoCleanup: boolean;
  /** Umbral para activar la limpieza automática */
  cleanupThreshold: number;
  /** Si se debe persistir el historial */
  persistHistory: boolean;
  /** Si se debe comprimir el historial */
  compressionEnabled: boolean;
}

/**
 * Configuración de grupos
 */
export interface GroupConfig {
  /** Si se deben agrupar acciones automáticamente */
  autoGroup: boolean;
  /** Timeout para cerrar grupos automáticamente */
  groupTimeout: number;
  /** Tamaño máximo de un grupo */
  maxGroupSize: number;
  /** Si se deben agrupar acciones similares */
  groupSimilarActions: boolean;
}

/**
 * Configuración de snapshots
 */
export interface SnapshotConfig {
  /** Máximo número de snapshots */
  maxSnapshots: number;
  /** Si se deben crear snapshots automáticamente */
  autoSnapshot: boolean;
  /** Intervalo para crear snapshots automáticos */
  snapshotInterval: number;
  /** Si se debe comprimir los snapshots */
  compressionEnabled: boolean;
}

/**
 * Configuración de rendimiento
 */
export interface PerformanceConfig {
  /** Tamaño del lote para operaciones masivas */
  batchSize: number;
  /** Tiempo de debounce para acciones */
  debounceTime: number;
  /** Si se deben habilitar métricas */
  enableMetrics: boolean;
  /** Límite de memoria para el historial */
  memoryLimit: number;
}

/**
 * Configuración de validación
 */
export interface ValidationConfig {
  /** Si se deben validar las acciones */
  validateActions: boolean;
  /** Modo estricto de validación */
  strictMode: boolean;
  /** Si se permiten acciones duplicadas */
  allowDuplicates: boolean;
}

/**
 * Configuración completa del sistema undo/redo
 */
export interface UndoRedoConfig {
  /** Configuración del historial */
  history: HistoryConfig;
  /** Configuración de grupos */
  groups: GroupConfig;
  /** Configuración de snapshots */
  snapshots: SnapshotConfig;
  /** Configuración de rendimiento */
  performance: PerformanceConfig;
  /** Configuración de validación */
  validation: ValidationConfig;
}

/**
 * Filtros para el historial
 */
export interface HistoryFilter {
  /** Filtrar por tipo de acción */
  types?: UndoableActionType[];
  /** Filtrar por estado */
  states?: ActionState[];
  /** Filtrar por rango de fechas */
  dateRange?: {
    start: number;
    end: number;
  };
  /** Filtrar por prioridad */
  priorities?: ActionPriority[];
  /** Filtrar por contextos */
  contexts?: string[];
  /** Filtrar por tags */
  tags?: string[];
  /** Filtrar por usuario */
  userId?: string;
  /** Filtrar por grupo */
  groupId?: string;
}

/**
 * Opciones de ordenamiento del historial
 */
export interface HistorySortOptions {
  /** Campo por el que ordenar */
  field: 'timestamp' | 'name' | 'type' | 'priority' | 'state';
  /** Dirección del ordenamiento */
  direction: 'asc' | 'desc';
}

/**
 * Opciones de vista del historial
 */
export interface HistoryViewOptions {
  /** Número de elementos por página */
  pageSize: number;
  /** Página actual */
  page: number;
  /** Si se deben incluir grupos */
  includeGroups: boolean;
  /** Si se deben incluir snapshots */
  includeSnapshots: boolean;
}

/**
 * Actividad reciente
 */
export interface RecentActivity {
  /** Timestamp de la actividad */
  timestamp: number;
  /** Tipo de acción */
  action: 'execute' | 'undo' | 'redo' | 'group' | 'snapshot';
  /** ID de la acción relacionada */
  actionId: string;
  /** Información adicional */
  metadata?: Record<string, any>;
}

/**
 * Estadísticas del historial
 */
export interface HistoryStatistics {
  /** Total de acciones ejecutadas */
  totalActions: number;
  /** Número de deshacer ejecutados */
  undoCount: number;
  /** Número de rehacer ejecutados */
  redoCount: number;
  /** Número de grupos creados */
  groupCount: number;
  /** Número de snapshots creados */
  snapshotCount: number;
  /** Uso de memoria en bytes */
  memoryUsage: number;
  /** Tiempo promedio de ejecución */
  averageExecutionTime: number;
  /** Tasa de éxito de las acciones */
  successRate: number;
  /** Acciones por tipo */
  actionsByType: Record<string, number>;
  /** Acciones por prioridad */
  actionsByPriority: Record<string, number>;
  /** Actividad reciente */
  recentActivity: RecentActivity[];
}

/**
 * Eventos del sistema undo/redo
 */
export interface UndoRedoEvents {
  /** Cuando se ejecuta una acción */
  onActionExecuted?: (action: UndoableAction) => void;
  /** Cuando se deshace una acción */
  onActionUndone?: (action: UndoableAction) => void;
  /** Cuando se rehace una acción */
  onActionRedone?: (action: UndoableAction) => void;
  /** Cuando se inicia un grupo */
  onGroupStarted?: (group: ActionGroup) => void;
  /** Cuando se termina un grupo */
  onGroupEnded?: (group: ActionGroup) => void;
  /** Cuando se crea un snapshot */
  onSnapshotCreated?: (snapshot: StateSnapshot) => void;
  /** Cuando se restaura un snapshot */
  onSnapshotRestored?: (snapshot: StateSnapshot) => void;
  /** Cuando se limpia el historial */
  onHistoryCleared?: () => void;
  /** Cuando cambia la configuración */
  onConfigChanged?: (config: UndoRedoConfig) => void;
  /** Cuando ocurre un error */
  onError?: (error: string) => void;
}

/**
 * Opciones de exportación del historial
 */
export interface HistoryExportOptions {
  /** Formato de exportación */
  format?: 'json' | 'pretty' | 'csv' | 'xml';
  /** Si se deben incluir acciones */
  includeActions?: boolean;
  /** Si se deben incluir snapshots */
  includeSnapshots?: boolean;
  /** Si se deben incluir grupos */
  includeGroups?: boolean;
  /** Si se debe incluir configuración */
  includeConfig?: boolean;
  /** Rango de fechas para filtrar */
  dateRange?: {
    start: number;
    end: number;
  };
  /** Filtros a aplicar */
  filter?: HistoryFilter;
  /** Si se debe comprimir */
  compress?: boolean;
}

/**
 * Opciones de importación del historial
 */
export interface HistoryImportOptions {
  /** Si se debe limpiar el historial existente */
  clearExisting?: boolean;
  /** Si se deben validar los datos */
  validate?: boolean;
  /** Si se debe hacer merge con el historial existente */
  merge?: boolean;
  /** Si se debe incluir configuración */
  includeConfig?: boolean;
  /** Estrategia de resolución de conflictos */
  conflictResolution?: 'skip' | 'overwrite' | 'rename';
}

/**
 * Backup del historial
 */
export interface HistoryBackup {
  /** ID único del backup */
  id: string;
  /** Timestamp de creación */
  timestamp: number;
  /** Versión del formato */
  version: string;
  /** Datos del historial */
  data: {
    actions: UndoableAction[];
    groups: ActionGroup[];
    snapshots: StateSnapshot[];
    config: UndoRedoConfig;
    statistics: HistoryStatistics;
  };
  /** Checksum para verificar integridad */
  checksum?: string;
  /** Metadatos del backup */
  metadata?: {
    actionCount: number;
    groupCount: number;
    snapshotCount: number;
    size: number;
    [key: string]: any;
  };
}
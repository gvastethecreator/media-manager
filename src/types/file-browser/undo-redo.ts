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
	/** Dispositivo desde el que se ejecutó */
	device?: string;
	/** Ubicación donde se ejecutó la acción */
	location?: string;
	/** Información adicional del contexto */
	metadata?: Record<string, any>;
	/** Sesión en la que se ejecutó */
	sessionId?: string;
	/** ID del usuario que ejecutó la acción */
	userId?: string;
}

/**
 * Callbacks para una acción deshacer/rehacer
 */
export interface ActionCallbacks {
	/** Función de limpieza después de la acción */
	cleanup?: () => Promise<void> | void;
	/** Función para ejecutar la acción */
	execute: () => Promise<void> | void;
	/** Función para rehacer la acción */
	redo?: () => Promise<void> | void;
	/** Función para deshacer la acción */
	undo?: () => Promise<void> | void;
	/** Función de validación antes de ejecutar */
	validate?: () => Promise<boolean> | boolean;
}

/**
 * Action que puede ser deshecha/rehecha
 */
export interface UndoableAction {
	/** Callbacks de la acción */
	callbacks: ActionCallbacks;
	/** Si la acción puede ser rehecha */
	canRedo?: boolean;
	/** Si la acción puede ser deshecha */
	canUndo?: boolean;
	/** Contexto de la acción */
	context?: ActionContext;
	/** Datos asociados a la acción */
	data?: Record<string, any>;
	/** Descripción detallada */
	description?: string;
	/** Tiempo de expiración de la acción */
	expiresAt?: number;
	/** ID del grupo al que pertenece */
	groupId?: string;
	/** ID único de la acción */
	id: string;
	/** Nombre descriptivo de la acción */
	name: string;
	/** Prioridad de la acción */
	priority?: ActionPriority;
	/** Estado actual de la acción */
	state: ActionState;
	/** Tags para categorizar la acción */
	tags?: string[];
	/** Timestamp de creación */
	timestamp: number;
	/** Tipo de acción */
	type: UndoableActionType;
}

/**
 * Grupo de acciones relacionadas
 */
export interface ActionGroup {
	/** IDs de las acciones en el grupo */
	actions: string[];
	/** Descripción del grupo */
	description?: string;
	/** Timestamp de fin */
	endTime?: number;
	/** ID único del grupo */
	id: string;
	/** Metadatos del grupo */
	metadata?: Record<string, any>;
	/** Nombre del grupo */
	name: string;
	/** Timestamp de inicio */
	startTime: number;
	/** Estado del grupo */
	state: 'active' | 'completed' | 'cancelled';
}

/**
 * Snapshot del estado del sistema
 */
export interface StateSnapshot {
	/** Acciones en el snapshot */
	actions: UndoableAction[];
	/** Checksum para verificar integridad */
	checksum?: string;
	/** Índice actual en el snapshot */
	currentIndex: number;
	/** Descripción del snapshot */
	description?: string;
	/** Grupos en el snapshot */
	groups: ActionGroup[];
	/** ID único del snapshot */
	id: string;
	/** Metadatos adicionales */
	metadata?: Record<string, any>;
	/** Nombre del snapshot */
	name: string;
	/** Tamaño del snapshot en bytes */
	size?: number;
	/** Timestamp de creación */
	timestamp: number;
}

/**
 * Configuración del historial
 */
export interface HistoryConfig {
	/** Si se debe limpiar automáticamente */
	autoCleanup: boolean;
	/** Umbral para activar la limpieza automática */
	cleanupThreshold: number;
	/** Si se debe comprimir el historial */
	compressionEnabled: boolean;
	/** Máximo número de acciones en el historial */
	maxActions: number;
	/** Máximo número de grupos */
	maxGroups: number;
	/** Si se debe persistir el historial */
	persistHistory: boolean;
}

/**
 * Configuración de grupos
 */
export interface GroupConfig {
	/** Si se deben agrupar acciones automáticamente */
	autoGroup: boolean;
	/** Si se deben agrupar acciones similares */
	groupSimilarActions: boolean;
	/** Timeout para cerrar grupos automáticamente */
	groupTimeout: number;
	/** Tamaño máximo de un grupo */
	maxGroupSize: number;
}

/**
 * Configuración de snapshots
 */
export interface SnapshotConfig {
	/** Si se deben crear snapshots automáticamente */
	autoSnapshot: boolean;
	/** Si se debe comprimir los snapshots */
	compressionEnabled: boolean;
	/** Máximo número de snapshots */
	maxSnapshots: number;
	/** Intervalo para crear snapshots automáticos */
	snapshotInterval: number;
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
	/** Si se permiten acciones duplicadas */
	allowDuplicates: boolean;
	/** Modo estricto de validación */
	strictMode: boolean;
	/** Si se deben validar las acciones */
	validateActions: boolean;
}

/**
 * Configuración completa del sistema undo/redo
 */
export interface UndoRedoConfig {
	/** Configuración de grupos */
	groups: GroupConfig;
	/** Configuración del historial */
	history: HistoryConfig;
	/** Configuración de rendimiento */
	performance: PerformanceConfig;
	/** Configuración de snapshots */
	snapshots: SnapshotConfig;
	/** Configuración de validación */
	validation: ValidationConfig;
}

/**
 * Filtros para el historial
 */
export interface HistoryFilter {
	/** Filtrar por contextos */
	contexts?: string[];
	/** Filtrar por rango de fechas */
	dateRange?: {
		start: number;
		end: number;
	};
	/** Filtrar por grupo */
	groupId?: string;
	/** Filtrar por prioridad */
	priorities?: ActionPriority[];
	/** Filtrar por estado */
	states?: ActionState[];
	/** Filtrar por tags */
	tags?: string[];
	/** Filtrar por tipo de acción */
	types?: UndoableActionType[];
	/** Filtrar por usuario */
	userId?: string;
}

/**
 * Opciones de ordenamiento del historial
 */
export interface HistorySortOptions {
	/** Dirección del ordenamiento */
	direction: 'asc' | 'desc';
	/** Campo por el que ordenar */
	field: 'timestamp' | 'name' | 'type' | 'priority' | 'state';
}

/**
 * Opciones de vista del historial
 */
export interface HistoryViewOptions {
	/** Si se deben incluir grupos */
	includeGroups: boolean;
	/** Si se deben incluir snapshots */
	includeSnapshots: boolean;
	/** Página actual */
	page: number;
	/** Número de elementos por página */
	pageSize: number;
}

/**
 * Actividad reciente
 */
export interface RecentActivity {
	/** Tipo de acción */
	action: 'execute' | 'undo' | 'redo' | 'group' | 'snapshot';
	/** ID de la acción relacionada */
	actionId: string;
	/** Información adicional */
	metadata?: Record<string, any>;
	/** Timestamp de la actividad */
	timestamp: number;
}

/**
 * Estadísticas del historial
 */
export interface HistoryStatistics {
	/** Acciones por prioridad */
	actionsByPriority: Record<string, number>;
	/** Acciones por tipo */
	actionsByType: Record<string, number>;
	/** Tiempo promedio de ejecución */
	averageExecutionTime: number;
	/** Número de grupos creados */
	groupCount: number;
	/** Uso de memoria en bytes */
	memoryUsage: number;
	/** Actividad reciente */
	recentActivity: RecentActivity[];
	/** Número de rehacer ejecutados */
	redoCount: number;
	/** Número de snapshots creados */
	snapshotCount: number;
	/** Tasa de éxito de las acciones */
	successRate: number;
	/** Total de acciones ejecutadas */
	totalActions: number;
	/** Número de deshacer ejecutados */
	undoCount: number;
}

/**
 * Eventos del sistema undo/redo
 */
export interface UndoRedoEvents {
	/** Cuando se ejecuta una acción */
	onActionExecuted?: (action: UndoableAction) => void;
	/** Cuando se rehace una acción */
	onActionRedone?: (action: UndoableAction) => void;
	/** Cuando se deshace una acción */
	onActionUndone?: (action: UndoableAction) => void;
	/** Cuando cambia la configuración */
	onConfigChanged?: (config: UndoRedoConfig) => void;
	/** Cuando ocurre un error */
	onError?: (error: string) => void;
	/** Cuando se termina un grupo */
	onGroupEnded?: (group: ActionGroup) => void;
	/** Cuando se inicia un grupo */
	onGroupStarted?: (group: ActionGroup) => void;
	/** Cuando se limpia el historial */
	onHistoryCleared?: () => void;
	/** Cuando se crea un snapshot */
	onSnapshotCreated?: (snapshot: StateSnapshot) => void;
	/** Cuando se restaura un snapshot */
	onSnapshotRestored?: (snapshot: StateSnapshot) => void;
}

/**
 * Opciones de exportación del historial
 */
export interface HistoryExportOptions {
	/** Si se debe comprimir */
	compress?: boolean;
	/** Rango de fechas para filtrar */
	dateRange?: {
		start: number;
		end: number;
	};
	/** Filtros a aplicar */
	filter?: HistoryFilter;
	/** Formato de exportación */
	format?: 'json' | 'pretty' | 'csv' | 'xml';
	/** Si se deben incluir acciones */
	includeActions?: boolean;
	/** Si se debe incluir configuración */
	includeConfig?: boolean;
	/** Si se deben incluir grupos */
	includeGroups?: boolean;
	/** Si se deben incluir snapshots */
	includeSnapshots?: boolean;
}

/**
 * Opciones de importación del historial
 */
export interface HistoryImportOptions {
	/** Si se debe limpiar el historial existente */
	clearExisting?: boolean;
	/** Estrategia de resolución de conflictos */
	conflictResolution?: 'skip' | 'overwrite' | 'rename';
	/** Si se debe incluir configuración */
	includeConfig?: boolean;
	/** Si se debe hacer merge con el historial existente */
	merge?: boolean;
	/** Si se deben validar los datos */
	validate?: boolean;
}

/**
 * Backup del historial
 */
export interface HistoryBackup {
	/** Checksum para verificar integridad */
	checksum?: string;
	/** Datos del historial */
	data: {
		actions: UndoableAction[];
		groups: ActionGroup[];
		snapshots: StateSnapshot[];
		config: UndoRedoConfig;
		statistics: HistoryStatistics;
	};
	/** ID único del backup */
	id: string;
	/** Metadatos del backup */
	metadata?: {
		actionCount: number;
		groupCount: number;
		snapshotCount: number;
		size: number;
		[key: string]: any;
	};
	/** Timestamp de creación */
	timestamp: number;
	/** Versión del formato */
	version: string;
}

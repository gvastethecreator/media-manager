/**
 * @file Tipos para el servicio de thumbnails (Legacy compatibility)
 * @module services/thumbnail/types
 * @description Tipos y interfaces para mantener compatibilidad con código existente
 */

/**
 * Estado del proceso de generación de thumbnails
 */
export interface ProcessStatus {
	/** ID de la entidad siendo procesada */
	entityId?: string;
	/** Tipo de entidad */
	entityType?: string;
	/** Progreso actual (0-100) */
	progress: number;
	/** Estado del proceso */
	status: 'pending' | 'processing' | 'completed' | 'error';
	/** Mensaje descriptivo */
	message?: string;
	/** Timestamp */
	timestamp: number;
}

/**
 * Error en procesamiento de thumbnail
 */
export interface ThumbnailError {
	/** ID de la entidad */
	entityId?: string;
	/** Tipo de entidad */
	entityType?: string;
	/** Mensaje de error */
	message: string;
	/** Error original */
	error?: Error;
	/** Timestamp */
	timestamp: number;
}

/**
 * Estadísticas de thumbnails
 */
export interface ThumbnailStats {
	/** Total de entidades */
	total: number;
	/** Procesados */
	processed: number;
	/** Fallidos */
	failed: number;
	/** Pendientes */
	pending: number;
	/** Total de archivos */
	totalFiles: number;
	/** Tamaño total */
	totalSize: number;
	/** Tamaño procesado */
	processedSize: number;
	/** Errores */
	errors: string[];
	/** Tiempo promedio de procesamiento */
	averageProcessingTime: number;
	/** Último procesamiento */
	lastProcessedAt?: Date;
}

/**
 * Opciones de procesamiento de thumbnails
 */
export interface ThumbnailProcessOptions {
	/** Calidad del thumbnail */
	quality?: 'low' | 'medium' | 'high';
	/** Forzar regeneración */
	force?: boolean;
	/** Límite de entidades a procesar */
	limit?: number;
	/** Filtro de tipos de entidad */
	entityTypes?: string[];
}

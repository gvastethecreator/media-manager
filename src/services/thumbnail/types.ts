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
	/** Mensaje descriptivo */
	message?: string;
	/** Progreso actual (0-100) */
	progress: number;
	/** Estado del proceso */
	status: 'pending' | 'processing' | 'completed' | 'error';
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
	/** Error original */
	error?: Error;
	/** Mensaje de error */
	message: string;
	/** Timestamp */
	timestamp: number;
}

/**
 * Estadísticas de thumbnails
 */
export interface ThumbnailStats {
	/** Tiempo promedio de procesamiento */
	averageProcessingTime: number;
	/** Errores */
	errors: string[];
	/** Fallidos */
	failed: number;
	/** Último procesamiento */
	lastProcessedAt?: Date;
	/** Pendientes */
	pending: number;
	/** Procesados */
	processed: number;
	/** Tamaño procesado */
	processedSize: number;
	/** Total de entidades */
	total: number;
	/** Total de archivos */
	totalFiles: number;
	/** Tamaño total */
	totalSize: number;
}

/**
 * Opciones de procesamiento de thumbnails
 */
export interface ThumbnailProcessOptions {
	/** Filtro de tipos de entidad */
	entityTypes?: string[];
	/** Forzar regeneración */
	force?: boolean;
	/** Límite de entidades a procesar */
	limit?: number;
	/** Calidad del thumbnail */
	quality?: 'low' | 'medium' | 'high';
}

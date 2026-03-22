/**
 * @file Opciones para reindexado incremental
 * @module services/folders/reindex-incremental-types
 * @description Tipos y opciones para el servicio de reindexado incremental
 * @created 2025-10-11 - Sistema incremental de reindexado
 */

/**
 * Modo de reindexado
 */
export type ReindexMode = 'incremental' | 'full';

/**
 * Estadísticas de archivos procesados en modo incremental
 */
export interface IncrementalReindexStats {
	/** Archivos cambiados (hash diferente) */
	changedFiles: number;
	/** Archivos eliminados de la BD (no existen en el sistema) */
	deletedFiles: number;
	/** Tiempo de procesamiento total */
	duration: number;
	/** Archivos con errores de procesamiento */
	failedFiles: number;
	/** Archivos nuevos (no estaban en la BD) */
	newFiles: number;
	/** Porcentaje de ahorro de tiempo */
	timeSavedPercentage: number;
	/** Total de archivos verificados */
	totalFiles: number;
	/** Archivos sin cambios (hash igual) */
	unchangedFiles: number;
}

/**
 * Archivo detectado como cambiado
 */
export interface ChangedFile {
	/** Hash actual */
	currentHash: string;
	/** Tamaño actual */
	currentSize: number;
	/** Tipo de entidad */
	entityType: 'image' | 'video' | 'audio' | 'document' | 'file3d';
	/** Campos que deben actualizarse */
	fieldsToUpdate: Array<'metadata' | 'thumbnail' | 'dimensions' | 'size' | 'all'>;
	/** ID del archivo en la base de datos */
	id: string;
	/** Ruta del archivo */
	path: string;
	/** Hash almacenado */
	storedHash: string;
	/** Tamaño almacenado */
	storedSize: number;
}

/**
 * Opciones expandidas de reindexado
 */
export interface IncrementalReindexOptions {
	/** Nivel de concurrencia (default: 5) */
	concurrency?: number;
	/** Solo verificar cambios sin hacer modificaciones (dry run) */
	dryRun?: boolean;
	/** Emitir eventos de progreso */
	emitEvents?: boolean;
	/** Tipos de archivos a procesar (default: todos) */
	fileTypes?: Array<'image' | 'video' | 'audio' | 'document' | 'file3d'>;
	/** ID de carpeta específico para reindexar */
	folderId?: string;
	/** Forzar reindexado completo aunque sea incremental (para reindexar todo) */
	forceFullReindex?: boolean;
	/** Incluir archivos ocultos */
	includeHidden?: boolean;
	/** Incluir subcarpetas */
	includeSubfolders?: boolean;
	/** Modo de reindexado (default: 'incremental') */
	mode?: ReindexMode;
	/** Saltar extracción de metadata */
	skipMetadata?: boolean;
	/** Saltar generación de thumbnails */
	skipThumbnails?: boolean;
}

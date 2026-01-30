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
	/** Total de archivos verificados */
	totalFiles: number;
	/** Archivos nuevos (no estaban en la BD) */
	newFiles: number;
	/** Archivos cambiados (hash diferente) */
	changedFiles: number;
	/** Archivos sin cambios (hash igual) */
	unchangedFiles: number;
	/** Archivos eliminados de la BD (no existen en el sistema) */
	deletedFiles: number;
	/** Archivos con errores de procesamiento */
	failedFiles: number;
	/** Tiempo de procesamiento total */
	duration: number;
	/** Porcentaje de ahorro de tiempo */
	timeSavedPercentage: number;
}

/**
 * Archivo detectado como cambiado
 */
export interface ChangedFile {
	/** ID del archivo en la base de datos */
	id: string;
	/** Ruta del archivo */
	path: string;
	/** Tipo de entidad */
	entityType: 'image' | 'video' | 'audio' | 'document' | 'file3d';
	/** Hash almacenado */
	storedHash: string;
	/** Hash actual */
	currentHash: string;
	/** Tamaño actual */
	currentSize: number;
	/** Tamaño almacenado */
	storedSize: number;
	/** Campos que deben actualizarse */
	fieldsToUpdate: Array<'metadata' | 'thumbnail' | 'dimensions' | 'size' | 'all'>;
}

/**
 * Opciones expandidas de reindexado
 */
export interface IncrementalReindexOptions {
	/** Modo de reindexado (default: 'incremental') */
	mode?: ReindexMode;
	/** Forzar reindexado completo aunque sea incremental (para reindexar todo) */
	forceFullReindex?: boolean;
	/** Tipos de archivos a procesar (default: todos) */
	fileTypes?: Array<'image' | 'video' | 'audio' | 'document' | 'file3d'>;
	/** ID de carpeta específico para reindexar */
	folderId?: string;
	/** Incluir subcarpetas */
	includeSubfolders?: boolean;
	/** Incluir archivos ocultos */
	includeHidden?: boolean;
	/** Nivel de concurrencia (default: 5) */
	concurrency?: number;
	/** Emitir eventos de progreso */
	emitEvents?: boolean;
	/** Saltar generación de thumbnails */
	skipThumbnails?: boolean;
	/** Saltar extracción de metadata */
	skipMetadata?: boolean;
	/** Solo verificar cambios sin hacer modificaciones (dry run) */
	dryRun?: boolean;
}

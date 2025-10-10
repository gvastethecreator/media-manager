/**
 * @file Tipos y interfaces para el servicio de reindexado de carpetas
 * @module services/folders/folder-reindex-types
 */

/**
 * Resultado de una fase de reindexado
 */
export interface ReindexPhaseResult {
	success: boolean;
	processed: number;
	failed: number;
	errors: string[];
	duration: number;
}

/**
 * Resultado del análisis de estructura de carpetas
 */
export interface ReindexAnalysisResult {
	totalFolders: number;
	existingFolders: Array<{ id: string; path: string; name: string; exists: boolean }>;
	missingFolders: Array<{ id: string; path: string; name: string }>;
	newSubfolders: Array<{ path: string; parentId: string | null; name: string }>;
	totalFiles: number;
	estimatedDuration: number;
}

/**
 * Opciones de configuración para el reindexado
 */
export interface ReindexOptions {
	folderId?: string; // Si se especifica, solo reindexar esta carpeta
	includeSubfolders?: boolean;
	includeHidden?: boolean;
	concurrency?: number;
	emitEvents?: boolean;
	skipThumbnails?: boolean;
	skipMetadata?: boolean;
}

/**
 * @file Tipos y interfaces para el servicio de reindexado de carpetas
 * @module services/folders/folder-reindex-types
 */

/**
 * Resultado de una fase de reindexado
 */
export interface ReindexPhaseResult {
	duration: number;
	errors: string[];
	failed: number;
	processed: number;
	/** Indica si la fase fue saltada intencionalmente */
	skipped?: boolean;
	success: boolean;
}

/**
 * Resultado del análisis de estructura de carpetas
 */
export interface ReindexAnalysisResult {
	estimatedDuration: number;
	existingFolders: Array<{ id: string; path: string; name: string; exists: boolean }>;
	missingFolders: Array<{ id: string; path: string; name: string }>;
	newSubfolders: Array<{ path: string; parentId: string | null; name: string }>;
	totalFiles: number;
	totalFolders: number;
}

/**
 * Opciones de configuración para el reindexado
 */
export interface ReindexOptions {
	concurrency?: number;
	emitEvents?: boolean;
	folderId?: string; // Si se especifica, solo reindexar esta carpeta
	includeHidden?: boolean;
	includeSubfolders?: boolean;
	skipMetadata?: boolean;
	skipThumbnails?: boolean;
}

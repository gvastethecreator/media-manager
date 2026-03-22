/**
 * @file Tipos para operaciones con folders
 * @module types/folders
 */

export interface ProcessStatus {
	error?: string;
	filesProcessed?: number;
	folderId?: string; // ID de la carpeta siendo procesada
	isProcessing: boolean;
	message?: string;
	phase?: 'starting' | 'scanning' | 'processing' | 'metadata' | 'complete';
	progress?: number;
	status?: 'processing' | 'completed' | 'error'; // Estado del proceso
	timestamp?: number;
	totalFiles?: number;
}

export interface ErrorResponse {
	code?: string;
	details?: Record<string, unknown>;
	error: string;
	folderId?: string; // Agregar folderId que se usa
	message?: string; // Agregar message que se usa en el código
	timestamp?: number; // Para compatibilidad con eventos
}

export interface FolderResponse {
	createdAt: string;
	folderId?: string; // Para compatibilidad con eventos
	id: string;
	name: string;
	parentId?: string;
	path: string;
	success?: boolean; // Para respuestas de operaciones
	updatedAt: string;
}

// Stats generales de carpetas (shape devuelto por /api/stats/folders)
export interface FolderStats {
	// Nuevos campos para BD y thumbnails
	databaseSize?: number;
	formattedDatabaseSize?: string;
	formattedSize: string;
	formattedThumbnailsCacheSize?: string;
	// Compatibilidad: timestamp ISO del último escaneo
	lastScanned?: string;
	thumbnailsCacheSize?: number;
	totalAudio: number;
	totalDocuments: number;
	totalFiles: number;
	totalFolders: number;
	totalImages: number;
	totalOthers: number;
	totalSize: number;
	totalThumbnails?: number;
	totalVideos: number;
}

// Tipo específico para el hook useFolderStats (más simple)
export interface FolderStatsResponse {
	lastActivity: Date | null;
	recentImages?: Array<{
		id: string;
		name: string;
		thumbnailUrl?: string;
		// Algunos endpoints devuelven `thumbnail` (base64) en lugar de `thumbnailUrl`
		thumbnail?: string;
	}>;
	totalAudio: number;
	totalDocuments: number;
	totalImages: number;
	totalOthers: number;
	totalSize: number;
	totalVideos: number;
}

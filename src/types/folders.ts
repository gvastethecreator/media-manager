/**
 * @file Tipos para operaciones con folders
 * @module types/folders
 */

export interface ProcessStatus {
	isProcessing: boolean;
	progress?: number;
	message?: string;
	error?: string;
	folderId?: string; // ID de la carpeta siendo procesada
	phase?: 'starting' | 'scanning' | 'processing' | 'metadata' | 'complete';
	timestamp?: number;
	filesProcessed?: number;
	totalFiles?: number;
	status?: 'processing' | 'completed' | 'error'; // Estado del proceso
}

export interface ErrorResponse {
	error: string;
	message?: string; // Agregar message que se usa en el código
	code?: string;
	details?: Record<string, unknown>;
	folderId?: string; // Agregar folderId que se usa
	timestamp?: number; // Para compatibilidad con eventos
}

export interface FolderResponse {
	id: string;
	path: string;
	name: string;
	parentId?: string;
	createdAt: string;
	updatedAt: string;
	folderId?: string; // Para compatibilidad con eventos
	success?: boolean; // Para respuestas de operaciones
}

// Stats generales de carpetas (shape devuelto por /api/stats/folders)
export interface FolderStats {
	totalFolders: number;
	totalFiles: number;
	totalImages: number;
	totalVideos: number;
	totalAudio: number;
	totalDocuments: number;
	totalOthers: number;
	totalSize: number;
	formattedSize: string;
	// Compatibilidad: timestamp ISO del último escaneo
	lastScanned?: string;
}

// Tipo específico para el hook useFolderStats (más simple)
export interface FolderStatsResponse {
	totalImages: number;
	totalVideos: number;
	totalAudio: number;
	totalDocuments: number;
	totalOthers: number;
	totalSize: number;
	lastActivity: Date | null;
	recentImages?: Array<{
		id: string;
		name: string;
		thumbnailUrl?: string;
	}>;
}

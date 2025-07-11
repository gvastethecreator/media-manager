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
}

export interface ErrorResponse {
	error: string;
	message?: string; // Agregar message que se usa en el código
	code?: string;
	details?: Record<string, unknown>;
	folderId?: string; // Agregar folderId que se usa
}

export interface FolderResponse {
	id: string;
	path: string;
	name: string;
	parentId?: string;
	createdAt: string;
	updatedAt: string;
}

export interface FolderStats {
	totalFolders: number;
	totalImages: number;
	totalSize: number;
	lastScanned?: string;
}

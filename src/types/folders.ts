/**
 * @file Tipos para operaciones con folders
 * @module types/folders
 */

export interface ProcessStatus {
	isProcessing: boolean;
	progress?: number;
	message?: string;
	error?: string;
}

export interface ErrorResponse {
	error: string;
	code?: string;
	details?: Record<string, unknown>;
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
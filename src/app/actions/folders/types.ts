/**
 * @file Tipos para las acciones de la entidad Folder
 * @module app/actions/folders/types
 */

import type { FolderComplete, FolderStats } from '@/types/entities/folder';

/**
 * Representa el estado de procesamiento de una carpeta durante la indexación.
 */
export interface ProcessStatus {
	folderId: string;
	status: 'processing' | 'completed' | 'error';
	progress: number;
	message?: string;
	currentFile?: string;
	totalFiles?: number;
	processedFiles?: number;
}

/**
 * Representa una respuesta de error para operaciones de carpeta.
 */
export interface ErrorResponse {
	error: string;
	message: string;
	folderId?: string;
}

/**
 * Representa una respuesta exitosa para operaciones de carpeta,
 * incluyendo opcionalmente la entidad de la carpeta completa.
 */
export interface FolderResponse {
	folderId: string;
	success: boolean;
	data?: FolderComplete;
}

/**
 * Define las funciones de callback para operaciones asíncronas de indexación.
 */
export interface IndexCallbacks {
	onProgress?: (status: ProcessStatus) => void;
	onError?: (error: ErrorResponse) => void;
	onComplete?: (response: FolderResponse) => void;
}

/**
 * Define las estadísticas de una carpeta.
 */
export type { FolderStats };

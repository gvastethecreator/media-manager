/**
 * 📁 Tipos canónicos para la entidad File
 */

import type { DirectoryInfo, FileInfo } from '@/lib/filesystem/folder-scanner';
import type { FileBase } from './base';

export type { DirectoryInfo, FileInfo } from '@/lib/filesystem/folder-scanner';
export type { FileBase } from './base';

import { FileType } from './base';

// Re-exportar tipos importados para que estén disponibles

export type FileRelations = Record<string, never>;

export type FileCreateInput = Omit<FileBase, 'id' | 'createdAt' | 'updatedAt' | 'accessedAt' | 'modifiedAt'>;

export type FileUpdateInput = Partial<Omit<FileBase, 'id'>>;

export interface FileFilterOptions {
	searchTerm?: string;
	fileTypes?: FileType[];
	extensions?: string[];
	minSize?: number;
	maxSize?: number;
	modifiedAfter?: Date;
	modifiedBefore?: Date;
	sortBy?: keyof FileBase;
	sortOrder?: 'asc' | 'desc';
}

/**
 * Resultado de la lectura de un directorio
 */
export interface DirectoryReadResult {
	path: string;
	items: FileBase[]; // mezcla de archivos y carpetas
	files: FileInfo[];
	directories: DirectoryInfo[];
	totalItems: number;
	hasMore: boolean;
	// Campos agregados opcionalmente por el servidor
	totalSize?: number;
}

/**
 * Resultado de operaciones de copia o movimiento de archivos
 */
export interface FileCopyMoveResult {
	success: boolean;
	sourcePath: string;
	destPath: string;
	isDirectory: boolean;
	sourceInfo: FileBase;
	destInfo: FileBase;
	timestamp: Date;
	error?: string;
}

/**
 * Opciones para operaciones de archivo
 */
export interface FileOperationOptions {
	overwrite?: boolean;
	recursive?: boolean;
	preserveTimestamps?: boolean;
	filter?: (path: string) => boolean;
}

/**
 * Resultado de operaciones generales de archivo
 */
export interface FileOperationResult {
	success: boolean;
	path: string;
	operation: 'create' | 'read' | 'update' | 'delete' | 'copy' | 'move' | 'rename';
	file?: FileBase;
	error?: string;
}

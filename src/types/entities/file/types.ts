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
	extensions?: string[];
	fileTypes?: FileType[];
	maxSize?: number;
	minSize?: number;
	modifiedAfter?: Date;
	modifiedBefore?: Date;
	searchTerm?: string;
	sortBy?: keyof FileBase;
	sortOrder?: 'asc' | 'desc';
}

/**
 * Resultado de la lectura de un directorio
 */
export interface DirectoryReadResult {
	directories: DirectoryInfo[];
	files: FileInfo[];
	hasMore: boolean;
	items: FileBase[]; // mezcla de archivos y carpetas
	path: string;
	totalItems: number;
	// Campos agregados opcionalmente por el servidor
	totalSize?: number;
}

/**
 * Resultado de operaciones de copia o movimiento de archivos
 */
export interface FileCopyMoveResult {
	destInfo: FileBase;
	destPath: string;
	error?: string;
	isDirectory: boolean;
	sourceInfo: FileBase;
	sourcePath: string;
	success: boolean;
	timestamp: Date;
}

/**
 * Opciones para operaciones de archivo
 */
export interface FileOperationOptions {
	filter?: (path: string) => boolean;
	overwrite?: boolean;
	preserveTimestamps?: boolean;
	recursive?: boolean;
}

/**
 * Resultado de operaciones generales de archivo
 */
export interface FileOperationResult {
	error?: string;
	file?: FileBase;
	operation: 'create' | 'read' | 'update' | 'delete' | 'copy' | 'move' | 'rename';
	path: string;
	success: boolean;
}

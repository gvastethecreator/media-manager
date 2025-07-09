/**
 * 📁 Tipos canónicos para la entidad File
 */
import { FileType } from './base';

export type FileBase = {
	id: string;
	name: string;
	path: string;
	type: FileType | string;
	size: number;
	createdAt: Date;
	updatedAt: Date;
	modifiedAt: Date;
	accessedAt: Date;
	isDirectory: boolean;
	parentPath: string;
	absolutePath: string;
	relativePath: string;
	extension: string;
	mimeType: string;
};

export type FileInfo = FileBase;

export type ImageFileInfo = FileBase & {
	type: FileType.IMAGE;
	width?: number;
	height?: number;
};

export type DirectoryInfo = FileBase & {
	isDirectory: true;
	childCount?: number;
};

export type FileRelations = Record<string, never>;

export type FileCreateInput = Omit<FileBase, 'id' | 'createdAt' | 'updatedAt' | 'accessedAt' | 'modifiedAt'>;

export type FileUpdateInput = Partial<Omit<FileBase, 'id'>>;

export type FileFilterOptions = {
	searchTerm?: string;
	fileTypes?: FileType[];
	extensions?: string[];
	minSize?: number;
	maxSize?: number;
	modifiedAfter?: Date;
	modifiedBefore?: Date;
	sortBy?: keyof FileBase;
	sortOrder?: 'asc' | 'desc';
};

/**
 * Resultado de la lectura de un directorio
 */
export type DirectoryReadResult = {
	path: string;
	items: FileBase[]; // mezcla de archivos y carpetas
	files: FileInfo[];
	directories: DirectoryInfo[];
	totalItems: number;
	hasMore: boolean;
	// Campos agregados opcionalmente por el servidor
	totalSize?: number;
};

/**
 * Resultado de operaciones de copia o movimiento de archivos
 */
export type FileCopyMoveResult = {
	success: boolean;
	sourcePath: string;
	destPath: string;
	isDirectory: boolean;
	sourceInfo: FileInfo;
	destInfo: FileInfo;
	timestamp: Date;
	error?: string;
};

/**
 * Opciones para operaciones de archivo
 */
export type FileOperationOptions = {
	overwrite?: boolean;
	recursive?: boolean;
	preserveTimestamps?: boolean;
	filter?: (path: string) => boolean;
};

/**
 * Resultado de operaciones generales de archivo
 */
export type FileOperationResult = {
	success: boolean;
	path: string;
	operation: 'create' | 'read' | 'update' | 'delete' | 'copy' | 'move' | 'rename';
	file?: FileInfo;
	error?: string;
};

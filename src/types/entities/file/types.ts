/**
 * 📁 Tipos canónicos para la entidad File
 */
import type { FileType } from './enums';

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

export type FileRelations = {
	// relaciones con otras entidades
};

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
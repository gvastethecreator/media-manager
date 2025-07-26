/**
 * @file Utilidades para transformadores de archivos
 * @module transformers/file/utils
 * @description Contiene funciones auxiliares para las transformaciones de archivos.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import type { Stats } from 'fs';
import { nanoid } from 'nanoid';
import path from 'path';
import {
	getFileExtension,
	getMimeTypeFromExtension,
	isImageExtension,
	isVideoExtension,
} from '@/lib/utils/file/helpers';
import { FileType } from '@/types/entities/file/enums';
import type { DirectoryReadResult, FileInfo, FileOperationResult } from '@/types/entities/file/types';

/**
 * Determina el tipo de archivo basado en su extensión
 * @param filePath - Ruta del archivo
 * @returns Tipo de archivo
 */
export function determineFileType(filePath: string): FileType {
	const extension = getFileExtension(filePath).toLowerCase();

	if (isImageExtension(extension)) {
		return FileType.IMAGE;
	}

	if (isVideoExtension(extension)) {
		return FileType.VIDEO;
	}

	// Audio
	const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'];
	if (audioExtensions.includes(extension)) {
		return FileType.AUDIO;
	}

	// Documentos (incluyendo texto, código, etc.)
	const documentExtensions = [
		'pdf',
		'doc',
		'docx',
		'xls',
		'xlsx',
		'ppt',
		'pptx',
		'txt',
		'md',
		'rtf',
		'html',
		'css',
		'csv',
		'js',
		'ts',
		'jsx',
		'tsx',
		'py',
		'java',
		'cpp',
		'c',
		'h',
		'cs',
		'php',
		'rb',
		'go',
		'rs',
		'json',
		'xml',
		'yml',
		'yaml',
		'toml',
		'ini',
		'cfg',
		'conf',
	];
	if (documentExtensions.includes(extension)) {
		return FileType.DOCUMENT;
	}

	// Archivos comprimidos
	const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];
	if (archiveExtensions.includes(extension)) {
		return FileType.ARCHIVE;
	}

	return FileType.OTHER;
}

/**
 * Determina el tipo MIME de un archivo basado en su extensión
 * @param filePath - Ruta del archivo
 * @returns Tipo MIME
 */
export function determineMimeType(filePath: string): string {
	const extension = getFileExtension(filePath);
	return getMimeTypeFromExtension(extension);
}

/**
 * Genera un ID único para un archivo
 * @param filePath - Ruta del archivo (opcional, para agregar contexto)
 * @returns ID único del archivo
 */
export function generateFileId(filePath?: string): string {
	const baseId = nanoid(12);
	if (filePath) {
		const extension = getFileExtension(filePath);
		return extension ? `${baseId}_${extension.toLowerCase()}` : baseId;
	}
	return baseId;
}

/**
 * Mapea stats del filesystem a FileInfo
 * @param filePath - Ruta del archivo
 * @param stats - Stats del filesystem
 * @returns Información del archivo
 */
export function mapStatsToFileInfo(filePath: string, stats: Stats): FileInfo {
	const name = path.basename(filePath);
	const extension = getFileExtension(name);
	const type = determineFileType(filePath);
	const mimeType = determineMimeType(filePath);
	const parentPath = path.dirname(filePath);

	return {
		id: generateFileId(filePath),
		name,
		path: filePath,
		type,
		size: stats.size,
		createdAt: stats.birthtime,
		updatedAt: stats.mtime, // Usando mtime como updatedAt
		modifiedAt: stats.mtime,
		accessedAt: stats.atime,
		isDirectory: stats.isDirectory(),
		parentPath,
		absolutePath: path.resolve(filePath),
		relativePath: path.relative(process.cwd(), filePath),
		extension,
		mimeType,
	};
}

/**
 * Serializa el resultado de una operación de archivo
 * @param result - Resultado de la operación
 * @returns Resultado serializado
 */
export function serializeFileOperationResult(result: FileOperationResult): FileOperationResult {
	return {
		success: result.success,
		path: result.path,
		operation: result.operation,
		file: result.file,
		error: result.error,
	};
}

/**
 * Serializa el contenido de un directorio
 * @param result - Resultado de lectura de directorio
 * @returns Resultado serializado
 */
export function serializeDirectoryContents(result: DirectoryReadResult): DirectoryReadResult {
	return {
		path: result.path,
		items: result.items,
		files: result.files.map((file: FileInfo) => ({
			...file,
			createdAt: file.createdAt,
			modifiedAt: file.modifiedAt,
			accessedAt: file.accessedAt,
		})),
		directories: result.directories,
		totalItems: result.totalItems,
		hasMore: result.hasMore,
		totalSize: result.totalSize,
	};
}

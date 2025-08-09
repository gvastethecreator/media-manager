/**
 * @file Utilidades para transformadores de archivos
 * @module transformers/file/utils
 * @description Contiene funciones auxiliares para las transformaciones de archivos.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import { nanoid } from 'nanoid';
import {
	getFileExtension,
	getMimeTypeFromExtension,
	isImageExtension,
	isVideoExtension,
} from '../../lib/utils/file/helpers';
import type { FileBase } from '../../types/entities/file/base';
import { FileType } from '../../types/entities/file/base';

// Tipos locales para compatibilidad
type FileInfo = FileBase;

interface DirectoryReadResult {
	path: string;
	items: FileBase[];
	total: number;
}

interface FileOperationResult {
	success: boolean;
	path: string;
	operation: 'create' | 'read' | 'update' | 'delete' | 'copy' | 'move' | 'rename';
	file?: FileInfo;
	error?: string;
}

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

	return FileType.UNKNOWN;
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
// mapStatsToFileInfo se movió a utils.server.ts para evitar dependencias Node en cliente

/**
 * Serializa el resultado de una operación de archivo
 * @param success - Si la operación fue exitosa
 * @param path - Ruta del archivo
 * @param operation - Tipo de operación realizada
 * @param file - Información del archivo (opcional)
 * @param error - Mensaje de error (opcional)
 * @returns Resultado serializado
 */
export function serializeFileOperationResult(
	success: boolean,
	path: string,
	operation: 'create' | 'read' | 'update' | 'delete' | 'copy' | 'move' | 'rename',
	file?: FileInfo,
	error?: string
): FileOperationResult {
	return {
		success,
		path,
		operation,
		file,
		error,
	};
}

/**
 * Serializa el contenido de un directorio
 * @param path - Ruta del directorio
 * @param items - Lista de archivos y directorios
 * @returns Resultado serializado
 */
export function serializeDirectoryContents(path: string, items: FileBase[]): DirectoryReadResult {
	return {
		path,
		items,
		total: items.length,
	};
}

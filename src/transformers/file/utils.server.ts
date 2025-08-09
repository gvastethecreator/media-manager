/**
 * @file Utilidades server-only para transformadores de archivos
 * @module transformers/file/utils.server
 * @description Contiene funciones auxiliares que dependen de Node APIs.
 */

import type { Stats } from 'fs';
import path from 'path';
import type { FileBase } from '../../types/entities/file/base';
import { determineFileType, determineMimeType, generateFileId } from './utils';

// Tipos locales para compatibilidad
export type FileInfo = FileBase;

/**
 * Mapea stats del filesystem a FileInfo (server-only)
 * @param filePath - Ruta del archivo
 * @param stats - Stats del filesystem
 * @returns Información del archivo
 */
export function mapStatsToFileInfo(filePath: string, stats: Stats): FileInfo {
	const name = path.basename(filePath);
	const extension = (name.split('.').pop() || '').toLowerCase();
	const relativePath = path.relative(process.cwd(), filePath);

	return {
		id: generateFileId(filePath),
		name,
		path: filePath,
		size: stats.size,
		hash: '',
		mimeType: determineMimeType(filePath),
		extension,
		type: determineFileType(filePath),
		isDirectory: stats.isDirectory(),
		parentPath: path.dirname(filePath),
		absolutePath: path.resolve(filePath),
		relativePath,
		modifiedAt: stats.mtime,
		accessedAt: stats.atime,
		folderId: null,
		isHidden: name.startsWith('.'),
		isReadonly: false,
		createdAt: stats.birthtime,
		updatedAt: stats.mtime,
	} as FileInfo;
}

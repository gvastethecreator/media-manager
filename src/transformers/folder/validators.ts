/**
 * @file Validadores para la entidad Folder
 * @module transformers/folder/validators
 * @description Validación de datos usando esquemas Zod para la entidad Folder
 
 */

import { TransformerError } from '@/lib/errors/transformer-error';
import { serverLogger } from '@/lib/logger/server-logger';
import { isValidFolderId } from '@/lib/utils/folder-id-generator';
import type { FolderBase, FolderCreateInput, FolderUpdateInput } from '@/types/entities/folder/types';
import {
	FolderBaseSchema as CanonicalFolderSchema,
	CreateFolderSchema as CanonicalCreateFolderSchema,
	UpdateFolderSchema as CanonicalUpdateFolderSchema,
} from '@/types/entities/folder/schema';

const logger = serverLogger.withContext('FolderValidators');

/**
 * Esquema base para validación de carpetas
 */
export const folderBaseSchema = CanonicalFolderSchema;

/**
 * Esquema para crear carpetas
 */
export const folderCreateSchema = CanonicalCreateFolderSchema;

/**
 * Esquema para actualizar carpetas
 */
export const folderUpdateSchema = CanonicalUpdateFolderSchema;

/**
 * Valida datos de entrada para crear una carpeta
 */
export function validateFolderCreate(data: unknown): FolderCreateInput {
	try {
		const parsed = folderCreateSchema.parse(data);
		return parsed as FolderCreateInput;
	} catch (error) {
		logger.error('Error validando datos de creación de carpeta', { error, data });
		throw new TransformerError('Datos de creación de carpeta inválidos');
	}
}

/**
 * Valida datos de entrada para actualizar una carpeta
 */
export function validateFolderUpdate(data: unknown): FolderUpdateInput {
	try {
		const parsed = folderUpdateSchema.parse(data);
		return parsed as FolderUpdateInput;
	} catch (error) {
		logger.error('Error validando datos de actualización de carpeta', { error, data });
		throw new TransformerError('Datos de actualización de carpeta inválidos');
	}
}

/**
 * Valida un objeto carpeta base
 */
export function validateFolder(data: unknown): FolderBase {
	try {
		const parsed = folderBaseSchema.parse(data);
		return parsed as FolderBase;
	} catch (error) {
		logger.error('Error validando carpeta', { error, data });
		throw new TransformerError('Datos de carpeta inválidos');
	}
}

/**
 * Valida un array de carpetas
 */
export function validateFolders(data: unknown[]): FolderBase[] {
	try {
		return data.map(validateFolder);
	} catch (error) {
		logger.error('Error validando array de carpetas', { error, data });
		throw new TransformerError('Array de carpetas inválido');
	}
}

/**
 * Valida una ruta de carpeta
 */
export function validateFolderPath(path: string): string {
	if (!path || typeof path !== 'string') {
		throw new TransformerError('La ruta de carpeta es requerida');
	}

	if (path.length > 500) {
		throw new TransformerError('La ruta de carpeta es demasiado larga');
	}

	// Normalizar la ruta
	const normalizedPath = path.replace(/\\/g, '/').replace(/\/+/g, '/');

	if (!normalizedPath.startsWith('/')) {
		return `/${normalizedPath}`;
	}

	return normalizedPath;
}

/**
 * Valida un ID de carpeta
 */
export function validateFolderId(id: string): string {
	if (!id || typeof id !== 'string') {
		logger.error('Error validando ID de carpeta: ID vacío o no es string', { id });
		throw new TransformerError('ID de carpeta inválido');
	}

	if (!isValidFolderId(id)) {
		logger.error('Error validando ID de carpeta: formato inválido', { id });
		throw new TransformerError('ID de carpeta inválido');
	}

	return id;
}

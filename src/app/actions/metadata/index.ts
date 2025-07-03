'use server';

/**
 * @file Exportaciones asíncronas para funciones de gestión de metadatos
 * @module app/actions/metadata
 */

import { getPrismaClient } from '@/lib/database/db';
import { serverLogger } from '@/lib/logger/server-logger';
import type { FileMetadata } from '@/types/metadata';
import * as MetadataActions from './metadata.actions';
import * as MetadataErrorsActions from './metadata-errors.actions';
import * as MetadataExtractorsActions from './metadata-extractors.actions';
import * as MetadataParsersActions from './metadata-parsers.actions';
import { parseMetadataString as parseMetadataStringInternal } from './metadata-parsers.actions';
import * as MetadataUtilsActions from './metadata-utils.actions';

// Logger para funciones de este archivo
const metadataLogger = serverLogger.withContext('MetadataIndexActions');

// Re-exportamos cada función como asíncrona para cumplir con las restricciones de 'use server'

// Exportaciones de metadata-errors.actions
export async function createMetadataError(...args: Parameters<typeof MetadataErrorsActions.createMetadataError>) {
	return MetadataErrorsActions.createMetadataError(...args);
}

// Exportaciones de metadata-extractors.actions
export async function extractMetadata(...args: Parameters<typeof MetadataExtractorsActions.extractMetadata>) {
	return MetadataExtractorsActions.extractMetadata(...args);
}
export async function clearMetadataCache(...args: Parameters<typeof MetadataExtractorsActions.clearMetadataCache>) {
	return MetadataExtractorsActions.clearMetadataCache(...args);
}

// Exportaciones de metadata-parsers.actions
export async function parseExifData(...args: Parameters<typeof MetadataParsersActions.parseExifData>) {
	return MetadataParsersActions.parseExifData(...args);
}
export async function parseSharpMetadata(...args: Parameters<typeof MetadataParsersActions.parseSharpMetadata>) {
	return MetadataParsersActions.parseSharpMetadata(...args);
}
export async function parseMetadataString(...args: Parameters<typeof MetadataParsersActions.parseMetadataString>) {
	return MetadataParsersActions.parseMetadataString(...args);
}
export async function getAIGenerationInfo(...args: Parameters<typeof MetadataParsersActions.getAIGenerationInfo>) {
	return MetadataParsersActions.getAIGenerationInfo(...args);
}

// Exportaciones de metadata-utils.actions
export async function getImageFormat(...args: Parameters<typeof MetadataUtilsActions.getImageFormat>) {
	return MetadataUtilsActions.getImageFormat(...args);
}
export async function isSupportedImageFormat(...args: Parameters<typeof MetadataUtilsActions.isSupportedImageFormat>) {
	return MetadataUtilsActions.isSupportedImageFormat(...args);
}
export async function withRetry(...args: Parameters<typeof MetadataUtilsActions.withRetry>) {
	return MetadataUtilsActions.withRetry(...args);
}

// Exportaciones de metadata.actions
export async function getImageMetadata(...args: Parameters<typeof MetadataActions.getImageMetadata>) {
	return MetadataActions.getImageMetadata(...args);
}

// Restauramos la función getImageMetadataById directamente en este archivo
/**
 * Obtiene y parsea los metadatos de una imagen por su ID
 */
export async function getImageMetadataById(imageId: string): Promise<FileMetadata | null> {
	try {
		metadataLogger.info(`Consultando metadatos para imagen: ${imageId}`);

		const prisma = await getPrismaClient();
		const image = await prisma.image.findUnique({
			where: { id: imageId },
			select: { metadata: true },
		});

		if (!image || !image.metadata) {
			metadataLogger.warn(`No se encontraron metadatos para la imagen: ${imageId}`);
			return null;
		}

		// Usar la función existente para parsear los metadatos
		const parsedMetadata = await parseMetadataStringInternal(image.metadata as string);

		return parsedMetadata;
	} catch (error) {
		metadataLogger.error(`Error obteniendo metadatos para imagen ${imageId}:`, error);
		return null;
	}
}

// Exportar tipos relevantes (no necesitan ser async)
export type { MetadataErrorData } from './metadata-errors.actions';
export type { ImageFormat } from './metadata-types.actions';
export type { FileMetadata }; // Se importó arriba

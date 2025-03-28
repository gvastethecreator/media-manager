// Re-exportar tipos y errores
export * from './metadata-extractors.actions';
export * from './metadata-parsers.actions';
export * from './metadata-types.actions';
export * from './metadata-utils.actions';
export * from './metadata.actions';

// Re-exportar funciones principales
export { clearMetadataCache, extractMetadata, preloadMetadata } from './metadata-extractors.actions';

// Re-exportar utilidades públicas
export { getImageFormat, isSupportedImageFormat } from './metadata-utils.actions';

// Función para obtener metadatos desde servidor por ID
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import type { FileMetadata } from '@/types/metadata.types';
import { parseMetadataString } from './metadata-parsers.actions';

const metadataLogger = serverLogger.withContext('MetadataAPI');

/**
 * Obtiene y parsea los metadatos de una imagen por su ID
 */
export async function parseMetadata(imageId: string): Promise<FileMetadata | null> {
	try {
		metadataLogger.info(`Consultando metadatos para imagen: ${imageId}`);

		const image = await prisma.image.findUnique({
			where: { id: imageId },
			select: { metadata: true },
		});

		if (!image || !image.metadata) {
			metadataLogger.warn(`No se encontraron metadatos para la imagen: ${imageId}`);
			return null;
		}

		// Usar la función existente para parsear los metadatos
		const parsedMetadata = await parseMetadataString(image.metadata);

		return parsedMetadata;
	} catch (error) {
		metadataLogger.error(`Error obteniendo metadatos para imagen ${imageId}:`, error);
		return null;
	}
}

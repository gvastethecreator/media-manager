'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';

// Logger específico para acciones de ImageCard
const imageCardLogger = serverLogger.withContext('ImageCardActions');

// Interfaz para metadatos reducidos de una imagen
interface ImageMetadata {
	width?: number;
	height?: number;
	format?: string;
	size?: number;
	exif?: any;
}

// Interfaz para los datos de imagen
export interface ImageCardData {
	id: string;
	name: string;
	description?: string | null;
	thumbnailUrl?: string;
	width?: number;
	height?: number;
	metadata?: ImageMetadata | null;
	tags?: { id: string; name: string; color: string }[];
}

/**
 * Obtiene la información de una imagen para mostrar en la tarjeta
 * @param imageId ID de la imagen
 * @returns Datos de la imagen con su thumbnail
 */
export async function getImageCardData(imageId: string): Promise<ImageCardData> {
	try {
		imageCardLogger.info('🔍 Obteniendo información de imagen para tarjeta:', imageId);

		// Verificar que el ID es válido
		if (!imageId) {
			throw new Error('ID de imagen no proporcionado');
		}

		// Obtener la imagen con sus datos relacionados
		const image = await prisma.image.findUnique({
			where: {
				id: imageId,
			},
			select: {
				id: true,
				name: true,
				description: true,
				thumbnail: true,
				thumbnailWidth: true,
				thumbnailHeight: true,
				width: true,
				height: true,
				size: true,
				metadata: true,
				tags: {
					select: {
						id: true,
						name: true,
						color: true,
					},
				},
			},
		});

		if (!image) {
			throw new Error(`Imagen no encontrada: ${imageId}`);
		}

		// Parsear metadatos si existen
		let parsedMetadata: ImageMetadata | null = null;
		if (image.metadata) {
			try {
				parsedMetadata = JSON.parse(image.metadata);
			} catch (err) {
				imageCardLogger.warn('⚠️ Error al parsear metadatos de imagen:', err);
			}
		}

		// Convertir thumbnail a URL de datos
		let thumbnailUrl = '';
		if (image.thumbnail) {
			thumbnailUrl = `data:image/jpeg;base64,${Buffer.from(image.thumbnail).toString('base64')}`;
		}

		const result: ImageCardData = {
			id: image.id,
			name: image.name,
			description: image.description,
			thumbnailUrl,
			width: image.width,
			height: image.height,
			metadata: parsedMetadata,
			tags: image.tags,
		};

		imageCardLogger.info('✅ Información de imagen obtenida correctamente');
		return result;
	} catch (error) {
		imageCardLogger.error('❌ Error obteniendo información de imagen:', error);
		throw new Error(`Error al obtener datos de imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}
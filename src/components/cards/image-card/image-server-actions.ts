'use server';

import { getPrismaClient } from '@/lib/db';
import { serverLogger } from '@/lib/logger/server-logger';
import { fromPrismaImageToCardData } from '@/transformers/image/transformer';
import type { ImageWithStats } from '@/types/entities/image/types';

// Logger específico para acciones de ImageCard
const imageCardLogger = serverLogger.withContext('ImageCardActions');

// Interfaz para metadatos reducidos de una imagen
interface ImageMetadata {
	width?: number;
	height?: number;
	format?: string;
	size?: number;
	exif?: any;
	colorSpace?: string;
	hasAlpha?: boolean;
	isAnimated?: boolean;
	location?: {
		latitude: number;
		longitude: number;
		altitude?: number;
	};
	camera?: {
		make?: string;
		model?: string;
		software?: string;
	};
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
	albums?: { id: string; name: string; color: string }[];
	characters?: { id: string; name: string; color: string }[];
	places?: { id: string; name: string; color: string }[];
	groups?: { id: string; name: string; color: string }[];
	hash?: string;
	folderId?: string;
	isFavorite?: boolean;
	createdAt?: Date;
	updatedAt?: Date;
	_count?: {
		tags?: number;
		albums?: number;
		collections?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
		notes?: number;
	};
}

/**
 * Obtiene la información de una imagen para mostrar en la tarjeta
 * @param imageId ID de la imagen
 * @returns Datos de la imagen con su thumbnail y estadísticas
 */
export async function getImageCardData(imageId: string): Promise<ImageWithStats | null> {
	try {
		imageCardLogger.info('🔍 Obteniendo información de imagen para tarjeta:', imageId);
		const prisma = await getPrismaClient();

		if (!imageId) {
			imageCardLogger.warn('⚠️ ID de imagen no proporcionado');
			return null;
		}

		const image = await prisma.image.findUnique({
			where: { id: imageId },
			include: {
				tags: true,
				albums: true,
				characters: true,
				places: true,
				groups: true,
				_count: {
					select: {
						tags: true,
						albums: true,
						collections: true,
						characters: true,
						places: true,
						worldItems: true,
						notes: true,
					},
				},
			},
		});

		if (!image) {
			imageCardLogger.warn(`⚠️ Imagen no encontrada: ${imageId}`);
			return null;
		}

		// @ts-expect-error - El tipo de Prisma no coincide exactamente, pero el transformer lo maneja
		const result = fromPrismaImageToCardData(image);
		imageCardLogger.info('✅ Información de imagen obtenida correctamente');
		return result;
	} catch (error) {
		imageCardLogger.error('❌ Error obteniendo información de imagen:', error);
		// En lugar de lanzar un error que rompa la UI, devolvemos null
		// El componente Card se encargará de mostrar un estado de error
		return null;
	}
}

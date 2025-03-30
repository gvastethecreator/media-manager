'use server';

import { getPrismaClient } from '@/lib/db';
import { serverLogger } from '@/lib/logger/server-logger';

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
 * @returns Datos de la imagen con su thumbnail
 */
export async function getImageCardData(imageId: string): Promise<ImageCardData> {
	try {
		imageCardLogger.info('🔍 Obteniendo información de imagen para tarjeta:', imageId);
		const prisma = await getPrismaClient();

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
				isFavorite: true,
				hash: true,
				folderId: true,
				createdAt: true,
				updatedAt: true,
				tags: {
					select: {
						id: true,
						name: true,
						color: true,
					},
				},
				albums: {
					select: {
						id: true,
						name: true,
						color: true,
					},
				},
				characters: {
					select: {
						id: true,
						name: true,
						color: true,
					},
				},
				places: {
					select: {
						id: true,
						name: true,
						color: true,
					},
				},
				groups: {
					select: {
						id: true,
						name: true,
						color: true,
					},
				},
				_count: {
					select: {
						tags: true,
						albums: true,
						collections: true,
						characters: true,
						places: true,
						worldItems: true,
						notes: true,
					}
				}
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
			albums: image.albums,
			characters: image.characters,
			places: image.places,
			groups: image.groups,
			hash: image.hash,
			folderId: image.folderId,
			isFavorite: image.isFavorite,
			createdAt: image.createdAt,
			updatedAt: image.updatedAt,
			_count: image._count,
		};

		imageCardLogger.info('✅ Información de imagen obtenida correctamente');
		return result;
	} catch (error) {
		imageCardLogger.error('❌ Error obteniendo información de imagen:', error);
		throw new Error(`Error al obtener datos de imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}
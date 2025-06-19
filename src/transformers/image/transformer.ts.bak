/**
 * @file Transformador principal para la entidad Image
 * @module transformers/image
 * @description Funciones para transformar imágenes de su formato Prisma al formato de la aplicación
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { pathToUrl } from '@/lib/url-utils';
import { BaseImageSchema, CompleteImageSchema, ExtendedImageSchema } from '@/lib/validators/image-validators';
import type { ImageBase, ImageComplete, ImageExtended } from '@/types/entities/image/types';
import { createTransformerError, TransformerErrorCode } from '@/utils/errors/transformer-errors';
import { calculateAspectRatio, formatFileSize, generateThumbnailUrl } from '@/utils/image-utils';
import type { Album, Character, Concept, Group, Note, Place, Image as PrismaImage, Prompt, Property, Tag, Wildcard, WorldItem } from '@prisma/client';

const logger = serverLogger.withContext('ImageTransformer');

type ImageWithRelations = PrismaImage & {
	tags?: Tag[];
	albums?: Album[];
	characters?: Character[];
	places?: Place[];
	worldItems?: WorldItem[];
	concepts?: Concept[];
	prompts?: Prompt[];
	notes?: Note[];
	wildcards?: Wildcard[];
	properties?: Property[];
	groups?: Group[];
	_count?: {
		tags?: number;
		albums?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
};

/**
 * ⚠️ Robustez reforzada: nunca se propagan arrays nulos, promesas ni datos corruptos.
 * Todos los métodos de transformación de arrays filtran y loguean exclusiones.
 * Si modificas la estructura de Image, actualiza este archivo y el README.md.
 */

/**
 * Interfaz para mapear objetos de imagen a formato base
 */
interface ImageMapper {
	id: string;
	name?: string;
	path?: string;
	hash?: string;
	createdAt?: Date | string;
	updatedAt?: Date | string;
	size?: number;
	width?: number;
	height?: number;
	folderId?: string | null;
	[key: string]: any;
}

/**
 * Mapea un objeto de imagen al formato base
 * @param image Objeto de imagen
 * @returns Imagen en formato base
 */
function mapImageToBase(image: ImageMapper): ImageBase {
	return {
		id: image.id,
		name: image.name || 'Imagen sin nombre',
		path: image.path || '',
		hash: image.hash || '',
		createdAt: image.createdAt instanceof Date ? image.createdAt : new Date(image.createdAt || Date.now()),
		updatedAt: image.updatedAt instanceof Date ? image.updatedAt : new Date(image.updatedAt || Date.now()),
		size: image.size || 0,
		width: image.width || 0,
		height: image.height || 0,
		folderId: image.folderId || null,
		description: image.description || null,
		isFavorite: image.isFavorite || false,
		addedAt: image.addedAt instanceof Date ? image.addedAt : new Date(image.addedAt || Date.now()),
		sortBy: image.sortBy || 'name',
		filters: image.filters || '{}',
	};
}

/**
 * Mapea un objeto de imagen al formato completo
 * @param image Objeto de imagen original
 * @param baseImage Imagen en formato base
 * @returns Imagen en formato completo
 */
function mapImageToComplete(image: ImageMapper, baseImage: ImageBase): ImageComplete {
	return {
		...baseImage,
		url: image.url || pathToUrl(baseImage.path),
		aspectRatio: calculateAspectRatio(baseImage.width, baseImage.height),
		thumbnails: {},
		metadata: image.metadata || {},
		stats: {
			views: image.stats?.views || 0,
			downloads: image.stats?.downloads || 0,
			favorites: image.stats?.favorites || 0,
			lastAccessed: image.stats?.lastAccessed || null,
		},
		visualConfig: {
			isHidden: image.visualConfig?.isHidden || false,
			isPinned: image.visualConfig?.isPinned || false,
			dominantColor: calculateDominantColor(image) || '#333333',
		},
		isPublic: image.isPublic || false,
		// Relaciones
		folder: image.folder || { id: baseImage.folderId || '' },
		// Campos de thumbnail
		thumbnail: image.thumbnail || null,
		thumbnailSize: image.thumbnailSize || null,
		thumbnailWidth: image.thumbnailWidth || null,
		thumbnailHeight: image.thumbnailHeight || null,
		thumbnailError: image.thumbnailError || null,
		thumbnailErrorAt: image.thumbnailErrorAt || null,
		thumbnailOptimizedAt: image.thumbnailOptimizedAt || null,
		// Campos de conteo
		_count: image._count || {},
	};
}

/**
 * Mapea un objeto de imagen al formato extendido
 * @param image Objeto de imagen original
 * @param completeImage Imagen en formato completo
 * @returns Imagen en formato extendido
 */
function mapImageToExtended(image: ImageMapper, completeImage: ImageComplete): ImageExtended {
	return {
		...completeImage,
		isSelected: false,
		isHighlighted: false,
		isVisible: true,
		isNew: false,
		dominantColor: completeImage.visualConfig?.dominantColor || '#333333',
		displaySize: formatFileSize(completeImage.size),
		displayDimensions: `${completeImage.width}×${completeImage.height}`,
		tags: image.tags || [],
		albums: image.albums || [],
		characters: image.characters || [],
		places: image.places || [],
		worldItems: image.worldItems || [],
		concepts: image.concepts || [],
		prompts: image.prompts || [],
		notes: image.notes || [],
		wildcards: image.wildcards || [],
		properties: image.properties || [],
		groups: image.groups || [],
	};
}

/**
 * Transforma un objeto de imagen al formato básico de la aplicación
 * @param image Objeto de imagen (puede ser de prisma o cualquier formato)
 * @returns Imagen en formato base
 */
export const transformImage = (image: PrismaImage): ImageBase => {
	if (!image) {
		logger.error('Intento de transformar una imagen nula o indefinida');
		throw createTransformerError({
			code: TransformerErrorCode.NULL_INPUT,
			message: 'No se puede transformar una imagen nula o indefinida',
			context: { input: image },
		});
	}

	try {
		const baseImage: ImageBase = {
			id: image.id,
			name: image.name,
			path: image.path,
			hash: image.hash,
			createdAt: image.createdAt,
			updatedAt: image.updatedAt,
			size: image.size,
			width: image.width,
			height: image.height,
			folderId: image.folderId,
			description: image.description,
			isFavorite: image.isFavorite,
			addedAt: image.addedAt,
			// Estos campos no existen en el modelo de Prisma, se asignan valores por defecto.
			sortBy: 'name',
			filters: '{}',
		};

		const validation = BaseImageSchema.safeParse(baseImage);
		if (!validation.success) {
			logger.warn('Transformación a imagen base falló validación:', { error: validation.error, image });
			return baseImage;
		}

		return validation.data;
	} catch (error) {
		logger.error('Error en transformImage:', { error, image });
		throw createTransformerError({
			code: TransformerErrorCode.TRANSFORM_FAILED,
			message: 'Error transformando imagen a formato base',
			cause: error instanceof Error ? error : new Error(String(error)),
			context: { input: image },
		});
	}
};

/**
 * Transforma un array de imágenes al formato básico
 * @param images Array de objetos de imagen
 * @returns Array de imágenes en formato base
 */
export const transformImages = (images: PrismaImage[]): ImageBase[] => {
	if (!Array.isArray(images)) {
		logger.error('Intento de transformar un valor no array:', typeof images);
		return [];
	}

	return images
		.map((image, idx) => {
			if (!image || typeof image !== 'object') {
				logger.warn(`Elemento excluido en posición ${idx}: nulo o tipo inválido`, { image });
				return null;
			}
			try {
				return transformImage(image);
			} catch (error) {
				logger.warn(`Error transformando imagen en array en posición ${idx}:`, { error, image });
				return null;
			}
		})
		.filter((img): img is ImageBase => !!img);
};

/**
 * Transforma un objeto de imagen al formato completo de la aplicación
 * @param image Objeto de imagen
 * @returns Imagen en formato completo
 */
export const transformImageToComplete = (image: ImageWithRelations): ImageComplete => {
	if (!image) {
		logger.error('Intento de transformar a formato completo una imagen nula');
		throw createTransformerError({
			code: TransformerErrorCode.NULL_INPUT,
			message: 'No se puede transformar a formato completo una imagen nula',
			context: { input: image },
		});
	}

	try {
		const baseImage = transformImage(image);
		const completeImage: ImageComplete = {
			...baseImage,
			url: pathToUrl(baseImage.path),
			aspectRatio: calculateAspectRatio(baseImage.width, baseImage.height),
			thumbnails: {
				'150': generateThumbnailUrl(image.id, 150),
				'300': generateThumbnailUrl(image.id, 300),
				'600': generateThumbnailUrl(image.id, 600),
			},
			metadata: typeof image.metadata === 'object' ? image.metadata : {},
			stats: typeof image.stats === 'object' ? image.stats : { views: 0, downloads: 0, favorites: 0, lastAccessed: null },
			visualConfig: typeof image.visualConfig === 'object' ? image.visualConfig : { isHidden: false, isPinned: false, dominantColor: '#333333' },
			isPublic: image.isPublic,
			folder: image.folder,
			thumbnail: image.thumbnail,
			thumbnailSize: image.thumbnailSize,
			thumbnailWidth: image.thumbnailWidth,
			thumbnailHeight: image.thumbnailHeight,
			thumbnailError: image.thumbnailError,
			thumbnailErrorAt: image.thumbnailErrorAt,
			thumbnailOptimizedAt: image.thumbnailOptimizedAt,
			_count: image._count || {},
		};

		const validation = CompleteImageSchema.safeParse(completeImage);
		if (!validation.success) {
			logger.warn('Transformación a imagen completa falló validación:', { error: validation.error, image });
			return completeImage;
		}

		return validation.data;
	} catch (error) {
		logger.error('Error en transformImageToComplete:', { error, image });
		throw createTransformerError({
			code: TransformerErrorCode.TRANSFORM_FAILED,
			message: 'Error transformando imagen a formato completo',
			cause: error instanceof Error ? error : new Error(String(error)),
			context: { input: image },
		});
	}
};

/**
 * Transforma un array de imágenes al formato completo
 * @param images Array de objetos de imagen
 * @returns Array de imágenes en formato completo
 */
export const transformImagesToComplete = (images: ImageWithRelations[]): ImageComplete[] => {
	if (!Array.isArray(images)) {
		logger.error('Intento de transformar un valor no array:', typeof images);
		return [];
	}
	return images
		.map((image, idx) => {
			if (!image || typeof image !== 'object') {
				logger.warn(`Elemento excluido en posición ${idx}: nulo o tipo inválido`, { image });
				return null;
			}
			try {
				return transformImageToComplete(image);
			} catch (error) {
				logger.warn(`Error transformando imagen a completa en array en posición ${idx}:`, { error, image });
				return null;
			}
		})
		.filter((img): img is ImageComplete => !!img);
};

/**
 * Transforma una imagen de Prisma (con relaciones) al formato extendido de la aplicación.
 * @param image - El objeto de imagen de Prisma, incluyendo relaciones opcionales.
 * @returns La imagen transformada al formato `ImageExtended`.
 * @throws {TransformerError} Si la imagen de entrada es nula o la transformación falla.
 */
export const transformImageToExtended = (image: ImageWithRelations): ImageExtended => {
	if (!image) {
		logger.error('Intento de transformar una imagen nula o indefinida');
		throw createTransformerError({
			code: TransformerErrorCode.NULL_INPUT,
			message: 'No se puede transformar una imagen nula o indefinida.',
		});
	}

	try {
		const { width, height, path, size } = image;

		const transformed: ImageExtended = {
			...image,
			// Campos base
			name: image.name ?? 'Imagen sin nombre',
			description: image.description ?? '',
			isFavorite: image.isFavorite ?? false,
			addedAt: image.addedAt ?? new Date(),
			// Campos generados dinámicamente
			url: pathToUrl(path),
			aspectRatio: calculateAspectRatio(width, height),
			thumbnails: {
				small: generateThumbnailUrl(image.id, 'small'),
				medium: generateThumbnailUrl(image.id, 'medium'),
				large: generateThumbnailUrl(image.id, 'large'),
			},
			// UI-related fields with defaults
			isSelected: false,
			isHighlighted: false,
			isVisible: true,
			isNew: Date.now() - new Date(image.createdAt).getTime() < 24 * 60 * 60 * 1000,
			displaySize: formatFileSize(size),
			displayDimensions: `${width}x${height}`,
			// Relaciones (asegurando que no sean nulas)
			tags: image.tags ?? [],
			albums: image.albums ?? [],
			characters: image.characters ?? [],
			places: image.places ?? [],
			worldItems: image.worldItems ?? [],
			concepts: image.concepts ?? [],
			prompts: image.prompts ?? [],
			notes: image.notes ?? [],
			wildcards: image.wildcards ?? [],
			properties: image.properties ?? [],
			groups: image.groups ?? [],
			// Conteo de relaciones
			_count: {
				tags: image._count?.tags ?? 0,
				albums: image._count?.albums ?? 0,
				characters: image._count?.characters ?? 0,
				places: image._count?.places ?? 0,
				worldItems: image._count?.worldItems ?? 0,
				concepts: image._count?.concepts ?? 0,
				prompts: image._count?.prompts ?? 0,
				notes: image._count?.notes ?? 0,
				wildcards: image._count?.wildcards ?? 0,
				properties: image._count?.properties ?? 0,
				groups: image._count?.groups ?? 0,
			},
		};

		// Validar el resultado final con Zod
		const validation = ExtendedImageSchema.safeParse(transformed);
		if (!validation.success) {
			logger.warn('La transformación de imagen extendida falló la validación', {
				errors: validation.error.flatten().fieldErrors,
				image: { id: image.id },
			});
			// Devolver el objeto transformado pero no validado para evitar un fallo completo
			return transformed;
		}

		return validation.data;
	} catch (error) {
		logger.error('Error catastrófico en transformImageToExtended', {
			error: error instanceof Error ? error.message : String(error),
			imageId: image.id,
		});
		throw createTransformerError({
			code: TransformerErrorCode.TRANSFORM_FAILED,
			message: `Error transformando imagen a formato extendido: ${image.id}`,
			cause: error instanceof Error ? error : new Error(String(error)),
			context: { imageId: image.id },
		});
	}
};

/**
 * Transforma un array de imágenes al formato extendido, filtrando las que fallan.
 * @param images - Array de imágenes de Prisma con relaciones.
 * @returns Array de imágenes transformadas al formato `ImageExtended`.
 */
export const transformImagesToExtended = (images: ImageWithRelations[]): ImageExtended[] => {
	if (!Array.isArray(images)) {
		logger.warn('Se esperaba un array para transformImagesToExtended, se recibió:', typeof images);
		return [];
	}

	return images
		.map((image, index) => {
			if (!image) {
				logger.warn(`Elemento nulo en el array de imágenes en el índice ${index}`);
				return null;
			}
			try {
				return transformImageToExtended(image);
			} catch (error) {
				logger.error(`Falló la transformación para la imagen en el índice ${index}`, {
					imageId: image.id,
					error: error instanceof Error ? error.message : String(error),
				});
				return null;
			}
		})
		.filter((image): image is ImageExtended => image !== null);
};

/**
 * Formatea el tamaño de un archivo en bytes a una representación legible
 * @param bytes Tamaño en bytes
 * @returns Tamaño formateado (ej: "1.5 MB")
 */
function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

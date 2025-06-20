/**
 * @file Transformador principal para la entidad Image
 * @module transformers/image
 * @description Funciones para transformar imágenes de su formato Prisma al formato de la aplicación
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { ImageBase, ImageComplete, ImageExtended } from '@/types/entities/image/types';
import { ImageSchema } from '@/types/entities/image/types';
import { createTransformerError, TransformerErrorCode } from '@/utils/errors/transformer-errors';
import type {
	Album,
	Character,
	Concept,
	Group,
	Note,
	Place,
	Image as PrismaImage,
	Prompt,
	Property,
	Tag,
	Wildcard,
	WorldItem,
} from '@prisma/client';

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
			sortBy: 'name', // Valor por defecto
			filters: '{}', // Valor por defecto
		};

		const validation = ImageSchema.safeParse(baseImage);
		if (!validation.success) {
			logger.warn('Transformación a imagen base falló validación:', { error: validation.error, image });
			return baseImage;
		}

		return baseImage;
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
			// Campos de thumbnail
			thumbnail: image.thumbnail ? Buffer.from(image.thumbnail) : null,
			thumbnailSize: image.thumbnailSize,
			thumbnailWidth: image.thumbnailWidth,
			thumbnailHeight: image.thumbnailHeight,
			thumbnailError: image.thumbnailError,
			thumbnailErrorAt: image.thumbnailErrorAt,
			thumbnailOptimizedAt: image.thumbnailOptimizedAt,
			// Campos de conteo
			_count: image._count || {},
			// Relaciones requeridas
			folder: { id: image.folderId || '' },
			stats: undefined,
			activities: [],
			uploadedImages: [],
			profiles: [],
			// Relaciones existentes
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

		return completeImage;
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
		const baseImage = transformImage(image);

		const transformed: ImageExtended = {
			...baseImage,
			// Relaciones (asegurando que no sean nulas)
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
			stats: undefined,
			folder: undefined,
		};

		return transformed;
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

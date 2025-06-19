/**
 * @file Transformador principal para la entidad Image
 * @module transformers/image
 * @description Funciones para transformar imágenes de su formato Prisma al formato de la aplicación
 */

import { Logger } from '@/lib/logger';
import { pathToUrl } from '@/lib/url-utils';
import { BaseImageSchema, CompleteImageSchema, ExtendedImageSchema } from '@/lib/validators/image-validators';
import type { ImageBase, ImageComplete, ImageExtended } from '@/types/entities/image/types';
import type { ThumbnailQuality } from '@/types/thumbnails';
import { createTransformerError, TransformerErrorCode } from '@/utils/errors/transformer-errors';
import { calculateAspectRatio, calculateDominantColor, generateThumbnailUrl } from '@/utils/image-utils';
import path from 'path';

const logger = new Logger('ImageTransformer');

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
export const transformImage = <T extends Record<string, any>>(image: T): ImageBase => {
	if (!image) {
		logger.error('Intento de transformar una imagen nula o indefinida');
		throw createTransformerError({
			code: TransformerErrorCode.NULL_INPUT,
			message: 'No se puede transformar una imagen nula o indefinida',
			context: { input: image },
		});
	}

	try {
		// Mapeamos los datos básicos
		const baseImage = mapImageToBase(image);

		// Validamos con el esquema
		const validation = BaseImageSchema.safeParse(baseImage);
		if (!validation.success) {
			logger.warn('Transformación a imagen base falló validación:', validation.error);
			// Intento de recuperación básica, incluimos solo los campos críticos
			return {
				id: image.id || '',
				name: image.name || 'Imagen sin nombre',
				path: image.path || '',
				hash: image.hash || '',
				createdAt: image.createdAt || new Date(),
				updatedAt: image.updatedAt || new Date(),
				size: image.size || 0,
				width: image.width || 0,
				height: image.height || 0,
				folderId: image.folderId || null,
				description: image.description || null,
				isFavorite: image.isFavorite || false,
				addedAt: image.addedAt || new Date(),
				sortBy: image.sortBy || 'name',
				filters: image.filters || '{}',
			};
		}

		return validation.data;
	} catch (error) {
		logger.error('Error en transformImage:', error);
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
export const transformImages = <T extends Record<string, any>>(images: T[]): ImageBase[] => {
	if (!Array.isArray(images)) {
		logger.error('Intento de transformar un valor no array:', typeof images);
		return [];
	}

	return images
		.map((image, idx) => {
			if (!image || typeof image !== 'object' || typeof image.then === 'function') {
				logger.warn(`Elemento excluido en posición ${idx}: nulo, promesa o tipo inválido`, { image });
				return null;
			}
			try {
				return transformImage(image);
			} catch (error) {
				logger.warn(`Error transformando imagen en array en posición ${idx}:`, error);
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
export const transformImageToComplete = <T extends Record<string, any>>(image: T): ImageComplete => {
	if (!image) {
		logger.error('Intento de transformar a formato completo una imagen nula');
		throw createTransformerError({
			code: TransformerErrorCode.NULL_INPUT,
			message: 'No se puede transformar a formato completo una imagen nula',
			context: { input: image },
		});
	}

	try {
		// Primero transformamos a base para asegurar integridad
		const baseImage = transformImage(image);

		// Luego mapeamos al formato completo
		const completeImage = mapImageToComplete(image, baseImage);

		// Validamos con el esquema
		const validation = CompleteImageSchema.safeParse(completeImage);
		if (!validation.success) {
			logger.warn('Transformación a imagen completa falló validación:', validation.error);
			// Devolvemos una versión garantizada con los campos necesarios
			return {
				...baseImage,
				url: image.url || pathToUrl(image.path),
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
				folder: image.folder || { id: baseImage.folderId || '' },
				thumbnail: image.thumbnail || null,
				thumbnailSize: image.thumbnailSize || null,
				thumbnailWidth: image.thumbnailWidth || null,
				thumbnailHeight: image.thumbnailHeight || null,
				thumbnailError: image.thumbnailError || null,
				thumbnailErrorAt: image.thumbnailErrorAt || null,
				thumbnailOptimizedAt: image.thumbnailOptimizedAt || null,
				_count: image._count || {},
			};
		}

		return validation.data;
	} catch (error) {
		logger.error('Error en transformImageToComplete:', error);
		// Si falla, intentamos devolver al menos la versión base
		try {
			return {
				...transformImage(image),
				url: pathToUrl(image.path),
				aspectRatio: calculateAspectRatio(image.width || 0, image.height || 0),
				thumbnails: {},
				metadata: {},
				stats: { views: 0, downloads: 0, favorites: 0, lastAccessed: null },
				visualConfig: { isHidden: false, isPinned: false, dominantColor: '#333333' },
				isPublic: false,
				folder: { id: image.folderId || '' },
				thumbnail: null,
				thumbnailSize: null,
				thumbnailWidth: null,
				thumbnailHeight: null,
				thumbnailError: null,
				thumbnailErrorAt: null,
				thumbnailOptimizedAt: null,
				_count: {},
			};
		} catch (fallbackError) {
			logger.error('Error crítico en transformador de imagen:', fallbackError);
			throw createTransformerError({
				code: TransformerErrorCode.TRANSFORM_FAILED,
				message: 'Error transformando imagen a formato completo',
				cause: error instanceof Error ? error : new Error(String(error)),
				context: { input: image },
			});
		}
	}
};

/**
 * Transforma un array de imágenes al formato completo
 * @param images Array de objetos de imagen
 * @returns Array de imágenes en formato completo
 */
export const transformImagesToComplete = <T extends Record<string, any>>(images: T[]): ImageComplete[] => {
	if (!Array.isArray(images)) {
		logger.error('Intento de transformar a completo un valor no array:', typeof images);
		return [];
	}

	return images
		.map((image, idx) => {
			if (!image || typeof image !== 'object' || typeof image.then === 'function') {
				logger.warn(`Elemento excluido en posición ${idx}: nulo, promesa o tipo inválido`, { image });
				return null;
			}
			try {
				return transformImageToComplete(image);
			} catch (error) {
				logger.warn(`Error transformando imagen en array a completo en posición ${idx}:`, error);
				return null;
			}
		})
		.filter((img): img is ImageComplete => !!img);
};

/**
 * Transforma un objeto de imagen al formato extendido (UI) de la aplicación
 * @param image Objeto de imagen
 * @returns Imagen en formato extendido listo para UI
 */
export const transformImageToExtended = <T extends Record<string, any>>(image: T): ImageExtended => {
	if (!image) {
		logger.error('Intento de transformar a formato extendido una imagen nula');
		throw createTransformerError({
			code: TransformerErrorCode.NULL_INPUT,
			message: 'No se puede transformar a formato extendido una imagen nula',
			context: { input: image },
		});
	}

	try {
		// Primero transformamos a completo para asegurar todos los campos
		const completeImage = transformImageToComplete(image);

		// Luego mapeamos al formato extendido
		const extendedImage = mapImageToExtended(image, completeImage);

		// Generamos URLs de thumbnails
		const thumbnails = Object.values(ThumbnailQuality).reduce(
			(acc, quality) => {
				acc[quality] = generateThumbnailUrl(image.id, quality);
				return acc;
			},
			{} as Record<ThumbnailQuality, string>
		);

		// Añadimos propiedades calculadas
		extendedImage.thumbnails = thumbnails;
		extendedImage.displayName = extendedImage.name || path.basename(extendedImage.path || '');
		extendedImage.formattedSize = formatFileSize(extendedImage.size);
		extendedImage.dimensions = `${extendedImage.width}×${extendedImage.height}`;

		// Validamos con el esquema
		const validation = ExtendedImageSchema.safeParse(extendedImage);
		if (!validation.success) {
			logger.warn('Transformación a imagen extendida falló validación:', validation.error);
			// Devolvemos una versión garantizada con los campos extendidos mínimos
			return {
				...completeImage,
				thumbnails,
				displayName: image.name || path.basename(image.path || ''),
				formattedSize: formatFileSize(image.size || 0),
				dimensions: `${image.width || 0}×${image.height || 0}`,
				isSelected: false,
				isHighlighted: false,
				isVisible: true,
				isNew: false,
				dominantColor: completeImage.visualConfig?.dominantColor || '#333333',
				tags: [],
				albums: [],
				characters: [],
				places: [],
				worldItems: [],
				concepts: [],
				prompts: [],
				notes: [],
				wildcards: [],
				properties: [],
				groups: [],
			};
		}

		return validation.data as ImageExtended;
	} catch (error) {
		logger.error('Error en transformImageToExtended:', error);
		throw createTransformerError({
			code: TransformerErrorCode.TRANSFORM_FAILED,
			message: 'Error transformando imagen a formato extendido',
			cause: error instanceof Error ? error : new Error(String(error)),
			context: { input: image },
		});
	}
};

/**
 * Transforma un array de imágenes al formato extendido
 * @param images Array de objetos de imagen
 * @returns Array de imágenes en formato extendido
 */
export const transformImagesToExtended = <T extends Record<string, any>>(images: T[]): ImageExtended[] => {
	if (!Array.isArray(images)) {
		logger.error('Intento de transformar a extendido un valor no array:', typeof images);
		return [];
	}

	return images
		.map((image, idx) => {
			if (!image || typeof image !== 'object' || typeof image.then === 'function') {
				logger.warn(`Elemento excluido en posición ${idx}: nulo, promesa o tipo inválido`, { image });
				return null;
			}
			try {
				return transformImageToExtended(image);
			} catch (error) {
				logger.warn(`Error transformando imagen en array a extendido en posición ${idx}:`, error);
				return null;
			}
		})
		.filter((img): img is ImageExtended => !!img);
};

/**
 * Formatea el tamaño de un archivo en bytes a una representación legible
 * @param bytes Tamaño en bytes
 * @returns Tamaño formateado (ej: "1.5 MB")
 */
function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * @file Mappers para transformar entre diferentes formatos de la entidad Image
 * @module transformers/image/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
  CreateImageData,
  ImageBase,
  ImageComplete,
  ImageExtended,
  ImageExtendedComplete,
  ImageMetadata,
  ImageSummary,
  UpdateImageData,
} from '../../types/entities/image';
import {
  deserializeImageMetadata,
  fromImageComplete,
  serializeImageMetadata,
  toImageComplete
} from './serializers';

// Logger específico para mappers de Image
const mapperLogger = serverLogger.withContext('ImageMappers');

/**
 * Mapea una imagen extendida a un resumen para listados
 * @param image Imagen completa
 * @returns Resumen básico de la imagen
 */
export function mapToImageSummary(image: ImageBase | ImageComplete | ImageExtended | ImageExtendedComplete): ImageSummary {
	try {
		return {
			id: image.id,
			name: image.name,
			path: image.path,
			folderId: image.folderId,
			hash: image.hash,
			size: image.size,
			width: image.width,
			height: image.height,
			thumbnailWidth: image.thumbnailWidth,
			thumbnailHeight: image.thumbnailHeight,
			createdAt: image.createdAt,
			updatedAt: image.updatedAt,
		};
	} catch (error) {
		mapperLogger.error('❌ Error al mapear imagen a resumen:', error);
		// En caso de error, devolver un resumen con los datos mínimos disponibles
		return {
			id: image.id || 'unknown',
			name: image.name || 'Error',
			path: image.path || '',
			folderId: image.folderId || '',
			hash: image.hash || '',
			size: image.size || 0,
			width: image.width || 0,
			height: image.height || 0,
			createdAt: image.createdAt || new Date(),
			updatedAt: image.updatedAt || new Date(),
		};
	}
}

/**
 * Mapea un array de imágenes a un array de resúmenes
 * @param images Array de imágenes
 * @returns Array de resúmenes de imágenes
 */
export function mapToImageSummaries(images: (ImageBase | ImageComplete | ImageExtended | ImageExtendedComplete)[]): ImageSummary[] {
	return images.map(mapToImageSummary);
}

/**
 * Prepara los datos de imagen para creación en la base de datos
 * @param data Datos de creación
 * @returns Objeto preparado para inserción en BD
 */
export function mapCreateImageDataToPrisma(data: CreateImageData): Record<string, unknown> {
	try {
		const result: Record<string, unknown> = {
			name: data.name,
			path: data.path,
			folderId: data.folderId,
			hash: data.hash,
			size: data.size,
			width: data.width,
			height: data.height,
		};

		if (data.description) {
			result.description = data.description;
		}

		if (data.presetId) {
			result.presetId = data.presetId;
		}

		// Serializar metadata si existe
		if (data.metadata) {
			if (typeof data.metadata === 'string') {
				result.metadata = data.metadata;
			} else {
				// Usar el nuevo método de serialización
				const tempImage: ImageComplete = {
					...result as any,
					metadata: data.metadata as ImageMetadata
				};
				const serialized = fromImageComplete(tempImage);
				result.metadata = serialized.metadata;
			}
		}

		return result;
	} catch (error) {
		mapperLogger.error('❌ Error al mapear datos de creación de imagen:', error);
		// Devolver el objeto original con manejo básico de errores
		return {
			...data,
			metadata: typeof data.metadata === 'string'
				? data.metadata
				: data.metadata ? JSON.stringify(data.metadata) : null
		};
	}
}

/**
 * Prepara los datos de actualización para la base de datos
 * @param data Datos de actualización
 * @returns Objeto preparado para actualización en BD
 */
export function mapUpdateImageDataToPrisma(data: UpdateImageData): Record<string, unknown> {
	try {
		const result: Record<string, unknown> = {};

		if (data.name !== undefined) {
			result.name = data.name;
		}

		if (data.description !== undefined) {
			result.description = data.description;
		}

		if (data.presetId !== undefined) {
			result.presetId = data.presetId;
		}

		if (data.isFavorite !== undefined) {
			result.isFavorite = data.isFavorite;
		}

		if (data.isPublic !== undefined) {
			result.isPublic = data.isPublic;
		}

		return result;
	} catch (error) {
		mapperLogger.error('❌ Error al mapear datos de actualización de imagen:', error);
		return { ...data };
	}
}

/**
 * Genera propiedades derivadas para una imagen
 * @param image Imagen base o completa
 * @returns Propiedades adicionales calculadas
 */
export function getDerivedImageProperties(image: ImageBase | ImageComplete): Partial<ImageExtended | ImageExtendedComplete> {
	try {
		const derived: Partial<ImageExtendedComplete> = {};

		// Calcular si tiene thumbnail
		derived.hasThumbnail = !!image.thumbnail || (!!image.thumbnailWidth && !!image.thumbnailHeight);

		// Calcular el aspect ratio
		derived.aspectRatio = image.width / image.height;

		// Extraer metadatos si existen
		if ('metadata' in image && typeof image.metadata !== 'string') {
			// Ya tenemos los metadatos deserializados
			derived.metadata = image.metadata;
		} else if (typeof (image as ImageBase).metadata === 'string') {
			// Necesitamos deserializar los metadatos
			const complete = toImageComplete(image as ImageBase);
			derived.metadata = complete.metadata;
		}

		return derived;
	} catch (error) {
		mapperLogger.error('❌ Error al obtener propiedades derivadas de imagen:', error);
		return {
			hasThumbnail: !!image.thumbnail,
			aspectRatio: image.width && image.height ? image.width / image.height : 1
		};
	}
}

/**
 * Actualiza los metadatos de una imagen
 * @param currentMetadata Metadatos actuales (string JSON o undefined)
 * @param updates Actualizaciones parciales a aplicar
 * @returns Metadatos actualizados en formato string
 * @deprecated Use toImageComplete/fromImageComplete workflow instead
 */
export function updateImageMetadata(
	currentMetadata: string | undefined | null,
	updates: Partial<ImageMetadata>
): string {
	try {
		// Usar las nuevas funciones de serialización
		let metadata: ImageMetadata | undefined;

		if (typeof currentMetadata === 'string' && currentMetadata) {
			// Convertir string JSON a objeto
			const temp: ImageBase = { metadata: currentMetadata } as ImageBase;
			const complete = toImageComplete(temp);
			metadata = complete.metadata;
		}

		// Combinar con las actualizaciones
		const combined: ImageMetadata = {
			...(metadata || {}),
			...updates
		};

		// Convertir de vuelta a string JSON
		const temp: ImageComplete = { metadata: combined } as ImageComplete;
		const base = fromImageComplete(temp);
		return base.metadata || '{}';
	} catch (error) {
		mapperLogger.error('❌ Error al actualizar metadatos de imagen:', error);
		// Fallback al método antiguo
		const current = serializeImageMetadata(currentMetadata) || {};
		const updated = { ...current, ...updates };
		return deserializeImageMetadata(updated) || '{}';
	}
}

/**
 * @file Mappers para transformar entre diferentes formatos de la entidad Image
 * @module transformers/image/mappers
 */

import { Logger } from '@/lib/logger';
import { serverLogger } from '@/lib/logger/server-logger';
import type {
    ImageCreateInput,
    ImageFilters,
    ImageSearchOptions,
    ImageUpdateInput,
} from '@/types/entities/image/types';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/utils/transformers/constants';
import { handleTransformerError } from '@/utils/transformers/errors';
import type { Prisma } from '@prisma/client';
import type {
    ImageBase,
    ImageComplete,
    ImageExtended,
    ImageExtendedComplete,
    ImageMetadata,
    ImageSummary
} from '../../types/entities/image';
import {
    deserializeImageMetadata,
    fromImageComplete,
    serializeImageMetadata,
    toImageComplete
} from './serializers';

// Logger específico para mappers de Image
const mapperLogger = serverLogger.withContext('ImageMappers');

const logger = new Logger('ImageMapper');

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
 * 🔄 Mapea datos de creación de Image a formato Prisma
 */
export function mapCreateImageDataToPrisma(data: ImageCreateInput): Prisma.ImageCreateInput {
	try {
		// Preparar datos base
		const baseData = {
			name: data.name,
			description: data.description,
			path: data.path,
			hash: data.hash,
			size: data.size,
			width: data.width,
			height: data.height,
			metadata: data.metadata,
			isFavorite: data.isFavorite ?? false,
			addedAt: data.addedAt ?? new Date(),
		};

		// Preparar relaciones
		const relations = {
			folder: data.folder ? { connect: { id: data.folder.id } } : undefined,
			stats: data.stats ? { connect: { id: data.stats.id } } : undefined,
			activities: data.activities?.length ? { connect: data.activities.map(act => ({ id: act.id })) } : undefined,
			uploadedImages: data.uploadedImages?.length ? { connect: data.uploadedImages.map(img => ({ id: img.id })) } : undefined,
			profiles: data.profiles?.length ? { connect: data.profiles.map(prof => ({ id: prof.id })) } : undefined,
			albums: data.albums?.length ? { connect: data.albums.map(alb => ({ id: alb.id })) } : undefined,
			collections: data.collections?.length ? { connect: data.collections.map(col => ({ id: col.id })) } : undefined,
			tags: data.tags?.length ? { connect: data.tags.map(tag => ({ id: tag.id })) } : undefined,
			characters: data.characters?.length ? { connect: data.characters.map(char => ({ id: char.id })) } : undefined,
			places: data.places?.length ? { connect: data.places.map(place => ({ id: place.id })) } : undefined,
			worldItems: data.worldItems?.length ? { connect: data.worldItems.map(item => ({ id: item.id })) } : undefined,
			concepts: data.concepts?.length ? { connect: data.concepts.map(con => ({ id: con.id })) } : undefined,
			prompts: data.prompts?.length ? { connect: data.prompts.map(prompt => ({ id: prompt.id })) } : undefined,
			notes: data.notes?.length ? { connect: data.notes.map(note => ({ id: note.id })) } : undefined,
			wildcards: data.wildcards?.length ? { connect: data.wildcards.map(wild => ({ id: wild.id })) } : undefined,
			properties: data.properties?.length ? { connect: data.properties.map(prop => ({ id: prop.id })) } : undefined,
			groups: data.groups?.length ? { connect: data.groups.map(group => ({ id: group.id })) } : undefined,
		};

		return {
			...baseData,
			...relations,
		};
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Mapea datos de actualización de Image a formato Prisma
 */
export function mapUpdateImageDataToPrisma(data: ImageUpdateInput): Prisma.ImageUpdateInput {
	try {
		// Preparar datos base
		const baseData = {
			name: data.name,
			description: data.description,
			path: data.path,
			hash: data.hash,
			size: data.size,
			width: data.width,
			height: data.height,
			metadata: data.metadata,
			isFavorite: data.isFavorite,
			updatedAt: new Date(),
		};

		// Preparar relaciones
		const relations = {
			folder: data.folder ? { connect: { id: data.folder.id } } : undefined,
			stats: data.stats ? { connect: { id: data.stats.id } } : undefined,
			activities: data.activities?.length ? { set: data.activities.map(act => ({ id: act.id })) } : undefined,
			uploadedImages: data.uploadedImages?.length ? { set: data.uploadedImages.map(img => ({ id: img.id })) } : undefined,
			profiles: data.profiles?.length ? { set: data.profiles.map(prof => ({ id: prof.id })) } : undefined,
			albums: data.albums?.length ? { set: data.albums.map(alb => ({ id: alb.id })) } : undefined,
			collections: data.collections?.length ? { set: data.collections.map(col => ({ id: col.id })) } : undefined,
			tags: data.tags?.length ? { set: data.tags.map(tag => ({ id: tag.id })) } : undefined,
			characters: data.characters?.length ? { set: data.characters.map(char => ({ id: char.id })) } : undefined,
			places: data.places?.length ? { set: data.places.map(place => ({ id: place.id })) } : undefined,
			worldItems: data.worldItems?.length ? { set: data.worldItems.map(item => ({ id: item.id })) } : undefined,
			concepts: data.concepts?.length ? { set: data.concepts.map(con => ({ id: con.id })) } : undefined,
			prompts: data.prompts?.length ? { set: data.prompts.map(prompt => ({ id: prompt.id })) } : undefined,
			notes: data.notes?.length ? { set: data.notes.map(note => ({ id: note.id })) } : undefined,
			wildcards: data.wildcards?.length ? { set: data.wildcards.map(wild => ({ id: wild.id })) } : undefined,
			properties: data.properties?.length ? { set: data.properties.map(prop => ({ id: prop.id })) } : undefined,
			groups: data.groups?.length ? { set: data.groups.map(group => ({ id: group.id })) } : undefined,
		};

		return {
			...baseData,
			...relations,
		};
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Mapea opciones de búsqueda de Image a formato Prisma
 */
export function mapImageSearchOptionsToPrisma(
	options: ImageSearchOptions
): Prisma.ImageFindManyArgs {
	try {
		const { page = 1, pageSize = DEFAULT_PAGE_SIZE, orderBy, filters = {}, include = {} } = options;

		// Validar y ajustar el tamaño de página
		const validatedPageSize = Math.min(pageSize, MAX_PAGE_SIZE);
		const skip = (page - 1) * validatedPageSize;

		// Mapear ordenamiento
		const orderByMapped = orderBy ? {
			[orderBy.field]: orderBy.direction,
		} : { createdAt: 'desc' };

		// Mapear filtros
		const where = mapImageFiltersToPrisma(filters);

		// Mapear inclusiones
		const includeRelations = {
			folder: include.folder ?? false,
			stats: include.stats ?? false,
			activities: include.activities ?? false,
			uploadedImages: include.uploadedImages ?? false,
			profiles: include.profiles ?? false,
			albums: include.albums ?? false,
			collections: include.collections ?? false,
			tags: include.tags ?? false,
			characters: include.characters ?? false,
			places: include.places ?? false,
			worldItems: include.worldItems ?? false,
			concepts: include.concepts ?? false,
			prompts: include.prompts ?? false,
			notes: include.notes ?? false,
			wildcards: include.wildcards ?? false,
			properties: include.properties ?? false,
			groups: include.groups ?? false,
			_count: include.count ?? false,
		};

		return {
			skip,
			take: validatedPageSize,
			orderBy: orderByMapped,
			where,
			include: includeRelations,
		};
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Mapea filtros de Image a formato Prisma
 */
export function mapImageFiltersToPrisma(filters: ImageFilters): Prisma.ImageWhereInput {
	try {
		const where: Prisma.ImageWhereInput = {};

		// Filtros de texto
		if (filters.search) {
			where.OR = [
				{ name: { contains: filters.search, mode: 'insensitive' } },
				{ description: { contains: filters.search, mode: 'insensitive' } },
			];
		}

		// Filtros de relaciones
		if (filters.folders?.length) {
			where.folder = { id: { in: filters.folders } };
		}
		if (filters.tags?.length) {
			where.tags = { some: { id: { in: filters.tags } } };
		}

		// Filtros de estado
		if (filters.isFavorite !== undefined) {
			where.isFavorite = filters.isFavorite;
		}

		// Filtros de dimensiones
		if (filters.minWidth !== undefined) {
			where.width = { ...where.width, gte: filters.minWidth };
		}
		if (filters.maxWidth !== undefined) {
			where.width = { ...where.width, lte: filters.maxWidth };
		}
		if (filters.minHeight !== undefined) {
			where.height = { ...where.height, gte: filters.minHeight };
		}
		if (filters.maxHeight !== undefined) {
			where.height = { ...where.height, lte: filters.maxHeight };
		}

		// Filtros de tamaño
		if (filters.minSize !== undefined) {
			where.size = { ...where.size, gte: filters.minSize };
		}
		if (filters.maxSize !== undefined) {
			where.size = { ...where.size, lte: filters.maxSize };
		}

		// Filtros de metadatos
		if (filters.hasMetadata) {
			where.metadata = { not: null };
		}
		if (filters.hasThumbnail) {
			where.thumbnail = { not: null };
		}
		if (filters.hasError) {
			where.thumbnailError = { not: null };
		}

		// Filtros de fecha
		if (filters.dateRange?.start) {
			where.createdAt = { ...where.createdAt, gte: filters.dateRange.start };
		}
		if (filters.dateRange?.end) {
			where.createdAt = { ...where.createdAt, lte: filters.dateRange.end };
		}

		return where;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Mapea una Image a su versión relacionada
 */
export function mapImageToRelatedImage(image: ImageComplete): { id: string } {
	try {
		return { id: image.id };
	} catch (error) {
		throw handleTransformerError(error);
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

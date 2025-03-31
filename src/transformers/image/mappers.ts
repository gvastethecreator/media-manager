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
    RelatedImage,
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
 * Convierte cualquier objeto de imagen a una versión ImageComplete completa
 * @param image Objeto image a convertir
 * @returns Una versión ImageComplete del objeto
 */
export function mapImageToComplete(image: any): ImageComplete {
	try {
		// Si ya es un ImageComplete o tiene _count, retornar directamente
		if (Object.prototype.hasOwnProperty.call(image, '_count')) {
			return image as ImageComplete;
		}

		// Asegurarse de que tenga ID
		if (!image.id) {
			throw new Error('Image must have an ID');
		}

		// Crear una versión completa de la imagen
		const imageComplete: ImageComplete = {
			id: image.id,
			name: image.name || '',
			description: image.description || '',
			path: image.path || '',
			hash: image.hash || '',
			size: image.size || 0,
			width: image.width || 0,
			height: image.height || 0,
			thumbnailPath: image.thumbnailPath || null,
			thumbnailWidth: image.thumbnailWidth || 0,
			thumbnailHeight: image.thumbnailHeight || 0,
			metadata: image.metadata || null,
			isFavorite: image.isFavorite || false,
			isPublic: image.isPublic || false,
			folderId: image.folderId || null,
			createdAt: image.createdAt || new Date(),
			updatedAt: image.updatedAt || new Date(),
			addedAt: image.addedAt || new Date(),

			// Relaciones
			folder: image.folder || null,
			tags: image.tags || [],
			albums: image.albums || [],
			collections: image.collections || [],
			characters: image.characters || [],
			places: image.places || [],
			prompts: image.prompts || [],

			// Contadores
			_count: image._count || {
				tags: image.tags?.length || 0,
				albums: image.albums?.length || 0,
				collections: image.collections?.length || 0,
				characters: image.characters?.length || 0,
				places: image.places?.length || 0,
				prompts: image.prompts?.length || 0,
			},
		};

		return imageComplete;
	} catch (error) {
		logger.error('Error convirtiendo a ImageComplete:', error);
		throw error;
	}
}

// Enum para direcciones de ordenamiento
enum SortDirection {
	ASC = 'asc',
	DESC = 'desc'
}

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
		// Base data sin relaciones
		const {
			albums, collections, tags, characters, places, worldItems,
			concepts, prompts, notes, wildcards, properties, groups,
			...baseData
		} = data;

		// Preparar relaciones para creación
		const createRelations: Prisma.ImageCreateInput = {};

		// Crear connect para cada relación si existe
		if (albums?.length) {
			createRelations.albums = {
				connect: albums.map(item => ({ id: item.id }))
			};
		}

		if (collections?.length) {
			createRelations.collections = {
				connect: collections.map(item => ({ id: item.id }))
			};
		}

		if (tags?.length) {
			createRelations.tags = {
				connect: tags.map(item => ({ id: item.id }))
			};
		}

		if (characters?.length) {
			createRelations.characters = {
				connect: characters.map(item => ({ id: item.id }))
			};
		}

		if (places?.length) {
			createRelations.places = {
				connect: places.map(item => ({ id: item.id }))
			};
		}

		if (worldItems?.length) {
			createRelations.worldItems = {
				connect: worldItems.map(item => ({ id: item.id }))
			};
		}

		if (concepts?.length) {
			createRelations.concepts = {
				connect: concepts.map(item => ({ id: item.id }))
			};
		}

		if (prompts?.length) {
			createRelations.prompts = {
				connect: prompts.map(item => ({ id: item.id }))
			};
		}

		if (notes?.length) {
			createRelations.notes = {
				connect: notes.map(item => ({ id: item.id }))
			};
		}

		if (wildcards?.length) {
			createRelations.wildcards = {
				connect: wildcards.map(item => ({ id: item.id }))
			};
		}

		if (properties?.length) {
			createRelations.properties = {
				connect: properties.map(item => ({ id: item.id }))
			};
		}

		if (groups?.length) {
			createRelations.groups = {
				connect: groups.map(item => ({ id: item.id }))
			};
		}

		return {
			...baseData,
			...createRelations,
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
		// Base data sin relaciones
		const {
			albums, collections, tags, characters, places, worldItems,
			concepts, prompts, notes, wildcards, properties, groups,
			...baseData
		} = data;

		// Preparar relaciones para actualización
		const updateRelations: Prisma.ImageUpdateInput = {};

		// Crear set para cada relación si existe
		if (albums) {
			updateRelations.albums = {
				set: albums.map(item => ({ id: item.id }))
			};
		}

		if (collections) {
			updateRelations.collections = {
				set: collections.map(item => ({ id: item.id }))
			};
		}

		if (tags) {
			updateRelations.tags = {
				set: tags.map(item => ({ id: item.id }))
			};
		}

		if (characters) {
			updateRelations.characters = {
				set: characters.map(item => ({ id: item.id }))
			};
		}

		if (places) {
			updateRelations.places = {
				set: places.map(item => ({ id: item.id }))
			};
		}

		if (worldItems) {
			updateRelations.worldItems = {
				set: worldItems.map(item => ({ id: item.id }))
			};
		}

		if (concepts) {
			updateRelations.concepts = {
				set: concepts.map(item => ({ id: item.id }))
			};
		}

		if (prompts) {
			updateRelations.prompts = {
				set: prompts.map(item => ({ id: item.id }))
			};
		}

		if (notes) {
			updateRelations.notes = {
				set: notes.map(item => ({ id: item.id }))
			};
		}

		if (wildcards) {
			updateRelations.wildcards = {
				set: wildcards.map(item => ({ id: item.id }))
			};
		}

		if (properties) {
			updateRelations.properties = {
				set: properties.map(item => ({ id: item.id }))
			};
		}

		if (groups) {
			updateRelations.groups = {
				set: groups.map(item => ({ id: item.id }))
			};
		}

		return {
			...baseData,
			...updateRelations,
		};
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Mapea opciones de búsqueda de Image a formato Prisma
 */
export function mapImageSearchOptionsToPrisma(options: ImageSearchOptions): Prisma.ImageFindManyArgs {
	const { page = 1, pageSize = DEFAULT_PAGE_SIZE, orderBy, filters, include } = options;

	const take = Math.min(pageSize, MAX_PAGE_SIZE);
	const skip = (page - 1) * take;

	// Mapeo predeterminado para ordenamiento
	const defaultOrderBy: Prisma.ImageOrderByWithRelationInput = {
		createdAt: SortDirection.DESC,
	};

	// Construir where input para Prisma basado en filtros
	const where = filters ? mapImageFiltersToPrisma(filters) : {};

	// Construir include para Prisma
	const includeOptions: Prisma.ImageInclude = {};

	if (include) {
		if (include.folder) includeOptions.folder = true;
		if (include.stats) includeOptions.stats = true;
		if (include.activities) includeOptions.activities = true;
		if (include.uploadedImages) includeOptions.uploadedImages = true;
		if (include.profiles) includeOptions.profiles = true;
		if (include.albums) includeOptions.albums = true;
		if (include.collections) includeOptions.collections = true;
		if (include.tags) includeOptions.tags = true;
		if (include.characters) includeOptions.characters = true;
		if (include.places) includeOptions.places = true;
		if (include.worldItems) includeOptions.worldItems = true;
		if (include.concepts) includeOptions.concepts = true;
		if (include.prompts) includeOptions.prompts = true;
		if (include.notes) includeOptions.notes = true;
		if (include.wildcards) includeOptions.wildcards = true;
		if (include.properties) includeOptions.properties = true;
		if (include.groups) includeOptions.groups = true;
		if (include.counts) includeOptions._count = true;
	}

	return {
		where,
		take,
		skip,
		orderBy: orderBy || defaultOrderBy,
		include: Object.keys(includeOptions).length > 0 ? includeOptions : undefined,
	};
}

/**
 * 🔄 Mapea filtros de Image a formato Prisma
 */
export function mapImageFiltersToPrisma(filters: ImageFilters): Prisma.ImageWhereInput {
	try {
		const where: Prisma.ImageWhereInput = {};

		// Filtro de texto
		if (filters.text) {
			where.OR = [
				{ title: { contains: filters.text, mode: 'insensitive' } },
				{ description: { contains: filters.text, mode: 'insensitive' } },
				{ alt: { contains: filters.text, mode: 'insensitive' } },
				{ prompt: { contains: filters.text, mode: 'insensitive' } },
				{ negativePrompt: { contains: filters.text, mode: 'insensitive' } },
				{ params: { contains: filters.text, mode: 'insensitive' } },
			];
		}

		// Filtro por categoría
		if (filters.category) {
			where.category = filters.category;
		}

		// Filtro por tipo
		if (filters.type) {
			where.type = filters.type;
		}

		// Filtro por estado
		if (filters.status) {
			where.status = filters.status;
		}

		// Filtro por favorito
		if (filters.favorite !== undefined) {
			where.favorite = filters.favorite;
		}

		// Filtros por campos booleanos
		if (filters.sensitive !== undefined) {
			where.sensitive = filters.sensitive;
		}

		if (filters.published !== undefined) {
			where.published = filters.published;
		}

		// Filtro por fechas
		if (filters.dateRange) {
			if (filters.dateRange.from) {
				where.createdAt = {
					...(where.createdAt || {}),
					gte: new Date(filters.dateRange.from),
				};
			}
			if (filters.dateRange.to) {
				where.createdAt = {
					...(where.createdAt || {}),
					lte: new Date(filters.dateRange.to),
				};
			}
		}

		// Filtros por relaciones
		if (filters.folderId) {
			where.folderId = filters.folderId;
		}

		// Filtro por IDs de entidades relacionadas
		// Álbumes
		if (filters.albumIds && filters.albumIds.length > 0) {
			where.albums = {
				some: {
					id: { in: filters.albumIds },
				},
			};
		}

		// Colecciones
		if (filters.collectionIds && filters.collectionIds.length > 0) {
			where.collections = {
				some: {
					id: { in: filters.collectionIds },
				},
			};
		}

		// Tags
		if (filters.tagIds && filters.tagIds.length > 0) {
			where.tags = {
				some: {
					id: { in: filters.tagIds },
				},
			};
		}

		// Personajes
		if (filters.characterIds && filters.characterIds.length > 0) {
			where.characters = {
				some: {
					id: { in: filters.characterIds },
				},
			};
		}

		// Lugares
		if (filters.placeIds && filters.placeIds.length > 0) {
			where.places = {
				some: {
					id: { in: filters.placeIds },
				},
			};
		}

		// Items del mundo
		if (filters.worldItemIds && filters.worldItemIds.length > 0) {
			where.worldItems = {
				some: {
					id: { in: filters.worldItemIds },
				},
			};
		}

		// Conceptos
		if (filters.conceptIds && filters.conceptIds.length > 0) {
			where.concepts = {
				some: {
					id: { in: filters.conceptIds },
				},
			};
		}

		// Prompts
		if (filters.promptIds && filters.promptIds.length > 0) {
			where.prompts = {
				some: {
					id: { in: filters.promptIds },
				},
			};
		}

		// Notas
		if (filters.noteIds && filters.noteIds.length > 0) {
			where.notes = {
				some: {
					id: { in: filters.noteIds },
				},
			};
		}

		// Wildcards
		if (filters.wildcardIds && filters.wildcardIds.length > 0) {
			where.wildcards = {
				some: {
					id: { in: filters.wildcardIds },
				},
			};
		}

		// Propiedades
		if (filters.propertyIds && filters.propertyIds.length > 0) {
			where.properties = {
				some: {
					id: { in: filters.propertyIds },
				},
			};
		}

		// Grupos
		if (filters.groupIds && filters.groupIds.length > 0) {
			where.groups = {
				some: {
					id: { in: filters.groupIds },
				},
			};
		}

		return where;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Mapea una Image a su versión relacionada
 */
export function mapImageToRelatedImage(image: ImageComplete): RelatedImage {
	return { id: image.id };
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

/**
 * @file Funciones de mapeo para la entidad Collection
 * @module transformers/collection/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { CollectionComplete, CollectionExtended, CollectionSummary } from '@/types/entities/collection';
import {
    COLLECTION_CATEGORY_COLORS,
    COLLECTION_CATEGORY_EMOJIS,
    type CollectionCategory
} from '@/types/entities/collection';
import type {
    CollectionCreateInput,
    CollectionFilters,
    CollectionSearchOptions,
    CollectionUpdateInput,
    RelatedCollection
} from '@/types/entities/collection/types';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/utils/transformers/constants';
import { handleTransformerError } from '@/utils/transformers/errors';
import type { Image, Prisma, Collection as PrismaCollection } from '@prisma/client';
import {
    toCollectionComplete,
    toCollectionExtended
} from './serializers';

const logger = serverLogger.withContext('CollectionMapper');

// Enum local para direcciones de ordenamiento
enum SortDirection {
    ASC = 'asc',
    DESC = 'desc'
}

// Enum local para rareza de colecciones
enum CollectionRarity {
    COMMON = 'COMMON',
    UNCOMMON = 'UNCOMMON',
    RARE = 'RARE',
    EPIC = 'EPIC',
    LEGENDARY = 'LEGENDARY'
}

/**
 * Mapeador para obtener una lista de colecciones a partir de datos de Prisma
 * @param collections Datos de colecciones desde Prisma
 * @param imageCountMap Mapa opcional con conteo de imágenes por colección
 * @returns Array de CollectionExtended
 */
export function mapCollectionsFromPrisma(
	collections: PrismaCollection[],
	imageCountMap?: Record<string, number>
): CollectionExtended[] {
	return collections.map((collection) => {
        const extended = toCollectionExtended(collection);
        return {
            ...extended,
            imageCount: imageCountMap?.[collection.id] || 0
        };
    });
}

/**
 * Mapeador para obtener un objeto CollectionComplete a partir de datos de Prisma
 * @param collection Datos de colección desde Prisma
 * @returns CollectionComplete con campos JSON deserializados
 */
export function mapCollectionCompletFromPrisma(collection: PrismaCollection): CollectionComplete {
    return toCollectionComplete(collection);
}

/**
 * Mapeador para obtener un objeto CollectionExtended desde CollectionComplete
 * @param collection CollectionComplete
 * @param imageCount Contador opcional de imágenes
 * @returns CollectionExtended con propiedades adicionales
 */
export function mapCollectionExtendedFromComplete(
    collection: CollectionComplete,
    imageCount?: number
): CollectionExtended {
    return {
        ...collection,
        // Propiedades adicionales de UI
        isSelected: false,
        isHovered: false,
        isOpen: false,
        isLoading: false,
        hasError: false,
        // Datos calculados
        parsedFilters: collection.filters,
        imageCount: imageCount || 0,
        totalValue: collection.price || 0,
    };
}

/**
 * Mapeador para obtener un resumen de colecciones a partir de datos extendidos
 * @param collections Colecciones extendidas
 * @returns Array de CollectionSummary
 */
export function mapCollectionsToSummary(collections: CollectionExtended[]): CollectionSummary[] {
	return collections.map((collection) => ({
		id: collection.id,
		name: collection.name,
		emoji: collection.emoji || '🌟',
		color: collection.color || '#3b82f6',
		imageCount: collection.imageCount || 0,
		category: collection.category || undefined,
	}));
}

/**
 * Mapeador para crear datos de colección a partir de un formulario
 * @param formData Datos del formulario
 * @returns Datos parciales de Collection
 */
export function mapFormToCollection(formData: Record<string, any>): Partial<PrismaCollection> {
	return {
		name: formData.name,
		description: formData.description || '',
		emoji: formData.emoji || '🌟',
		color: formData.color || '#3b82f6',
		category: formData.category || null,
		rarity: formData.rarity || CollectionRarity.COMMON,
		url: formData.url || null,
		alternativeUrl: formData.alternativeUrl || null,
		platform: formData.platform || null,
		price: formData.price ? Number.parseFloat(formData.price) : null,
		isFavorite: Boolean(formData.isFavorite),
		presetId: formData.presetId || null,
		texture: formData.texture || null,
	};
}

/**
 * Asigna color y emoji según la categoría si no están definidos
 * @param collection Colección a procesar
 * @returns Colección con color y emoji asignados
 */
export function applyDefaultStyleByCategory(collection: Partial<CollectionExtended>): Partial<CollectionExtended> {
	if (!collection.category) {
		return collection;
	}

	const category = collection.category as CollectionCategory;

	return {
		...collection,
		color: collection.color || COLLECTION_CATEGORY_COLORS[category] || '#3b82f6',
		emoji: collection.emoji || COLLECTION_CATEGORY_EMOJIS[category] || '🌟',
	};
}

/**
 * Extrae las imágenes destacadas de una colección
 * @param collection Colección con imágenes
 * @param maxImages Número máximo de imágenes a extraer
 * @returns URLs de imágenes destacadas
 */
export function extractFeaturedImages(collection: CollectionExtended & { images?: Image[] }, maxImages = 3): string[] {
	if (!collection.images || collection.images.length === 0) {
		return [];
	}

	// Priorizar la imagen destacada si existe
	const featuredImages: string[] = [];

	if (collection.featuredImage) {
		featuredImages.push(collection.featuredImage);
	}

	// Agregar hasta maxImages imágenes de la colección
	const remainingImages = collection.images
		.filter((img) => img.path !== collection.featuredImage)
		.slice(0, maxImages - featuredImages.length);

	return [...featuredImages, ...remainingImages.map((img) => img.path)];
}

/**
 * 🔄 Mapea datos de creación de Collection a formato Prisma
 */
export function mapCreateCollectionDataToPrisma(data: CollectionCreateInput): Prisma.CollectionCreateInput {
  try {
    // Extraer relaciones para manejarlas por separado
    const {
      owner, parent, children, images, videos, albums,
      tags, groups, characters, places, items, notes, sharedWith,
      ...baseData
    } = data;

    // Preparar relaciones para creación
    const createRelations: Prisma.CollectionCreateInput = {};

    // Crear connect para cada relación si existe
    if (owner) {
      createRelations.owner = { connect: { id: owner.id } };
    }

    if (parent) {
      createRelations.parent = { connect: { id: parent.id } };
    }

    if (children?.length) {
      createRelations.children = { connect: children.map(child => ({ id: child.id })) };
    }

    if (images?.length) {
      createRelations.images = { connect: images.map(img => ({ id: img.id })) };
    }

    if (videos?.length) {
      createRelations.videos = { connect: videos.map(video => ({ id: video.id })) };
    }

    if (albums?.length) {
      createRelations.albums = { connect: albums.map(album => ({ id: album.id })) };
    }

    if (tags?.length) {
      createRelations.tags = { connect: tags.map(tag => ({ id: tag.id })) };
    }

    if (groups?.length) {
      createRelations.groups = { connect: groups.map(group => ({ id: group.id })) };
    }

    if (characters?.length) {
      createRelations.characters = { connect: characters.map(char => ({ id: char.id })) };
    }

    if (places?.length) {
      createRelations.places = { connect: places.map(place => ({ id: place.id })) };
    }

    if (items?.length) {
      createRelations.items = { connect: items.map(item => ({ id: item.id })) };
    }

    if (notes?.length) {
      createRelations.notes = { connect: notes.map(note => ({ id: note.id })) };
    }

    if (sharedWith?.length) {
      createRelations.sharedWith = { connect: sharedWith.map(user => ({ id: user.id })) };
    }

    return {
      ...baseData,
      ...createRelations,
    };
  } catch (error) {
    logger.error('Error in mapCreateCollectionDataToPrisma:', error);
    throw error;
  }
}

/**
 * 🔄 Mapea datos de actualización de Collection a formato Prisma
 */
export function mapUpdateCollectionDataToPrisma(data: CollectionUpdateInput): Prisma.CollectionUpdateInput {
  try {
    // Extraer relaciones para manejarlas por separado
    const {
      owner, parent, children, images, videos, albums,
      tags, groups, characters, places, items, notes, sharedWith,
      ...baseData
    } = data;

    // Preparar relaciones para actualización
    const updateRelations: Prisma.CollectionUpdateInput = {};

    // Crear connect/set para cada relación si existe
    if (owner) {
      updateRelations.owner = { connect: { id: owner.id } };
    }

    if (parent) {
      updateRelations.parent = { connect: { id: parent.id } };
    }

    if (children) {
      updateRelations.children = { set: children.map(child => ({ id: child.id })) };
    }

    if (images) {
      updateRelations.images = { set: images.map(img => ({ id: img.id })) };
    }

    if (videos) {
      updateRelations.videos = { set: videos.map(video => ({ id: video.id })) };
    }

    if (albums) {
      updateRelations.albums = { set: albums.map(album => ({ id: album.id })) };
    }

    if (tags) {
      updateRelations.tags = { set: tags.map(tag => ({ id: tag.id })) };
    }

    if (groups) {
      updateRelations.groups = { set: groups.map(group => ({ id: group.id })) };
    }

    if (characters) {
      updateRelations.characters = { set: characters.map(char => ({ id: char.id })) };
    }

    if (places) {
      updateRelations.places = { set: places.map(place => ({ id: place.id })) };
    }

    if (items) {
      updateRelations.items = { set: items.map(item => ({ id: item.id })) };
    }

    if (notes) {
      updateRelations.notes = { set: notes.map(note => ({ id: note.id })) };
    }

    if (sharedWith) {
      updateRelations.sharedWith = { set: sharedWith.map(user => ({ id: user.id })) };
    }

    return {
      ...baseData,
      ...updateRelations,
    };
  } catch (error) {
    logger.error('Error in mapUpdateCollectionDataToPrisma:', error);
    throw error;
  }
}

/**
 * 🔄 Mapea opciones de búsqueda de Collection a formato Prisma
 */
export function mapCollectionSearchOptionsToPrisma(
  options: CollectionSearchOptions
): Prisma.CollectionFindManyArgs {
  try {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE, orderBy, filters = {}, include = {} } = options;

    // Validar y ajustar el tamaño de página
    const take = Math.min(pageSize, MAX_PAGE_SIZE);
    const skip = (page - 1) * take;

    // Mapear ordenamiento
    const defaultOrderBy: Prisma.CollectionOrderByWithRelationInput = {
      createdAt: SortDirection.DESC,
    };

    // Mapear filtros
    const where = mapCollectionFiltersToPrisma(filters);

    // Mapear inclusiones
    const includeOptions: Prisma.CollectionInclude = {};

    if (include) {
      if (include.owner) includeOptions.owner = true;
      if (include.parent) includeOptions.parent = true;
      if (include.children) includeOptions.children = true;
      if (include.images) includeOptions.images = true;
      if (include.videos) includeOptions.videos = true;
      if (include.albums) includeOptions.albums = true;
      if (include.tags) includeOptions.tags = true;
      if (include.groups) includeOptions.groups = true;
      if (include.characters) includeOptions.characters = true;
      if (include.places) includeOptions.places = true;
      if (include.items) includeOptions.items = true;
      if (include.notes) includeOptions.notes = true;
      if (include.sharedWith) includeOptions.sharedWith = true;
      if (include.counts) includeOptions._count = true;
    }

    return {
      where,
      take,
      skip,
      orderBy: orderBy || defaultOrderBy,
      include: Object.keys(includeOptions).length > 0 ? includeOptions : undefined,
    };
  } catch (error) {
    logger.error('Error in mapCollectionSearchOptionsToPrisma:', error);
    throw handleTransformerError(error);
  }
}

/**
 * 🔄 Mapea filtros de Collection a formato Prisma
 */
export function mapCollectionFiltersToPrisma(filters: CollectionFilters): Prisma.CollectionWhereInput {
  try {
    const where: Prisma.CollectionWhereInput = {};

    // Filtro por texto
    if (filters.text) {
      where.OR = [
        { name: { contains: filters.text, mode: 'insensitive' } },
        { description: { contains: filters.text, mode: 'insensitive' } },
      ];
    }

    // Filtro por categoría
    if (filters.category) {
      where.category = filters.category;
    }

    // Filtro por propietario
    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }

    // Filtro por padre
    if (filters.parentId) {
      where.parentId = filters.parentId;
    }

    // Filtro por favorito
    if (filters.favorite !== undefined) {
      where.isFavorite = filters.favorite;
    }

    // Filtro por publicación
    if (filters.public !== undefined) {
      where.isPublic = filters.public;
    }

    // Filtro por fecha
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

    // Filtro por IDs de entidades relacionadas
    if (filters.imageIds && filters.imageIds.length > 0) {
      where.images = {
        some: {
          id: { in: filters.imageIds },
        },
      };
    }

    if (filters.tagIds && filters.tagIds.length > 0) {
      where.tags = {
        some: {
          id: { in: filters.tagIds },
        },
      };
    }

    return where;
  } catch (error) {
    logger.error('Error in mapCollectionFiltersToPrisma:', error);
    throw handleTransformerError(error);
  }
}

/**
 * 🔄 Mapea una Collection a su versión relacionada
 */
export function mapCollectionToRelatedCollection(collection: CollectionComplete): RelatedCollection {
  try {
    return { id: collection.id };
  } catch (error) {
    logger.error('Error in mapCollectionToRelatedCollection:', error);
    throw handleTransformerError(error);
  }
}

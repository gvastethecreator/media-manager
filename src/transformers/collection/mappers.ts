/**
 * @file Funciones de mapeo para la entidad Collection
 * @module transformers/collection/mappers
 */

import { Logger } from '@/lib/logger';
import type { CollectionComplete, CollectionExtended, CollectionSummary } from '@/types/entities/collection';
import {
    COLLECTION_CATEGORY_COLORS,
    COLLECTION_CATEGORY_EMOJIS,
    type CollectionCategory
} from '@/types/entities/collection';
import {
    CollectionCreateInput,
    CollectionFilters,
    CollectionSearchOptions,
    CollectionUpdateInput,
} from '@/types/entities/collection/types';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/utils/transformers/constants';
import { handleTransformerError } from '@/utils/transformers/errors';
import type { Image, Collection as PrismaCollection } from '@prisma/client';
import { Prisma } from '@prisma/client';
import {
    toCollectionComplete,
    toCollectionExtended
} from './serializers';

const logger = new Logger('CollectionMapper');

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
    // Preparar datos base
    const baseData = {
      name: data.name,
      description: data.description,
      type: data.type,
      category: data.category,
      tags: data.tags,
      isPublic: data.isPublic ?? false,
      isFavorite: data.isFavorite ?? false,
      metadata: data.metadata,
      settings: data.settings,
    };

    // Preparar relaciones
    const relations = {
      owner: data.owner ? { connect: { id: data.owner.id } } : undefined,
      parent: data.parent ? { connect: { id: data.parent.id } } : undefined,
      children: data.children?.length ? { connect: data.children.map(child => ({ id: child.id })) } : undefined,
      images: data.images?.length ? { connect: data.images.map(img => ({ id: img.id })) } : undefined,
      videos: data.videos?.length ? { connect: data.videos.map(video => ({ id: video.id })) } : undefined,
      albums: data.albums?.length ? { connect: data.albums.map(album => ({ id: album.id })) } : undefined,
      tags: data.tags?.length ? { connect: data.tags.map(tag => ({ id: tag.id })) } : undefined,
      groups: data.groups?.length ? { connect: data.groups.map(group => ({ id: group.id })) } : undefined,
      characters: data.characters?.length ? { connect: data.characters.map(char => ({ id: char.id })) } : undefined,
      places: data.places?.length ? { connect: data.places.map(place => ({ id: place.id })) } : undefined,
      items: data.items?.length ? { connect: data.items.map(item => ({ id: item.id })) } : undefined,
      notes: data.notes?.length ? { connect: data.notes.map(note => ({ id: note.id })) } : undefined,
      sharedWith: data.sharedWith?.length ? { connect: data.sharedWith.map(user => ({ id: user.id })) } : undefined,
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
 * 🔄 Mapea datos de actualización de Collection a formato Prisma
 */
export function mapUpdateCollectionDataToPrisma(data: CollectionUpdateInput): Prisma.CollectionUpdateInput {
  try {
    // Preparar datos base
    const baseData = {
      name: data.name,
      description: data.description,
      type: data.type,
      category: data.category,
      tags: data.tags,
      isPublic: data.isPublic,
      isFavorite: data.isFavorite,
      metadata: data.metadata,
      settings: data.settings,
      updatedAt: new Date(),
    };

    // Preparar relaciones
    const relations = {
      owner: data.owner ? { connect: { id: data.owner.id } } : undefined,
      parent: data.parent ? { connect: { id: data.parent.id } } : undefined,
      children: data.children?.length ? { set: data.children.map(child => ({ id: child.id })) } : undefined,
      images: data.images?.length ? { set: data.images.map(img => ({ id: img.id })) } : undefined,
      videos: data.videos?.length ? { set: data.videos.map(video => ({ id: video.id })) } : undefined,
      albums: data.albums?.length ? { set: data.albums.map(album => ({ id: album.id })) } : undefined,
      tags: data.tags?.length ? { set: data.tags.map(tag => ({ id: tag.id })) } : undefined,
      groups: data.groups?.length ? { set: data.groups.map(group => ({ id: group.id })) } : undefined,
      characters: data.characters?.length ? { set: data.characters.map(char => ({ id: char.id })) } : undefined,
      places: data.places?.length ? { set: data.places.map(place => ({ id: place.id })) } : undefined,
      items: data.items?.length ? { set: data.items.map(item => ({ id: item.id })) } : undefined,
      notes: data.notes?.length ? { set: data.notes.map(note => ({ id: note.id })) } : undefined,
      sharedWith: data.sharedWith?.length ? { set: data.sharedWith.map(user => ({ id: user.id })) } : undefined,
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
 * 🔄 Mapea opciones de búsqueda de Collection a formato Prisma
 */
export function mapCollectionSearchOptionsToPrisma(
  options: CollectionSearchOptions
): Prisma.CollectionFindManyArgs {
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
    const where = mapCollectionFiltersToPrisma(filters);

    // Mapear inclusiones
    const includeRelations = {
      owner: include.owner ?? false,
      parent: include.parent ?? false,
      children: include.children ?? false,
      images: include.images ?? false,
      videos: include.videos ?? false,
      albums: include.albums ?? false,
      tags: include.tags ?? false,
      groups: include.groups ?? false,
      characters: include.characters ?? false,
      places: include.places ?? false,
      items: include.items ?? false,
      notes: include.notes ?? false,
      sharedWith: include.sharedWith ?? false,
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
 * 🔄 Mapea filtros de Collection a formato Prisma
 */
export function mapCollectionFiltersToPrisma(filters: CollectionFilters): Prisma.CollectionWhereInput {
  try {
    const where: Prisma.CollectionWhereInput = {};

    // Filtros de texto
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Filtros de tipo y categoría
    if (filters.type?.length) {
      where.type = { in: filters.type };
    }
    if (filters.category?.length) {
      where.category = { in: filters.category };
    }
    if (filters.tags?.length) {
      where.tags = { some: { name: { in: filters.tags } } };
    }

    // Filtros de estado
    if (filters.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }
    if (filters.isFavorite !== undefined) {
      where.isFavorite = filters.isFavorite;
    }

    // Filtros de relaciones
    if (filters.hasParent) {
      where.parent = { isNot: null };
    }
    if (filters.hasChildren) {
      where.children = { some: {} };
    }
    if (filters.hasImages) {
      where.images = { some: {} };
    }
    if (filters.hasVideos) {
      where.videos = { some: {} };
    }
    if (filters.hasAlbums) {
      where.albums = { some: {} };
    }
    if (filters.isShared) {
      where.sharedWith = { some: {} };
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
 * 🔄 Mapea una Collection a su versión relacionada
 */
export function mapCollectionToRelatedCollection(collection: CollectionComplete): { id: string } {
  try {
    return { id: collection.id };
  } catch (error) {
    throw handleTransformerError(error);
  }
}

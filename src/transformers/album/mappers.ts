/**
 * @file Funciones de mapeo para la entidad Album
 * @module transformers/album/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
	AlbumComplete,
	AlbumCreateInput,
	AlbumFilters,
	AlbumSearchOptions,
	AlbumUpdateInput,
	RelatedAlbum,
} from '@/types/entities/album/types';
import { handleTransformerError } from '@/utils/transformers/errors';
import type { Prisma } from '@prisma/client';

// Definir constantes localmente en lugar de importarlas
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// Enum para reemplazar SortOrder de Prisma
enum SortDirection {
	asc = 'asc',
	desc = 'desc',
}

const logger = serverLogger.withContext('AlbumMapper');

/**
 * 🔄 Mapea datos de creación de Album a formato Prisma
 */
export function mapCreateAlbumDataToPrisma(data: AlbumCreateInput): Prisma.AlbumCreateInput {
	try {
		// Preparar datos base - omitiendo propiedades que no existen en Prisma
		const {
			name,
			emoji = '📁',
			color = '#3b82f6',
			description,
			shortcut,
			category = 'general',
			sortBy = 'name',
			filters = '{}',
			featuredImage,
			isFavorite = false,
			...restData
		} = data;

		// Datos base sin campos que no existen en Prisma
		const baseData = {
			name,
			emoji,
			color,
			description,
			shortcut,
			category,
			sortBy,
			filters,
			featuredImage,
			isFavorite,
		};

		// Crear objeto para relaciones
		const relations: Record<string, any> = {};

		if (data.images?.length) {
			relations.images = { connect: data.images.map((img) => ({ id: img.id })) };
		}

		if (data.videos?.length) {
			relations.videos = { connect: data.videos.map((vid) => ({ id: vid.id })) };
		}

		if (data.collections?.length) {
			relations.collections = { connect: data.collections.map((col) => ({ id: col.id })) };
		}

		if (data.tags?.length) {
			relations.tags = { connect: data.tags.map((tag) => ({ id: tag.id })) };
		}

		if (data.characters?.length) {
			relations.characters = { connect: data.characters.map((char) => ({ id: char.id })) };
		}

		if (data.places?.length) {
			relations.places = { connect: data.places.map((place) => ({ id: place.id })) };
		}

		if (data.worldItems?.length) {
			relations.worldItems = { connect: data.worldItems.map((item) => ({ id: item.id })) };
		}

		if (data.concepts?.length) {
			relations.concepts = { connect: data.concepts.map((con) => ({ id: con.id })) };
		}

		if (data.prompts?.length) {
			relations.prompts = { connect: data.prompts.map((prompt) => ({ id: prompt.id })) };
		}

		if (data.notes?.length) {
			relations.notes = { connect: data.notes.map((note) => ({ id: note.id })) };
		}

		if (data.wildcards?.length) {
			relations.wildcards = { connect: data.wildcards.map((wild) => ({ id: wild.id })) };
		}

		if (data.properties?.length) {
			relations.properties = { connect: data.properties.map((prop) => ({ id: prop.id })) };
		}

		if (data.groups?.length) {
			relations.groups = { connect: data.groups.map((group) => ({ id: group.id })) };
		}

		return {
			...baseData,
			...relations,
		} as Prisma.AlbumCreateInput;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Mapea datos de actualización de Album a formato Prisma
 */
export function mapUpdateAlbumDataToPrisma(data: AlbumUpdateInput): Prisma.AlbumUpdateInput {
	try {
		// Extraer solo los campos que existen en Prisma
		const {
			name,
			emoji,
			color,
			description,
			shortcut,
			category,
			sortBy,
			filters,
			featuredImage,
			isFavorite,
			...restData
		} = data;

		// Datos base sin campos que no existen en Prisma
		const baseData: Record<string, any> = {};

		if (name !== undefined) baseData.name = name;
		if (emoji !== undefined) baseData.emoji = emoji;
		if (color !== undefined) baseData.color = color;
		if (description !== undefined) baseData.description = description;
		if (shortcut !== undefined) baseData.shortcut = shortcut;
		if (category !== undefined) baseData.category = category;
		if (sortBy !== undefined) baseData.sortBy = sortBy;
		if (filters !== undefined) baseData.filters = filters;
		if (featuredImage !== undefined) baseData.featuredImage = featuredImage;
		if (isFavorite !== undefined) baseData.isFavorite = isFavorite;

		// Siempre actualizar la fecha
		baseData.updatedAt = new Date();

		// Crear objeto para relaciones
		const relations: Record<string, any> = {};

		if (data.images?.length) {
			relations.images = { set: data.images.map((img) => ({ id: img.id })) };
		}

		if (data.videos?.length) {
			relations.videos = { set: data.videos.map((vid) => ({ id: vid.id })) };
		}

		if (data.collections?.length) {
			relations.collections = { set: data.collections.map((col) => ({ id: col.id })) };
		}

		if (data.tags?.length) {
			relations.tags = { set: data.tags.map((tag) => ({ id: tag.id })) };
		}

		if (data.characters?.length) {
			relations.characters = { set: data.characters.map((char) => ({ id: char.id })) };
		}

		if (data.places?.length) {
			relations.places = { set: data.places.map((place) => ({ id: place.id })) };
		}

		if (data.worldItems?.length) {
			relations.worldItems = { set: data.worldItems.map((item) => ({ id: item.id })) };
		}

		if (data.concepts?.length) {
			relations.concepts = { set: data.concepts.map((con) => ({ id: con.id })) };
		}

		if (data.prompts?.length) {
			relations.prompts = { set: data.prompts.map((prompt) => ({ id: prompt.id })) };
		}

		if (data.notes?.length) {
			relations.notes = { set: data.notes.map((note) => ({ id: note.id })) };
		}

		if (data.wildcards?.length) {
			relations.wildcards = { set: data.wildcards.map((wild) => ({ id: wild.id })) };
		}

		if (data.properties?.length) {
			relations.properties = { set: data.properties.map((prop) => ({ id: prop.id })) };
		}

		if (data.groups?.length) {
			relations.groups = { set: data.groups.map((group) => ({ id: group.id })) };
		}

		return {
			...baseData,
			...relations,
		} as Prisma.AlbumUpdateInput;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Mapea opciones de búsqueda de Album a formato Prisma
 */
export function mapAlbumSearchOptionsToPrisma(options: AlbumSearchOptions): Prisma.AlbumFindManyArgs {
	try {
		const { skip = 0, take = DEFAULT_PAGE_SIZE, orderBy, where = {}, include = {} } = options;

		// Validar y ajustar el tamaño de página
		const validatedPageSize = Math.min(take, MAX_PAGE_SIZE);

		// Mapear ordenamiento usando strings en lugar de enums
		const orderByField = orderBy ? orderBy.field : 'createdAt';
		const orderByDirection = orderBy ? orderBy.direction : 'desc';

		const orderByMapped = { [orderByField]: orderByDirection };

		// Mapear filtros
		const whereMapped = mapAlbumFiltersToPrisma(where);

		// Mapear inclusiones
		const includeRelations = {
			images: include.images ?? false,
			videos: include.videos ?? false,
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
			_count: true,
		};

		return {
			skip,
			take: validatedPageSize,
			orderBy: orderByMapped as any, // Usamos any para evitar problemas de tipo
			where: whereMapped,
			include: includeRelations,
		};
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Mapea filtros de Album a formato Prisma
 */
export function mapAlbumFiltersToPrisma(filters: AlbumFilters): Prisma.AlbumWhereInput {
	try {
		const where: Record<string, any> = {};

		// Filtros de texto
		if (filters.search) {
			where.OR = [{ name: { contains: filters.search } }, { description: { contains: filters.search } }];
		}

		// Filtros de categoría
		if (filters.categories?.length) {
			where.category = { in: filters.categories };
		}

		// Filtros de estado
		if (filters.isFavorite !== undefined) {
			where.isFavorite = filters.isFavorite;
		}

		// Filtros de relaciones
		if (filters.hasImages) {
			where.images = { some: {} };
		}
		if (filters.hasVideos) {
			where.videos = { some: {} };
		}
		if (filters.hasCollections) {
			where.collections = { some: {} };
		}

		// Filtros de fecha
		if (filters.dateRange?.start) {
			where.createdAt = filters.dateRange.end
				? { gte: filters.dateRange.start, lte: filters.dateRange.end }
				: { gte: filters.dateRange.start };
		} else if (filters.dateRange?.end) {
			where.createdAt = { lte: filters.dateRange.end };
		}

		return where as Prisma.AlbumWhereInput;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Mapea un Album a su versión relacionada
 */
export function mapAlbumToRelatedAlbum(album: AlbumComplete): RelatedAlbum {
	try {
		return {
			id: album.id,
			name: album.name || '',
			emoji: album.emoji || '📁',
			color: album.color || '#3b82f6',
			count: album._count?.images || 0,
		};
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * @file Funciones de mapeo para la entidad Tag
 * @module transformers/tag/mappers
 */

import { Logger } from '@/lib/logger';
import { serverLogger } from '@/lib/logger/server-logger';
import type { TagCreateInput, TagFilters, TagSearchOptions, TagUpdateInput } from '@/types/entities/tag/types';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/utils/transformers/constants';
import { handleTransformerError } from '@/utils/transformers/errors';
import type { Prisma } from '@prisma/client';
import type { TagBase, TagComplete } from '../../types/entities/tag/index';
import { fromTagComplete } from './serializers';

const logger = new Logger('TagMapper');

// Logger específico para mappers de Tag
const mapperLogger = serverLogger.withContext('TagMappers');

/**
 * Convierte un TagBase de Prisma a un objeto TagComplete
 * @param tag Objeto TagBase de Prisma
 * @returns Objeto TagBase (actualmente sin transformación)
 */
export function transformTagToPrisma(tag: TagBase): TagBase {
	try {
		return tag; // Actualmente no hay campos que requieran transformación
	} catch (error) {
		mapperLogger.error('❌ Error al transformar Tag a formato Prisma:', error);
		return tag;
	}
}

/**
 * Convierte un TagComplete a formato Prisma
 * @param tag Objeto TagComplete
 * @returns Objeto en formato para Prisma
 */
export function transformCompleteTagToPrisma(tag: TagComplete): TagBase {
	try {
		return fromTagComplete(tag);
	} catch (error) {
		mapperLogger.error('❌ Error al transformar TagComplete a formato Prisma:', error);
		return tag as TagBase;
	}
}

/**
 * 🔄 Mapea datos de creación de Tag a formato Prisma
 */
export function mapCreateTagDataToPrisma(data: TagCreateInput): Prisma.TagCreateInput {
	try {
		// Preparar datos base
		const baseData = {
			name: data.name,
			emoji: data.emoji || '🏷️',
			color: data.color || '#3b82f6',
			description: data.description,
			shortcut: data.shortcut,
			category: data.category || 'general',
			featuredImage: data.featuredImage,
			isFavorite: data.isFavorite || false,
		};

		// Preparar relaciones
		const relations = {
			images: data.images?.length ? { connect: data.images.map((img) => ({ id: img.id })) } : undefined,
			videos: data.videos?.length ? { connect: data.videos.map((vid) => ({ id: vid.id })) } : undefined,
			albums: data.albums?.length ? { connect: data.albums.map((alb) => ({ id: alb.id })) } : undefined,
			collections: data.collections?.length ? { connect: data.collections.map((col) => ({ id: col.id })) } : undefined,
			characters: data.characters?.length ? { connect: data.characters.map((char) => ({ id: char.id })) } : undefined,
			places: data.places?.length ? { connect: data.places.map((place) => ({ id: place.id })) } : undefined,
			worldItems: data.worldItems?.length ? { connect: data.worldItems.map((item) => ({ id: item.id })) } : undefined,
			concepts: data.concepts?.length ? { connect: data.concepts.map((con) => ({ id: con.id })) } : undefined,
			prompts: data.prompts?.length ? { connect: data.prompts.map((prompt) => ({ id: prompt.id })) } : undefined,
			notes: data.notes?.length ? { connect: data.notes.map((note) => ({ id: note.id })) } : undefined,
			wildcards: data.wildcards?.length ? { connect: data.wildcards.map((wild) => ({ id: wild.id })) } : undefined,
			properties: data.properties?.length ? { connect: data.properties.map((prop) => ({ id: prop.id })) } : undefined,
			groups: data.groups?.length ? { connect: data.groups.map((group) => ({ id: group.id })) } : undefined,
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
 * 🔄 Mapea datos de actualización de Tag a formato Prisma
 */
export function mapUpdateTagDataToPrisma(data: TagUpdateInput): Prisma.TagUpdateInput {
	try {
		// Preparar datos base
		const baseData = {
			name: data.name,
			emoji: data.emoji,
			color: data.color,
			description: data.description,
			shortcut: data.shortcut,
			category: data.category,
			featuredImage: data.featuredImage,
			isFavorite: data.isFavorite,
			updatedAt: new Date(),
		};

		// Preparar relaciones
		const relations = {
			images: data.images?.length ? { set: data.images.map((img) => ({ id: img.id })) } : undefined,
			videos: data.videos?.length ? { set: data.videos.map((vid) => ({ id: vid.id })) } : undefined,
			albums: data.albums?.length ? { set: data.albums.map((alb) => ({ id: alb.id })) } : undefined,
			collections: data.collections?.length ? { set: data.collections.map((col) => ({ id: col.id })) } : undefined,
			characters: data.characters?.length ? { set: data.characters.map((char) => ({ id: char.id })) } : undefined,
			places: data.places?.length ? { set: data.places.map((place) => ({ id: place.id })) } : undefined,
			worldItems: data.worldItems?.length ? { set: data.worldItems.map((item) => ({ id: item.id })) } : undefined,
			concepts: data.concepts?.length ? { set: data.concepts.map((con) => ({ id: con.id })) } : undefined,
			prompts: data.prompts?.length ? { set: data.prompts.map((prompt) => ({ id: prompt.id })) } : undefined,
			notes: data.notes?.length ? { set: data.notes.map((note) => ({ id: note.id })) } : undefined,
			wildcards: data.wildcards?.length ? { set: data.wildcards.map((wild) => ({ id: wild.id })) } : undefined,
			properties: data.properties?.length ? { set: data.properties.map((prop) => ({ id: prop.id })) } : undefined,
			groups: data.groups?.length ? { set: data.groups.map((group) => ({ id: group.id })) } : undefined,
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
 * 🔄 Mapea opciones de búsqueda de Tag a formato Prisma
 */
export function mapTagSearchOptionsToPrisma(options: TagSearchOptions): Prisma.TagFindManyArgs {
	try {
		const { skip = 0, take = DEFAULT_PAGE_SIZE, orderBy, filters = {}, include = {} } = options;

		// Validar y ajustar el tamaño de página
		const validatedPageSize = Math.min(take, MAX_PAGE_SIZE);

		// Mapear ordenamiento
		const orderByMapped = orderBy
			? {
					[orderBy.field]: orderBy.direction,
				}
			: { createdAt: 'desc' };

		// Mapear filtros
		const where = mapTagFiltersToPrisma(filters);

		// Mapear inclusiones
		const includeRelations = {
			images: include.images ?? false,
			videos: include.videos ?? false,
			albums: include.albums ?? false,
			collections: include.collections ?? false,
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
			orderBy: orderByMapped,
			where,
			include: includeRelations,
		};
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Mapea filtros de Tag a formato Prisma
 */
export function mapTagFiltersToPrisma(filters: TagFilters): Prisma.TagWhereInput {
	try {
		const where: Prisma.TagWhereInput = {};

		// Filtros de texto
		if (filters.search) {
			where.OR = [
				{ name: { contains: filters.search, mode: 'insensitive' } },
				{ description: { contains: filters.search, mode: 'insensitive' } },
			];
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
		if (filters.hasAlbums) {
			where.albums = { some: {} };
		}
		if (filters.hasCollections) {
			where.collections = { some: {} };
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
 * 🔄 Mapea un Tag a su versión relacionada
 */
export function mapTagToRelatedTag(tag: TagComplete): { id: string } {
	try {
		return { id: tag.id };
	} catch (error) {
		throw handleTransformerError(error);
	}
}

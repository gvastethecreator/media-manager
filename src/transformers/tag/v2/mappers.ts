/**
 * @file Funciones de mapeo para la entidad Tag (v2)
 * @module transformers/tag/v2/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
	TagBase,
	TagComplete,
	TagCreateInput,
	TagFilters,
	TagSearchOptions,
	TagSearchResult,
	TagUpdateInput,
} from '@/types/entities/tag/types';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/utils/transformers/constants';
import { TransformerError } from '@/utils/transformers/errors';
import type { Prisma } from '@prisma/client';
import { fromPrismaTag } from './serializers';

// Logger específico para este módulo
const logger = serverLogger.withContext('TagTransformer:Mappers');

/**
 * Convierte datos de creación de Tag a formato compatible con Prisma
 * @param data Datos de creación de tag
 * @returns Objeto formateado para Prisma
 */
export function toCreateTagData(data: TagCreateInput): Prisma.TagCreateInput {
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
			favorite: data.isFavorite || false, // Corregido: isFavorite a favorite
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
		logger.error('Error mapeando datos de creación de Tag', { error });
		throw new TransformerError('Error mapeando datos de creación');
	}
}

/**
 * Convierte datos de actualización de Tag a formato compatible con Prisma
 * @param data Datos de actualización de tag
 * @returns Objeto formateado para Prisma
 */
export function toUpdateTagData(data: TagUpdateInput): Prisma.TagUpdateInput {
	try {
		// Preparar datos base
		const baseData: Prisma.TagUpdateInput = {};

		// Solo incluir campos definidos
		if (data.name !== undefined) baseData.name = data.name;
		if (data.emoji !== undefined) baseData.emoji = data.emoji;
		if (data.color !== undefined) baseData.color = data.color;
		if (data.description !== undefined) baseData.description = data.description;
		if (data.shortcut !== undefined) baseData.shortcut = data.shortcut;
		if (data.category !== undefined) baseData.category = data.category;
		if (data.featuredImage !== undefined) baseData.featuredImage = data.featuredImage;
		if (data.isFavorite !== undefined) baseData.favorite = data.isFavorite; // Corregido: isFavorite a favorite

		// Preparar relaciones si se proporcionan
		const relations: Record<string, any> = {};

		if (data.images) relations.images = { set: data.images.map((img) => ({ id: img.id })) };
		if (data.videos) relations.videos = { set: data.videos.map((vid) => ({ id: vid.id })) };
		if (data.albums) relations.albums = { set: data.albums.map((alb) => ({ id: alb.id })) };
		if (data.collections) relations.collections = { set: data.collections.map((col) => ({ id: col.id })) };
		if (data.characters) relations.characters = { set: data.characters.map((char) => ({ id: char.id })) };
		if (data.places) relations.places = { set: data.places.map((place) => ({ id: place.id })) };
		if (data.worldItems) relations.worldItems = { set: data.worldItems.map((item) => ({ id: item.id })) };
		if (data.concepts) relations.concepts = { set: data.concepts.map((con) => ({ id: con.id })) };
		if (data.prompts) relations.prompts = { set: data.prompts.map((prompt) => ({ id: prompt.id })) };
		if (data.notes) relations.notes = { set: data.notes.map((note) => ({ id: note.id })) };
		if (data.wildcards) relations.wildcards = { set: data.wildcards.map((wild) => ({ id: wild.id })) };
		if (data.properties) relations.properties = { set: data.properties.map((prop) => ({ id: prop.id })) };
		if (data.groups) relations.groups = { set: data.groups.map((group) => ({ id: group.id })) };

		return {
			...baseData,
			...relations,
		};
	} catch (error) {
		logger.error('Error mapeando datos de actualización de Tag', { error });
		throw new TransformerError('Error mapeando datos de actualización');
	}
}

/**
 * Mapea opciones de búsqueda de Tag a formato compatible con Prisma
 * @param options Opciones de búsqueda
 * @returns Objeto de opciones para Prisma
 */
export function toSearchOptions(options: TagSearchOptions): Prisma.TagFindManyArgs {
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
		const where = toSearchFilters(filters);

		// Mapear inclusiones
		const includeRelations: Record<string, boolean> = {
			_count: true,
		};

		// Incluir solo las relaciones solicitadas
		if (include.images) includeRelations.images = true;
		if (include.videos) includeRelations.videos = true;
		if (include.albums) includeRelations.albums = true;
		if (include.collections) includeRelations.collections = true;
		if (include.characters) includeRelations.characters = true;
		if (include.places) includeRelations.places = true;
		if (include.worldItems) includeRelations.worldItems = true;
		if (include.concepts) includeRelations.concepts = true;
		if (include.prompts) includeRelations.prompts = true;
		if (include.notes) includeRelations.notes = true;
		if (include.wildcards) includeRelations.wildcards = true;
		if (include.properties) includeRelations.properties = true;
		if (include.groups) includeRelations.groups = true;

		return {
			skip,
			take: validatedPageSize,
			orderBy: orderByMapped,
			where,
			include: includeRelations,
		};
	} catch (error) {
		logger.error('Error mapeando opciones de búsqueda de Tag', { error });
		throw new TransformerError('Error mapeando opciones de búsqueda');
	}
}

/**
 * Mapea filtros de Tag a formato compatible con Prisma
 * @param filters Filtros para Tags
 * @returns Objeto de condiciones para Prisma
 */
export function toSearchFilters(filters: TagFilters): Prisma.TagWhereInput {
	try {
		const where: Prisma.TagWhereInput = {};

		// Filtros de texto
		if (filters.search) {
			where.OR = [
				{ name: { contains: filters.search, mode: 'insensitive' } },
				{ description: { contains: filters.search, mode: 'insensitive' } },
			];
		}

		// Filtrar por categorías
		if (filters.categories?.length) {
			where.category = { in: filters.categories };
		}

		// Filtrar favoritos
		if (filters.onlyFavorites) {
			where.favorite = true; // Corregido: isFavorite a favorite
		}

		// Filtrar por IDs específicos
		if (filters.ids?.length) {
			where.id = { in: filters.ids };
		}

		return where;
	} catch (error) {
		logger.error('Error mapeando filtros de Tag', { error });
		throw new TransformerError('Error mapeando filtros');
	}
}

/**
 * Mapea resultados de búsqueda de Tags a formato de respuesta
 * @param tags Tags encontrados
 * @param total Total de tags sin paginar
 * @param options Opciones de búsqueda utilizadas
 * @returns Resultado de búsqueda formateado
 */
export function toSearchResult(tags: TagBase[], total: number, options: TagSearchOptions = {}): TagSearchResult {
	try {
		const { skip = 0, take = DEFAULT_PAGE_SIZE } = options;

		// Deserializar resultados
		const items = tags.map((tag) =>
			fromPrismaTag(tag, {
				includeUI: true,
				includeStats: true,
				includeRelations: true,
			})
		);

		return {
			items: items as TagComplete[],
			total,
			page: Math.floor(skip / take) + 1,
			pageSize: take,
			totalPages: Math.ceil(total / take),
			hasMore: total > skip + items.length,
		};
	} catch (error) {
		logger.error('Error generando resultado de búsqueda', { error });
		throw new TransformerError('Error generando resultado de búsqueda');
	}
}

/**
 * Convierte un tag a formato simplificado para relaciones
 * @param tag Tag con posibles conteos
 * @returns Tag formateado para relaciones
 * @deprecated Usar toRelatedTag de ./serializers.ts para evitar duplicación
 */
// export function toRelatedTag(tag: TagBase & { _count?: any }): {
// 	id: string;
// 	name: string;
// 	color: string;
// 	emoji: string;
// 	itemCount: number;
// } {
// 	const itemCount = tag._count
// 		? Object.values(tag._count).reduce((acc: number, count: any) => acc + (count as number), 0)
// 		: 0;

// 	return {
// 		id: tag.id,
// 		name: tag.name,
// 		color: tag.color,
// 		emoji: tag.emoji,
// 		itemCount,
// 	};
// }

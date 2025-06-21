/**
 * @file Funciones de mapeo para la entidad Group
 * @module transformers/group/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
    CreateGroupData,
    GroupBase,
    GroupComplete,
    GroupCounts,
    GroupFilters,
    GroupSortCriteria,
    GroupWithStats,
    UpdateGroupData,
} from '@/types/entities/group';
import type { Prisma } from '@prisma/client';
import { serializeGroupTags } from './serializers';

const logger = serverLogger.withContext('GroupMappers');

/**
 * 🔄 Mapea datos de creación de Group a formato Prisma
 * @param data Datos de creación
 * @returns Objeto compatible con Prisma.GroupCreateInput
 */
export function mapCreateGroupDataToPrisma(data: CreateGroupData): Prisma.GroupCreateInput {
	try {
		return {
			name: data.name,
			emoji: data.emoji || '📁',
			color: data.color || '#3B82F6',
			description: data.description || null,
			shortcut: data.shortcut || null,
			category: data.category || null,
			sortBy: data.sortBy || 'name:asc',
			filters: data.filters || '{}',
			tags: serializeGroupTags(data.tags?.map((t) => t.id) || []),
			featuredImage: data.featuredImage || null,
			isFavorite: data.isFavorite || false,
			images: data.images ? { connect: data.images } : undefined,
			videos: data.videos ? { connect: data.videos } : undefined,
			albums: data.albums ? { connect: data.albums } : undefined,
			collections: data.collections ? { connect: data.collections } : undefined,
			tagEntities: data.tags ? { connect: data.tags.map((t) => ({ id: t.id })) } : undefined,
			characters: data.characters ? { connect: data.characters } : undefined,
			places: data.places ? { connect: data.places } : undefined,
			worldItems: data.worldItems ? { connect: data.worldItems } : undefined,
			concepts: data.concepts ? { connect: data.concepts } : undefined,
			prompts: data.prompts ? { connect: data.prompts } : undefined,
			notes: data.notes ? { connect: data.notes } : undefined,
			wildcards: data.wildcards ? { connect: data.wildcards } : undefined,
			properties: data.properties ? { connect: data.properties } : undefined,
		};
	} catch (error) {
		logger.error('Error mapeando datos de creación de grupo:', error);
		throw new Error(
			`Error al mapear datos de creación de grupo: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * 🔄 Mapea datos de actualización de Group a formato Prisma
 * @param id ID del grupo a actualizar
 * @param data Datos de actualización
 * @returns Objeto compatible con Prisma.GroupUpdateArgs
 */
export function mapUpdateGroupDataToPrisma(id: string, data: UpdateGroupData): Prisma.GroupUpdateArgs {
	try {
		const updateData: Prisma.GroupUpdateInput = {
			name: data.name,
			emoji: data.emoji,
			color: data.color,
			description: data.description,
			shortcut: data.shortcut,
			category: data.category,
			sortBy: data.sortBy,
			filters: data.filters,
			tags: data.tags ? serializeGroupTags(data.tags.map((t) => t.id)) : undefined,
			featuredImage: data.featuredImage,
			isFavorite: data.isFavorite,
			images: data.images ? { set: data.images } : undefined,
			videos: data.videos ? { set: data.videos } : undefined,
			albums: data.albums ? { set: data.albums } : undefined,
			collections: data.collections ? { set: data.collections } : undefined,
			tagEntities: data.tags ? { set: data.tags.map((t) => ({ id: t.id })) } : undefined,
			characters: data.characters ? { set: data.characters } : undefined,
			places: data.places ? { set: data.places } : undefined,
			worldItems: data.worldItems ? { set: data.worldItems } : undefined,
			concepts: data.concepts ? { set: data.concepts } : undefined,
			prompts: data.prompts ? { set: data.prompts } : undefined,
			notes: data.notes ? { set: data.notes } : undefined,
			wildcards: data.wildcards ? { set: data.wildcards } : undefined,
			properties: data.properties ? { set: data.properties } : undefined,
		};

		return {
			where: { id },
			data: updateData,
		};
	} catch (error) {
		logger.error('Error mapeando datos de actualización de grupo:', error);
		throw new Error(
			`Error al mapear datos de actualización de grupo: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * 🔄 Mapea filtros de Group a condiciones where de Prisma
 * @param filters Filtros para consultar grupos
 * @returns Objeto compatible con Prisma.GroupWhereInput
 */
export function mapGroupFiltersToPrisma(filters: GroupFilters = {}): Prisma.GroupWhereInput {
	const where: Prisma.GroupWhereInput = {};

	// Búsqueda por texto
	if (filters.searchQuery) {
		where.OR = [
			{ name: { contains: filters.searchQuery, mode: 'insensitive' } },
			{ description: { contains: filters.searchQuery, mode: 'insensitive' } },
		];
	}

	// Filtrar por favoritos
	if (filters.onlyFavorites) {
		where.isFavorite = true;
	}

	return where;
}

/**
 * 🔄 Mapea criterios de ordenación a formato Prisma
 * @param sortBy Criterio de ordenación
 * @returns Objeto compatible con Prisma.GroupOrderByWithRelationInput
 */
export function mapGroupSortCriteriaToPrisma(
	sortBy: GroupSortCriteria = GroupSortCriteria.UPDATED_DESC
): Prisma.GroupOrderByWithRelationInput {
	const [field, direction] = sortBy.split(':');
	const sortDir = direction === 'asc' ? 'asc' : 'desc';

	// Mapear campo a propiedad de Prisma
	switch (field) {
		case 'name':
			return { name: sortDir };
		case 'created':
			return { createdAt: sortDir };
		case 'updated':
		default:
			return { updatedAt: sortDir };
	}
}

/**
 * 🔄 Mapea un Group a formato simplificado para relaciones
 * @param group Grupo completo
 * @returns Grupo simplificado para relaciones
 */
export function mapGroupToRelated(group: GroupComplete): { id: string; name: string; emoji: string; color: string } {
	return {
		id: group.id,
		name: group.name,
		emoji: group.emoji,
		color: group.color,
	};
}

/**
 * 🔄 Mapea un array de Groups a formato simplificado para relaciones
 * @param groups Array de grupos
 * @returns Array de grupos simplificados
 */
export function mapGroupsToRelated(
	groups: Array<GroupComplete>
): Array<{ id: string; name: string; emoji: string; color: string }> {
	return groups.map(mapGroupToRelated);
}

/**
 * 🔍 Filtra un array de grupos según los criterios especificados
 * @param groups Array de grupos a filtrar
 * @param filters Filtros a aplicar
 * @returns Array de grupos filtrados
 */
export function filterGroups(groups: GroupBase[], filters: GroupFilters = {}): GroupBase[] {
	let filtered = [...groups];

	// Filtrar por búsqueda de texto
	if (filters.searchQuery) {
		const query = filters.searchQuery.toLowerCase();
		filtered = filtered.filter(
			(group) => group.name.toLowerCase().includes(query) || group.description?.toLowerCase().includes(query)
		);
	}

	// Filtrar por favoritos
	if (filters.onlyFavorites) {
		filtered = filtered.filter((group) => group.isFavorite);
	}

	return filtered;
}

/**
 * 📄 Pagina un array de grupos
 * @param groups Array de grupos a paginar
 * @param page Número de página (empezando en 1)
 * @param limit Número de elementos por página
 * @returns Objeto con grupos paginados y metadatos
 */
export function paginateGroups(
	groups: GroupBase[],
	page = 1,
	limit = 20
): {
	data: GroupBase[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
} {
	const total = groups.length;
	const totalPages = Math.ceil(total / limit);
	const startIndex = (page - 1) * limit;
	const endIndex = startIndex + limit;
	const data = groups.slice(startIndex, endIndex);

	return {
		data,
		pagination: {
			page,
			limit,
			total,
			totalPages,
			hasNext: page < totalPages,
			hasPrev: page > 1,
		},
	};
}

/**
 * 🔄 Ordena un array de grupos según el criterio especificado
 * @param groups Array de grupos a ordenar
 * @param sortBy Criterio de ordenación
 * @returns Array de grupos ordenados
 */
export function sortGroups(
	groups: GroupBase[],
	sortBy: GroupSortCriteria = GroupSortCriteria.UPDATED_DESC
): GroupBase[] {
	const [field, direction] = sortBy.split(':');
	const isAsc = direction === 'asc';

	return [...groups].sort((a, b) => {
		let valueA: any;
		let valueB: any;

		switch (field) {
			case 'name':
				valueA = a.name.toLowerCase();
				valueB = b.name.toLowerCase();
				break;
			case 'created':
				valueA = new Date(a.createdAt).getTime();
				valueB = new Date(b.createdAt).getTime();
				break;
			case 'updated':
			default:
				valueA = new Date(a.updatedAt).getTime();
				valueB = new Date(b.updatedAt).getTime();
				break;
		}

		if (valueA < valueB) return isAsc ? -1 : 1;
		if (valueA > valueB) return isAsc ? 1 : -1;
		return 0;
	});
}

/**
 * 🔄 Procesa un array de grupos aplicando filtros, ordenación y paginación
 * @param groups Array de grupos a procesar
 * @param options Opciones de procesamiento
 * @returns Grupos procesados con metadatos
 */
export function processGroups(
	groups: GroupBase[],
	options: {
		filters?: GroupFilters;
		sortBy?: GroupSortCriteria;
		page?: number;
		limit?: number;
	} = {}
): {
	data: GroupBase[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
} {
	let processed = [...groups];

	// Aplicar filtros
	if (options.filters) {
		processed = filterGroups(processed, options.filters);
	}

	// Aplicar ordenación
	if (options.sortBy) {
		processed = sortGroups(processed, options.sortBy);
	}

	// Aplicar paginación
	return paginateGroups(processed, options.page, options.limit);
}

/**
 * 📊 Convierte un grupo base a un grupo con estadísticas
 * @param group Grupo base
 * @param stats Estadísticas opcionales
 * @returns Grupo con estadísticas
 */
export function toGroupWithStats(group: GroupBase, stats?: Partial<GroupCounts['_count']>): GroupWithStats {
	const defaultStats: GroupCounts['_count'] = {
		images: 0,
		videos: 0,
		albums: 0,
		collections: 0,
		tags: 0,
		characters: 0,
		places: 0,
		worldItems: 0,
		concepts: 0,
		prompts: 0,
		notes: 0,
		wildcards: 0,
		properties: 0,
		...stats,
	};

	return {
		...group,
		_count: defaultStats,
	} as GroupWithStats;
}

/**
 * 📝 Convierte un GroupComplete (o base) en un item de lista ligero para UI.
 * Solo devuelve id, name, emoji y color.
 */
export function toGroupListItem(group: { id: string; name: string; emoji?: string | null; color?: string | null }) {
	return {
		id: group.id,
		name: group.name,
		emoji: group.emoji ?? '📁',
		color: group.color ?? '#3B82F6',
	};
}

/**
 * 📝 Convierte un array de grupos en lista ligera.
 */
export function toGroupListItems(groups: Array<{ id: string; name: string; emoji?: string | null; color?: string | null }>) {
	return groups.map(toGroupListItem);
}

/**
 * @file Servicio de búsqueda de grupos
 * @module services/group/group-search
 * @description Búsqueda avanzada de grupos con filtros, paginación y ordenamiento
 */
// @ts-nocheck - Temporary suppression for implicit any parameter types

import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { groupAlbums, groupImages, groups, groupTags, groupVideos } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import type { GroupSearchResult, GroupWithStats } from '@/types/entities/group/types';
import { createGroupError, GroupErrorCode } from './group-errors';

const logger = serverLogger.withContext('GroupService');

/**
 * Opciones de búsqueda y paginación
 */
export interface SearchGroupsOptions {
	page?: number;
	pageSize?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	includeInactive?: boolean;
}

/**
 * Filtros de búsqueda
 */
export interface GroupFilters {
	search?: string;
	isFavorite?: boolean;
	category?: string;
}

/**
 * Busca grupos con filtros avanzados, paginación y ordenamiento
 *
 * @param filters - Filtros de búsqueda (texto, favoritos, categoría)
 * @param options - Opciones de paginación y ordenamiento
 * @returns Resultado paginado con grupos y estadísticas
 */
export const searchGroupsService = async (
	filters: Record<string, any> = {},
	options: SearchGroupsOptions = {}
): Promise<GroupSearchResult> => {
	try {
		logger.info('🔍 Buscando grupos con filtros');

		// Configurar paginación
		const page = options.page || 1;
		const pageSize = options.pageSize || 20;
		const offset = (page - 1) * pageSize;

		// Construir condiciones WHERE
		const conditions = [];

		if (filters.search) {
			conditions.push(or(like(groups.name, `%${filters.search}%`), like(groups.description, `%${filters.search}%`)));
		}

		if (filters.isFavorite !== undefined) {
			conditions.push(eq(groups.isFavorite, filters.isFavorite));
		}

		if (filters.category) {
			conditions.push(eq(groups.category, filters.category));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Configurar orden
		const sortBy = options.sortBy || 'name';
		const sortOrder = options.sortOrder || 'asc';
		const orderByClause =
			sortOrder === 'desc'
				? desc(groups[sortBy as keyof typeof groups] as any)
				: asc(groups[sortBy as keyof typeof groups] as any);

		// Ejecutar consultas en paralelo
		const [groupsResult, totalCount] = await Promise.all([
			db.select().from(groups).where(whereClause).orderBy(orderByClause).limit(pageSize).offset(offset),
			db
				.select({ count: count() })
				.from(groups)
				.where(whereClause)
				.then((res) => res[0]?.count || 0),
		]);

		// Obtener estadísticas para cada grupo
		const groupsWithStats = await Promise.all(
			groupsResult.map(async (group) => {
				const [imageCount, videoCount, albumCount, tagCount] = await Promise.all([
					db
						.select({ count: count() })
						.from(groupImages)
						.where(eq(groupImages.groupId, group.id))
						.then((res) => res[0]?.count || 0),
					db
						.select({ count: count() })
						.from(groupVideos)
						.where(eq(groupVideos.groupId, group.id))
						.then((res) => res[0]?.count || 0),
					db
						.select({ count: count() })
						.from(groupAlbums)
						.where(eq(groupAlbums.groupId, group.id))
						.then((res) => res[0]?.count || 0),
					db
						.select({ count: count() })
						.from(groupTags)
						.where(eq(groupTags.groupId, group.id))
						.then((res) => res[0]?.count || 0),
				]);

				return {
					...group,
					_count: {
						images: imageCount,
						videos: videoCount,
						albums: albumCount,
						tags: tagCount,
						collections: 0,
						characters: 0,
						places: 0,
						worldItems: 0,
						concepts: 0,
						prompts: 0,
						notes: 0,
						wildcards: 0,
						properties: 0,
						groups: 0,
					},
				} as GroupWithStats;
			})
		);

		const result: GroupSearchResult = {
			data: groupsWithStats,
			total: totalCount,
			page,
			pageSize,
			totalPages: Math.ceil(totalCount / pageSize),
			hasNext: page * pageSize < totalCount,
			hasPrevious: page > 1,
		};

		logger.info(`✅ Búsqueda completada, encontrados ${result.total} grupos`);
		return result;
	} catch (error) {
		logger.error('❌ Error al buscar grupos', { error, filters, options });
		throw createGroupError(
			`Error al buscar grupos: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
};

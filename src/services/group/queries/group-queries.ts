/**
 * @file Funciones de consulta para grupos
 * @module services/group/queries
 */

import { and, asc, count, desc, eq, inArray, like, or } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { groups } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import type { GroupSearchResult, GroupWithStats } from '@/types/entities/group/types';
import { GroupErrorCode, createGroupError } from '../types/group-service.types';
import { buildGroupWithStats } from './group-stats-helper';

const logger = serverLogger.withContext('GroupService');

/**
 * Obtiene un grupo por su ID con estadísticas
 */
export const getGroupService = async (id: string): Promise<GroupWithStats | null> => {
	try {
		logger.info(`🔍 Buscando grupo con ID: ${id}`);

		// Buscar grupo base
		const groupResult = await db.select().from(groups).where(eq(groups.id, id)).limit(1);

		if (groupResult.length === 0) {
			logger.warn(`⚠️ Grupo no encontrado: ${id}`);
			return null;
		}

		const group = groupResult[0];

		// Construir grupo con estadísticas
		const groupWithStats = await buildGroupWithStats(group);

		logger.info(`✅ Grupo encontrado: ${group.name}`);
		return groupWithStats;
	} catch (error) {
		logger.error('❌ Error al obtener grupo por ID', { error, groupId: id });
		throw createGroupError(
			`Error al obtener grupo: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Obtiene múltiples grupos por sus IDs
 */
export const getGroupsByIdsService = async (ids: string[]): Promise<GroupWithStats[]> => {
	try {
		logger.info(`🔍 Buscando grupos por IDs, cantidad: ${ids.length}`);

		if (ids.length === 0) {
			return [];
		}

		// Buscar grupos base
		const groupsResult = await db.select().from(groups).where(inArray(groups.id, ids));

		// Obtener estadísticas para cada grupo
		const groupsWithStats = await Promise.all(groupsResult.map((group: typeof groups.$inferSelect) => buildGroupWithStats(group)));

		logger.info(`✅ Grupos encontrados: ${groupsWithStats.length}`);
		return groupsWithStats;
	} catch (error) {
		logger.error('❌ Error al obtener grupos por IDs', { error, ids });
		throw createGroupError(
			`Error al obtener grupos: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Busca grupos según criterios específicos
 */
export const searchGroupsService = async (
	filters: Record<string, any> = {},
	options: {
		page?: number;
		pageSize?: number;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
		includeInactive?: boolean;
	} = {}
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
				.then((res: { count: number }[]) => res[0]?.count || 0),
		]);

		// Obtener estadísticas para cada grupo
		const groupsWithStats = await Promise.all(groupsResult.map((group: typeof groups.$inferSelect) => buildGroupWithStats(group)));

		const result: GroupSearchResult = {
			groups: groupsWithStats,
			total: totalCount,
			page,
			limit: pageSize,
			hasMore: page * pageSize < totalCount,
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

'use server';

/**
 * @file Acciones para consultar actividades
 * @module app/actions/activity/query.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';

import {
    extendActivities,
    extendActivity,
    mapActivityFiltersToPrisma,
} from '@/transformers/activity';
import {
    type Activity,
    type ActivityFilters,
    type ActivityListResponse,
    type ActivityType,
} from '@/types/entities/activity';

const activityLogger = serverLogger.withContext('ActivityQueryActions');

enum ActivityErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
}

const createActivityError = (
	message: string,
	code: ActivityErrorCode = ActivityErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	const error = new Error(message);
	error.name = 'ActivityError';
	Object.assign(error, { code, cause });
	return error;
};

/**
 * Obtiene actividades recientes
 */
export async function getRecentActivities(limit = 10): Promise<Activity[]> {
	try {
		activityLogger.info('📥 Obteniendo actividades recientes');
		const activities = await prisma.activity.findMany({
			take: limit,
			orderBy: {
				createdAt: 'desc',
			},
			include: {
				image: true,
			},
		});

		activityLogger.info('✅ Actividades recientes obtenidas:', { count: activities.length });
		return extendActivities(activities);
	} catch (error) {
		activityLogger.error('❌ Error al obtener actividades recientes:', error);
		throw createActivityError(
			'No se pudieron obtener las actividades recientes',
			ActivityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Obtiene actividades por tipo
 */
export async function getActivitiesByType(type: ActivityType | string, limit = 10): Promise<Activity[]> {
	try {
		activityLogger.info('📥 Obteniendo actividades por tipo:', type);
		const activities = await prisma.activity.findMany({
			where: {
				type,
			},
			take: limit,
			orderBy: {
				createdAt: 'desc',
			},
			include: {
				image: true,
			},
		});

		activityLogger.info('✅ Actividades por tipo obtenidas:', { type, count: activities.length });
		return extendActivities(activities);
	} catch (error) {
		activityLogger.error('❌ Error al obtener actividades por tipo:', { type, error });
		throw createActivityError(
			'No se pudieron obtener las actividades por tipo',
			ActivityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Obtiene actividades por imagen
 */
export async function getActivitiesByImage(imageId: string, limit = 10): Promise<Activity[]> {
	try {
		activityLogger.info('📥 Obteniendo actividades por imagen:', imageId);
		const activities = await prisma.activity.findMany({
			where: {
				imageId,
			},
			take: limit,
			orderBy: {
				createdAt: 'desc',
			},
			include: {
				image: true,
			},
		});

		activityLogger.info('✅ Actividades por imagen obtenidas:', { imageId, count: activities.length });
		return extendActivities(activities);
	} catch (error) {
		activityLogger.error('❌ Error al obtener actividades por imagen:', { imageId, error });
		throw createActivityError(
			'No se pudieron obtener las actividades por imagen',
			ActivityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Obtiene actividades con filtros, paginación y ordenamiento
 */
export async function getFilteredActivities(filters: ActivityFilters): Promise<ActivityListResponse> {
	try {
		activityLogger.info('📥 Obteniendo actividades filtradas:', filters);

		// Convertir filtros a formato Prisma
		const prismaQuery = mapActivityFiltersToPrisma(filters);

		// Ejecutar consulta principal
		const activities = await prisma.activity.findMany(prismaQuery);

		// Contar total de resultados para paginación
		const totalCount = await prisma.activity.count({
			where: prismaQuery.where,
		});

		// Extender actividades con información adicional
		const extendedActivities = extendActivities(activities);

		// Calcular si hay más resultados
		const hasMore = (prismaQuery.skip || 0) + (prismaQuery.take || 20) < totalCount;

		activityLogger.info('✅ Actividades filtradas obtenidas:', {
			count: activities.length,
			total: totalCount,
			hasMore,
		});

		return {
			activities: extendedActivities,
			totalCount,
			hasMore,
		};
	} catch (error) {
		activityLogger.error('❌ Error al obtener actividades filtradas:', { filters, error });
		throw createActivityError(
			'No se pudieron obtener las actividades filtradas',
			ActivityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Busca una actividad específica por ID
 */
export async function getActivityById(id: string): Promise<Activity | null> {
	try {
		activityLogger.info('🔍 Buscando actividad por ID:', id);

		const activity = await prisma.activity.findUnique({
			where: { id },
			include: {
				image: true,
			},
		});

		if (!activity) {
			activityLogger.warn('⚠️ Actividad no encontrada:', id);
			return null;
		}

		activityLogger.info('✅ Actividad encontrada:', {
			activityId: id,
			type: activity.type,
		});

		// Extender la actividad con información adicional
		return extendActivity(activity);
	} catch (error) {
		activityLogger.error('❌ Error al buscar actividad por ID:', { id, error });
		throw createActivityError('No se pudo buscar la actividad', ActivityErrorCode.OPERATION_FAILED, error);
	}
}
'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { revalidatePath } from 'next/cache';

// Importar tipos y transformers actualizados
import {
	extendActivities,
	extendActivity,
	generateActivityDescription,
	mapActivityFiltersToPrisma,
	mapCreateActivityDataToPrisma,
} from '@/transformers/activity';
import {
	type Activity,
	ActivityEventType,
	type ActivityFilters,
	type ActivityListResponse,
	type ActivityType,
	type CreateActivityData,
} from '@/types/entities/activity';

const activityLogger = serverLogger.withContext('ActivityActions');

const REVALIDATE_PATHS = ['/settings', '/activities'] as const;

const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	activityLogger.info('🔄 Rutas revalidadas');
};

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
 * Notifica a los clientes sobre cambios en las actividades
 */
const notifyActivityChange = async (
	action: 'create' | 'update' | 'delete' | 'cleanup',
	activityData: any
): Promise<void> => {
	try {
		// Emitir evento de actividad
		await emit({
			type: ActivityEventType.MODIFIED,
			data: { action, activity: activityData },
		});
		await revalidateAllPaths();
	} catch (error) {
		activityLogger.error('❌ Error al notificar cambio de actividad:', { action, error });
	}
};

/**
 * Registra una nueva actividad en el sistema
 */
export async function logActivity(data: CreateActivityData): Promise<Activity> {
	try {
		activityLogger.info('📝 Registrando actividad:', data);

		// Usar el transformer para mapear los datos a formato Prisma
		const prismaData = mapCreateActivityDataToPrisma(data);

		const activity = await prisma.activity.create({
			data: prismaData,
			include: {
				image: true,
			},
		});

		activityLogger.info('✅ Actividad registrada:', {
			activityId: activity.id,
			type: activity.type,
		});

		// Extender la actividad con información adicional
		const extendedActivity = extendActivity(activity);

		// Notificar a los clientes
		await notifyActivityChange('create', extendedActivity);

		return extendedActivity;
	} catch (error) {
		activityLogger.error('❌ Error al registrar actividad:', { data, error });
		throw createActivityError('No se pudo registrar la actividad', ActivityErrorCode.OPERATION_FAILED, error);
	}
}

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

		// Utilizar el transformer para construir la consulta
		const query = mapActivityFiltersToPrisma(filters);

		// Ejecutar la consulta para obtener resultados
		const activities = await prisma.activity.findMany(query);

		// Obtener conteo total para paginación
		const totalCount = await prisma.activity.count({
			where: query.where,
		});

		// Determinar si hay más resultados disponibles
		const hasMore = totalCount > (filters.offset || 0) + activities.length;

		// Convertir actividades básicas a extendidas
		const extendedActivities = extendActivities(activities);

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
 * Elimina actividades antiguas basadas en criterios
 */
export async function cleanupOldActivities(
	olderThanDays = 30,
	types?: ActivityType[] | string[]
): Promise<{ deleted: number }> {
	try {
		activityLogger.info('🧹 Limpiando actividades antiguas', { olderThanDays, types });

		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

		// Construir condiciones WHERE
		const where: any = {
			createdAt: {
				lt: cutoffDate,
			},
		};

		// Añadir filtro por tipos si se especifica
		if (types && types.length > 0) {
			where.type = { in: types };
		}

		// Ejecutar eliminación
		const result = await prisma.activity.deleteMany({
			where,
		});

		activityLogger.info('✅ Actividades antiguas eliminadas', { count: result.count });

		// Notificar a los clientes
		await notifyActivityChange('cleanup', { count: result.count, olderThanDays, types });

		return { deleted: result.count };
	} catch (error) {
		activityLogger.error('❌ Error al limpiar actividades antiguas:', error);
		throw createActivityError(
			'No se pudieron limpiar las actividades antiguas',
			ActivityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Crea una actividad con descripción generada automáticamente
 * @param type Tipo de actividad
 * @param metadata Datos para generar la descripción
 * @param imageId ID de imagen relacionada (opcional)
 */
export async function createActivity(
	type: ActivityType | string,
	metadata: Record<string, any> = {},
	imageId?: string
): Promise<Activity> {
	try {
		// Generar descripción basada en el tipo y metadata
		const description = generateActivityDescription(type, metadata);

		// Crear datos para la actividad
		const activityData: CreateActivityData = {
			type,
			description,
			imageId,
		};

		// Registrar la actividad
		return await logActivity(activityData);
	} catch (error) {
		activityLogger.error('❌ Error al crear actividad:', { type, metadata, imageId, error });
		throw createActivityError('No se pudo crear la actividad', ActivityErrorCode.OPERATION_FAILED, error);
	}
}

'use server';

/**
 * @file Acciones para eliminar actividades
 * @module app/actions/activity/delete.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { revalidatePath } from 'next/cache';

import { ActivityEventType, type ActivityType } from '@/types/entities/activity';

const activityLogger = serverLogger.withContext('ActivityDeleteActions');

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
 * Elimina una actividad específica por ID
 */
export async function deleteActivity(id: string): Promise<boolean> {
	try {
		activityLogger.info('🗑️ Eliminando actividad por ID:', id);

		// Comprobar que la actividad existe
		const activity = await prisma.activity.findUnique({
			where: { id },
			include: { image: true },
		});

		if (!activity) {
			activityLogger.warn('⚠️ Actividad no encontrada para eliminar:', id);
			throw createActivityError('Actividad no encontrada', ActivityErrorCode.NOT_FOUND);
		}

		// Eliminar la actividad
		await prisma.activity.delete({
			where: { id },
		});

		activityLogger.info('✅ Actividad eliminada:', {
			activityId: id,
			type: activity.type,
		});

		// Notificar a los clientes
		await notifyActivityChange('delete', { id, type: activity.type });

		return true;
	} catch (error) {
		activityLogger.error('❌ Error al eliminar actividad:', { id, error });

		// Si el error es que no se encontró, devolvemos false en lugar de lanzar una excepción
		if ((error as any).code === ActivityErrorCode.NOT_FOUND) {
			return false;
		}

		throw createActivityError('No se pudo eliminar la actividad', ActivityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Elimina actividades antiguas
 */
export async function cleanupOldActivities(
	olderThanDays = 30,
	types?: ActivityType[] | string[]
): Promise<{ deleted: number }> {
	try {
		activityLogger.info('🧹 Limpiando actividades antiguas:', { olderThanDays, types });

		// Calcular fecha límite
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

		// Preparar condición WHERE
		const where: any = {
			createdAt: {
				lt: cutoffDate,
			},
		};

		// Agregar tipos si se especifican
		if (types && types.length > 0) {
			where.type = {
				in: types,
			};
		}

		// Ejecutar eliminación
		const result = await prisma.activity.deleteMany({
			where,
		});

		activityLogger.info('✅ Actividades antiguas eliminadas:', {
			count: result.count,
			olderThanDays,
			types,
		});

		// Notificar a los clientes
		await notifyActivityChange('cleanup', {
			count: result.count,
			olderThanDays,
			types,
		});

		return { deleted: result.count };
	} catch (error) {
		activityLogger.error('❌ Error al limpiar actividades antiguas:', { olderThanDays, types, error });
		throw createActivityError(
			'No se pudieron limpiar las actividades antiguas',
			ActivityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

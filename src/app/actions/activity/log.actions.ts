'use server';

/**
 * @file Acciones para el registro de actividades
 * @module app/actions/activity/log.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { revalidatePath } from 'next/cache';

import { extendActivity, generateActivityDescription, mapCreateActivityDataToPrisma } from '@/transformers/activity';
import {
	type Activity,
	ActivityEventType,
	type ActivityType,
	type CreateActivityData,
} from '@/types/entities/activity';

const activityLogger = serverLogger.withContext('ActivityLogActions');

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
 * Crea una actividad con descripción generada automáticamente a partir de metadata
 */
export async function createActivity(
	type: ActivityType | string,
	metadata: Record<string, any> = {},
	imageId?: string
): Promise<Activity> {
	try {
		activityLogger.info('📝 Creando actividad:', { type, metadata, imageId });

		// Generar descripción automáticamente
		const description = generateActivityDescription(type, metadata);

		// Crear datos para la actividad
		const activityData: CreateActivityData = {
			type,
			description,
			...(imageId && { imageId }),
		};

		// Registrar la actividad usando la función común
		return await logActivity(activityData);
	} catch (error) {
		activityLogger.error('❌ Error al crear actividad:', { type, metadata, error });
		throw createActivityError('No se pudo crear la actividad', ActivityErrorCode.OPERATION_FAILED, error);
	}
}

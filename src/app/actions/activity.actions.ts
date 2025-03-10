'use server';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import type { Activity } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const activityLogger = logger.withContext('ActivityActions');

const REVALIDATE_PATHS = ['/settings', '/activities'] as const;

const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	activityLogger.info('🔄 Rutas revalidadas');
};

class ActivityError extends Error {
	constructor(
		message: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'ActivityError';
	}
}

export interface ActivityCreate {
	type: string;
	description: string;
	imageId?: string;
}

export async function logActivity(data: ActivityCreate) {
	try {
		activityLogger.info('📝 Registrando actividad:', data);
		const activity = await prisma.activity.create({
			data: {
				type: data.type,
				description: data.description,
				imageId: data.imageId,
			},
			include: {
				image: true,
			},
		});

		activityLogger.info('✅ Actividad registrada:', {
			activityId: activity.id,
			type: activity.type,
		});

		// Emitir evento de actividad con el nuevo sistema
		await emit({
			type: 'files:modified',
			data: { action: 'log', entity: activity },
		});
		await revalidateAllPaths();

		return activity;
	} catch (error) {
		activityLogger.error('❌ Error al registrar actividad:', { data, error });
		throw new ActivityError('No se pudo registrar la actividad', error);
	}
}

export async function getRecentActivities(limit = 10) {
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
		return activities;
	} catch (error) {
		activityLogger.error('❌ Error al obtener actividades recientes:', error);
		throw new ActivityError('No se pudieron obtener las actividades recientes', error);
	}
}

export async function getActivitiesByType(type: string, limit = 10) {
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
		return activities;
	} catch (error) {
		activityLogger.error('❌ Error al obtener actividades por tipo:', { type, error });
		throw new ActivityError('No se pudieron obtener las actividades por tipo', error);
	}
}

export async function getActivitiesByImage(imageId: string, limit = 10) {
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
		return activities;
	} catch (error) {
		activityLogger.error('❌ Error al obtener actividades por imagen:', { imageId, error });
		throw new ActivityError('No se pudieron obtener las actividades por imagen', error);
	}
}

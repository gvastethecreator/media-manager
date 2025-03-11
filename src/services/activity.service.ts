import { logger } from '@/lib/logger/logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';

const activityLogger = logger.withContext('ActivityService');

export interface ActivityCreate {
	type: string;
	description: string;
	imageId?: string;
}

export const ActivityService = {
	async logActivity(data: ActivityCreate) {
		try {
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

			activityLogger.info('📝 Actividad registrada', {
				activityId: activity.id,
				type: activity.type,
			});

			// Emitir evento de actividad con el nuevo sistema
			await emit({
				type: 'files:modified',
				data: { action: 'log', entity: activity },
			});

			return activity;
		} catch (error) {
			activityLogger.error('❌ Error al registrar actividad:', { data, error });
			throw error;
		}
	},

	async getRecentActivities(limit = 10) {
		try {
			const activities = await prisma.activity.findMany({
				take: limit,
				orderBy: {
					createdAt: 'desc',
				},
				include: {
					image: true,
				},
			});

			activityLogger.info('📥 Actividades recientes obtenidas:', { count: activities.length });
			return activities;
		} catch (error) {
			activityLogger.error('❌ Error al obtener actividades recientes:', error);
			throw error;
		}
	},

	async getActivitiesByType(type: string, limit = 10) {
		try {
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

			activityLogger.info('📥 Actividades por tipo obtenidas:', { type, count: activities.length });
			return activities;
		} catch (error) {
			activityLogger.error('❌ Error al obtener actividades por tipo:', { type, error });
			throw error;
		}
	},

	async getActivitiesByImage(imageId: string, limit = 10) {
		try {
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

			activityLogger.info('📥 Actividades por imagen obtenidas:', { imageId, count: activities.length });
			return activities;
		} catch (error) {
			activityLogger.error('❌ Error al obtener actividades por imagen:', { imageId, error });
			throw error;
		}
	},
};

/**
 * @file Sistema de eventos para el servicio de etiquetas
 * @module services/tag/events
 */

import { emit } from '@/lib/server/events.server';
import { revalidatePath } from '@/lib/server/revalidate';
import { serverLogger } from '@/lib/logger/server-logger';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import type { TagWithStats } from '@/types/entities/tag';
import { REVALIDATE_PATHS } from '../types/tag-service.types';

const logger = serverLogger.withContext('TagService');

/**
 * Eventos del servicio de etiquetas
 */
export const TAG_EVENTS = {
	CREATED: 'tag:created',
	UPDATED: 'tag:updated',
	DELETED: 'tag:deleted',
	STATS_UPDATED: 'tag:stats:updated',
	ERROR: 'tag:error',
} as const;

/**
 * Notifica cambios en las etiquetas a través del sistema de eventos
 */
export const notifyTagChange = async (
	action: 'create' | 'update' | 'delete',
	tag: TagWithStats | { id: string }
): Promise<void> => {
	try {
		let eventType: string;
		switch (action) {
			case 'create':
				eventType = TAG_EVENTS.CREATED;
				break;
			case 'update':
				eventType = TAG_EVENTS.UPDATED;
				break;
			case 'delete':
				eventType = TAG_EVENTS.DELETED;
				break;
			default:
				eventType = 'tag:modified';
		}

		// Emitir evento al sistema central
		await emit({
			type: 'tags:modified',
			data: { action, tag },
		});

		// Notificar a estadísticas
		statsEventEmitter.emit(STATS_EVENTS.TAG_CHANGE);

		logger.info(`🔔 Notificado cambio en etiqueta: ${action}`, { tagId: tag.id });
	} catch (error) {
		logger.error(`❌ Error al notificar cambio en etiqueta: ${action}`, { error, tagId: tag.id });
	}
};

/**
 * Revalida las rutas relacionadas con etiquetas
 */
export const revalidateTagPaths = async (): Promise<void> => {
	for (const path of REVALIDATE_PATHS) {
		await revalidatePath(path);
	}
};

/**
 * @file Sistema de eventos para etiquetas
 * @module services/tag/tag-events
 * @description Gestión de eventos y notificaciones para el servicio de etiquetas
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import type { TagWithStats } from '@/types/entities/tag';

const logger = serverLogger.withContext('TagService');

/**
 * Constantes de eventos de etiquetas
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
 *
 * @param action - Tipo de acción realizada (create, update, delete)
 * @param tag - Etiqueta afectada (completa o solo con ID)
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

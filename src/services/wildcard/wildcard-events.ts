/**
 * @file Sistema de eventos para wildcards
 * @module services/wildcard/wildcard-events
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import type { WildcardWithStats } from '@/types/entities/wildcard';

const logger = serverLogger.withContext('WildcardEvents');

/**
 * Eventos del servicio de wildcards
 */
export const WILDCARD_EVENTS = {
	CREATED: 'wildcard:created',
	UPDATED: 'wildcard:updated',
	DELETED: 'wildcard:deleted',
	MOVED: 'wildcard:moved',
	STATS_UPDATED: 'wildcard:stats:updated',
} as const;

/**
 * Notifica cambios en los wildcards a través del sistema de eventos
 */
export const notifyWildcardChange = async (
	action: 'create' | 'update' | 'delete' | 'move',
	wildcard: WildcardWithStats | { id: string }
): Promise<void> => {
	try {
		let eventType: string;
		switch (action) {
			case 'create':
				eventType = WILDCARD_EVENTS.CREATED;
				break;
			case 'update':
				eventType = WILDCARD_EVENTS.UPDATED;
				break;
			case 'delete':
				eventType = WILDCARD_EVENTS.DELETED;
				break;
			case 'move':
				eventType = WILDCARD_EVENTS.MOVED;
				break;
			default:
				eventType = 'wildcard:modified';
		}

		// Emitir evento al sistema central
		await emit({
			type: 'wildcards:modified',
			data: { action, wildcard },
		});

		// Notificar a estadísticas
		statsEventEmitter.emit(STATS_EVENTS.WILDCARD_CHANGE);

		logger.info(`🔔 Notificado cambio en wildcard: ${action}`, { wildcardId: wildcard.id });
	} catch (error) {
		logger.error(`❌ Error al notificar cambio en wildcard: ${action}`, { error, wildcardId: wildcard.id });
	}
};

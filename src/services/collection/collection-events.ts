/**
 * @file Sistema de eventos para colecciones
 * @module services/collection/collection-events
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { type EventType, emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats/stats.service';
import type { CollectionBase, CollectionWithStats } from '@/types/entities/collection';

const logger = serverLogger.withContext('CollectionEvents');

/**
 * Eventos del servicio de colecciones
 */
export const COLLECTION_EVENTS = {
	CREATED: 'collection:created',
	UPDATED: 'collection:updated',
	DELETED: 'collection:deleted',
	ITEMS_ADDED: 'collection:items:added',
	ITEMS_REMOVED: 'collection:items:removed',
	STATS_UPDATED: 'collection:stats:updated',
} as const;

/**
 * Notifica cambios en las colecciones a través del sistema de eventos
 */
export const notifyCollectionChange = async (
	action: 'create' | 'update' | 'delete' | 'items:add' | 'items:remove',
	collection: CollectionBase | CollectionWithStats | { id: string }
): Promise<void> => {
	try {
		let eventType: string;

		switch (action) {
			case 'create':
				eventType = COLLECTION_EVENTS.CREATED;
				break;
			case 'update':
				eventType = COLLECTION_EVENTS.UPDATED;
				break;
			case 'delete':
				eventType = COLLECTION_EVENTS.DELETED;
				break;
			case 'items:add':
				eventType = COLLECTION_EVENTS.ITEMS_ADDED;
				break;
			case 'items:remove':
				eventType = COLLECTION_EVENTS.ITEMS_REMOVED;
				break;
			default:
				eventType = 'collection:modified';
		}

		// Emitir evento al sistema central
		await emit({
			type: eventType as EventType,
			data: { action, collection },
		});

		// Notificar a estadísticas
		statsEventEmitter.emit(STATS_EVENTS.COLLECTION_CHANGE);

		logger.info(`🔔 Notificado cambio en colección: ${action}`, { collectionId: collection.id });
	} catch (error) {
		logger.error(`❌ Error al notificar cambio en colección: ${action}`, { error, collectionId: collection.id });
	}
};

import type { Collection } from '@prisma/client';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';

const collectionEventsLogger = serverLogger.withContext('CollectionEventsService');

export const COLLECTION_EVENTS = {
	COLLECTION_CREATED: 'collection:created',
	COLLECTION_UPDATED: 'collection:updated',
	COLLECTION_DELETED: 'collection:deleted',
	IMAGE_ADDED: 'collection:image:added',
	IMAGE_REMOVED: 'collection:image:removed',
} as const;

export type CollectionEventType = (typeof COLLECTION_EVENTS)[keyof typeof COLLECTION_EVENTS];

export interface CollectionEventData {
	collection?: Collection;
	collectionId?: string;
	imageId?: string;
}

/**
 * Servicio para gestionar eventos de colecciones
 * Migrado a usar serverEvents en lugar de EventEmitter
 */
export const CollectionEventsService = {
	/**
	 * Emite un evento de colección
	 */
	async emit(event: CollectionEventType, data: CollectionEventData) {
		collectionEventsLogger.info('📢 Emitiendo evento:', { event, data });

		// Mapear el tipo de evento a un tipo de evento del servidor
		let eventType: 'collections:modified' | 'update' | 'delete' = 'collections:modified';

		if (event === COLLECTION_EVENTS.COLLECTION_DELETED) {
			eventType = 'delete';
		} else if (event === COLLECTION_EVENTS.COLLECTION_CREATED || event === COLLECTION_EVENTS.COLLECTION_UPDATED) {
			eventType = 'update';
		}

		// Emitir el evento con el nuevo sistema
		await emit({
			type: eventType,
			id: data.collectionId,
			imageId: data.imageId,
			data: {
				action: event,
				entity: data.collection,
				eventType: event,
			},
		});

		return true;
	},
};

export const collectionEventsService = CollectionEventsService;

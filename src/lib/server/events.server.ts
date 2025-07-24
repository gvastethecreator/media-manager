import { ENV } from '@/config/env';
import type { ProcessStatus } from '@/types/process';

// Mapa de rutas a revalidar por tipo de evento (conservado para compatibilidad)
const EVENT_PATHS: Record<EventType, string[]> = {
	create: ['/'],
	update: ['/'],
	delete: ['/'],
	addImage: ['/images'],
	removeImage: ['/images'],
	'collections:modified': ['/collections'],
	'tags:modified': ['/tags'],
	'albums:modified': ['/albums'],
	'prompts:modified': ['/prompts', '/prompts/[id]'],
	'prompts:relation': ['/prompts', '/prompts/[id]'],
	'notes:modified': ['/notes', '/notes/[id]'],
	'characters:modified': ['/characters'],
	'places:modified': ['/places'],
	'objects:modified': ['/objects'],
	'world-items:modified': ['/world-items'],
	'favorites:modified': ['/favorites'],
	'images:modified': ['/images'],
	'files:modified': ['/files'],
	'folders:modified': ['/folders'],
	'folder:progress': ['/folders'],
	'folder:error': ['/folders'],
	'folder:complete': ['/folders'],
	'folder:stats': ['/folders'],
	'folder:reindexAll:start': ['/folders'],
	'folder:reindexAll:progress': ['/folders'],
	'folder:reindexAll:complete': ['/folders'],
	'uploaded-image:created': ['/uploads', '/images'],
	'uploaded-image:updated': ['/uploads', '/images'],
	'uploaded-image:deleted': ['/uploads', '/images'],
	'uploaded-images:changed': ['/uploads', '/images'],
	// Activity events
	'activity.created': ['/activities', '/settings'],
	'activity.updated': ['/activities', '/settings'],
	'activity.deleted': ['/activities', '/settings'],
	'activity.modified': ['/activities', '/settings'],
	'activity.cleared': ['/activities', '/settings'],
	// File events
	'file:created': ['/files', '/folders'],
	'file:modified': ['/files', '/folders'],
	'file:deleted': ['/files', '/folders'],
	'file:moved': ['/files', '/folders'],
	'file:copied': ['/files', '/folders'],
	'file:renamed': ['/files', '/folders'],
	'directory:created': ['/files', '/folders'],
	'directory:deleted': ['/files', '/folders'],
};

export type EventType =
	| 'create'
	| 'update'
	| 'delete'
	| 'addImage'
	| 'removeImage'
	| 'collections:modified'
	| 'tags:modified'
	| 'albums:modified'
	| 'prompts:modified'
	| 'prompts:relation'
	| 'notes:modified'
	| 'characters:modified'
	| 'places:modified'
	| 'objects:modified'
	| 'world-items:modified'
	| 'favorites:modified'
	| 'images:modified'
	| 'files:modified'
	| 'folders:modified'
	| 'folder:progress'
	| 'folder:error'
	| 'folder:complete'
	| 'folder:stats'
	| 'folder:reindexAll:start'
	| 'folder:reindexAll:progress'
	| 'folder:reindexAll:complete'
	| 'uploaded-image:created'
	| 'uploaded-image:updated'
	| 'uploaded-image:deleted'
	| 'uploaded-images:changed'
	// Activity events
	| 'activity.created'
	| 'activity.updated'
	| 'activity.deleted'
	| 'activity.modified'
	| 'activity.cleared'
	// File events
	| 'file:created'
	| 'file:modified'
	| 'file:deleted'
	| 'file:moved'
	| 'file:copied'
	| 'file:renamed'
	| 'directory:created'
	| 'directory:deleted';

export interface EventData<T = unknown> {
	type: EventType;
	id?: string;
	objectId?: string;
	worldItemId?: string;
	imageId?: string;
	data?: T;
}

// Store para eventos en memoria (compartido con el endpoint)
const eventStore = new Map<string, EventData[]>();
const eventSubscribers = new Set<(event: EventData) => void>();

/**
 * Obtener el store de eventos (para uso compartido)
 */
export function getEventStore() {
	return eventStore;
}

/**
 * Obtener los suscriptores de eventos (para uso compartido)
 */
export function getEventSubscribers() {
	return eventSubscribers;
}

/**
 * Emite un evento directamente en el servidor (sin HTTP)
 */
function emitDirect(event: EventData) {
	console.log('🚀 Emitiendo evento (servidor directo):', event);

	// Almacenar evento
	const eventKey = event.type;
	if (!eventStore.has(eventKey)) {
		eventStore.set(eventKey, []);
	}
	eventStore.get(eventKey)?.push({
		...event,
		timestamp: Date.now(),
	});

	// Mantener solo los últimos 100 eventos por tipo
	const events = eventStore.get(eventKey);
	if (events && events.length > 100) {
		events.splice(0, events.length - 100);
	}

	// Notificar a suscriptores
	eventSubscribers.forEach((subscriber) => {
		try {
			subscriber(event);
		} catch (error) {
			console.error('Error notificando suscriptor:', error);
		}
	});
}

/**
 * Emite un evento (versión híbrida - directo en servidor, HTTP en cliente)
 */
export async function emit(event: EventData) {
	try {
		// Detectar si estamos en el servidor (Node.js) o cliente (navegador)
		const isServer = typeof window === 'undefined';

		if (isServer) {
			// En el servidor, emitir directamente
			emitDirect(event);
		} else {
			// En el cliente, usar HTTP
			console.log('🚀 Emitiendo evento (cliente HTTP):', event);
			const response = await fetch('/api/events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(event),
			});

			if (!response.ok) {
				console.warn('❌ Error al emitir evento:', response.statusText);
			}
		}
	} catch (error) {
		console.warn('❌ Error al emitir evento:', error);
		// En modo desarrollo, no fallar por errores de eventos
	}
}

/**
 * Emite un evento de progreso (versión cliente)
 */
export async function emitProgress(type: EventType, data: ProcessStatus) {
	// Asegurarse de que timestamp esté presente
	const dataWithTimestamp = {
		...data,
		timestamp: data.timestamp || Date.now(),
	};

	// Emitir el evento
	await emit({
		type,
		data: dataWithTimestamp,
	});
}

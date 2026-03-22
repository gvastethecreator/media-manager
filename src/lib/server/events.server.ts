import { serverLogger } from '@/lib/logger/server-logger';
import type { ProcessStatus } from '@/types/folders';

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
	'properties:modified': ['/properties'],
	'entities:modified': ['/entities'],
	'wildcards:modified': ['/wildcards'],
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
	| 'properties:modified'
	| 'entities:modified'
	| 'wildcards:modified'
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
	data?: T;
	id?: string;
	imageId?: string;
	objectId?: string;
	timestamp?: number;
	type: EventType;
	worldItemId?: string;
}

// Store para eventos en memoria (compartido con el endpoint)
const eventStore = new Map<string, EventData[]>();
const eventSubscribers = new Set<(event: EventData) => void>();
const logger = serverLogger.withContext('Events');

// Campos potencialmente pesados a omitir
const HEAVY_KEYS = new Set(['thumbnail', 'buffer', 'content', 'data', 'metadata']);

function truncateString(value: string, max = 256): string {
	if (value.length <= max) return value;
	return `${value.slice(0, max)}…(+${value.length - max})`;
}

function sanitizeObject(input: unknown, depth = 0): unknown {
	if (depth > 3) return '[depth-limit]';
	if (input == null) return input;
	if (typeof input === 'string') return truncateString(input, 256);
	if (typeof input !== 'object') return input;
	if (Array.isArray(input)) return input.slice(0, 20).map((v) => sanitizeObject(v, depth + 1));
	const obj = input as Record<string, unknown>;
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(obj)) {
		if (HEAVY_KEYS.has(k)) {
			if (typeof v === 'string') {
				out[k] = `[omitted:${v.length} chars]`;
			} else if (v && typeof (v as any).length === 'number') {
				out[k] = `[omitted:${(v as any).length} bytes]`;
			} else {
				out[k] = '[omitted]';
			}
			continue;
		}
		out[k] = sanitizeObject(v, depth + 1);
	}
	return out;
}

function sanitizeEventForStore(event: EventData): EventData {
	const data = sanitizeObject(event.data);
	return { ...event, data };
}

function eventLogPreview(event: EventData): Record<string, unknown> {
	const preview: Record<string, unknown> = { type: event.type };
	if (event.id) preview.id = event.id;
	if (event.imageId) preview.imageId = event.imageId;
	if (event.objectId) preview.objectId = event.objectId;
	if (event.data && typeof event.data === 'object') {
		const keys = Object.keys(event.data as Record<string, unknown>);
		preview.dataKeys = keys.slice(0, 10);
	} else if (typeof event.data === 'string') {
		preview.data = truncateString(event.data, 128);
	}
	return preview;
}

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

function isServerRuntime() {
	return typeof globalThis.window === 'undefined' || globalThis.window == null;
}

/**
 * Emite un evento directamente en el servidor (sin HTTP)
 */
function emitDirect(event: EventData) {
	logger.info('🚀 Emitiendo evento (servidor directo):', eventLogPreview(event));

	// Almacenar evento
	const eventKey = event.type;
	if (!eventStore.has(eventKey)) {
		eventStore.set(eventKey, []);
	}
	const sanitized = sanitizeEventForStore(event);
	eventStore.get(eventKey)?.push({
		...sanitized,
		timestamp: Date.now(),
	});

	// Mantener solo los últimos 100 eventos por tipo
	const events = eventStore.get(eventKey);
	if (events && events.length > 100) {
		events.splice(0, events.length - 100);
	}

	// Notificar a suscriptores
	for (const subscriber of eventSubscribers) {
		try {
			subscriber(event);
		} catch (error) {
			logger.error('Error notificando suscriptor:', error);
		}
	}
}

/**
 * Emite un evento (versión híbrida - directo en servidor, HTTP en cliente)
 */
export async function emit(event: EventData) {
	try {
		// Detectar si estamos en el servidor (Node.js) o cliente (navegador)
		const isServer = isServerRuntime();

		if (isServer) {
			// En el servidor, emitir directamente
			emitDirect(event);
		} else {
			// En el cliente, usar HTTP
			logger.info('🚀 Emitiendo evento (cliente HTTP):', eventLogPreview(event));
			const response = await globalThis.fetch('/api/events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(event),
			});

			if (!response.ok) {
				logger.warn('❌ Error al emitir evento:', response.statusText);
			}
		}
	} catch (error) {
		logger.warn('❌ Error al emitir evento:', error);
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

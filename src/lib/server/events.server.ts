'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { ProcessStatus } from '@/types/process';
import { revalidatePath } from '@/lib/server/revalidate';

const eventsLogger = serverLogger.withContext('ServerEvents');

// Mapa de rutas a revalidar por tipo de evento
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

/**
 * Emite un evento y revalida las rutas necesarias
 */
export async function emit(event: EventData) {
	eventsLogger.info('🚀 Emitiendo evento:', event);

	// Revalidar rutas asociadas al tipo de evento
	const paths = EVENT_PATHS[event.type];
	if (paths) {
		for (const path of paths) {
			revalidatePath(path);
		}
	}
}

/**
 * Emite un evento de progreso
 */
export async function emitProgress(status: ProcessStatus) {
	// Asegurarse de que timestamp esté presente
	const statusWithTimestamp = {
		...status,
		timestamp: status.timestamp || Date.now(),
	};

	// Emitir el evento
	await emit({
		type: 'folder:progress',
		data: statusWithTimestamp,
	});
}

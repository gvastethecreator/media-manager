'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import type { ProcessStatus } from '@/types/process';
import { revalidatePath } from 'next/cache';

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
	| 'uploaded-images:changed';

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

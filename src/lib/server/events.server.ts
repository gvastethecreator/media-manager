'use server';

import { logger } from '@/lib/logger';
import type { ProcessStatus } from '@/types/process';
import { revalidatePath } from 'next/cache';

const eventsLogger = logger.withContext('ServerEvents');

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
	'characters:modified': ['/characters'],
	'places:modified': ['/places'],
	'objects:modified': ['/objects'],
	'favorites:modified': ['/favorites'],
	'images:modified': ['/images'],
	'files:modified': ['/files'],
	'folders:modified': ['/folders'],
	'folder:progress': ['/folders'],
	'folder:error': ['/folders'],
	'folder:complete': ['/folders'],
	'folder:stats': ['/folders'],
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
	| 'characters:modified'
	| 'places:modified'
	| 'objects:modified'
	| 'favorites:modified'
	| 'images:modified'
	| 'files:modified'
	| 'folders:modified'
	| 'folder:progress'
	| 'folder:error'
	| 'folder:complete'
	| 'folder:stats'
	| 'uploaded-image:created'
	| 'uploaded-image:updated'
	| 'uploaded-image:deleted'
	| 'uploaded-images:changed';

export interface EventData<T = unknown> {
	type: EventType;
	id?: string;
	objectId?: string;
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

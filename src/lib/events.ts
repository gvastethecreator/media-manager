import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { useOptimistic } from 'react';

const eventsLogger = logger.withContext('Events');

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
	| 'folder:stats';

export interface EventData<T = unknown> {
	type: EventType;
	id?: string;
	objectId?: string;
	imageId?: string;
	data?: T;
}

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
};

/**
 * Hook para manejar eventos optimistas
 * @param initialState Estado inicial
 * @returns [state, addEvent] - Estado actual y función para añadir eventos
 */
export function useEvents<T>(initialState: T) {
	return useOptimistic<T, EventData>(initialState, (state, event) => {
		eventsLogger.info('📨 Evento recibido:', event);
		return state;
	});
}

/**
 * Server Action para emitir eventos
 * @param event Evento a emitir
 */
export async function emitEvent(event: EventData) {
	'use server';

	eventsLogger.info('🚀 Emitiendo evento:', event);

	// Revalidar rutas asociadas al tipo de evento
	const paths = EVENT_PATHS[event.type];
	if (paths) {
		for (const path of paths) {
			revalidatePath(path);
		}
	}

	// Aquí podrías añadir lógica adicional como:
	// - Guardar el evento en base de datos
	// - Notificar a otros servicios
	// - Ejecutar acciones específicas según el tipo de evento
}

/**
 * Server Action para emitir eventos de progreso
 * @param status Estado del progreso
 */
export async function emitProgress(status: { current: number; total: number; message?: string }) {
	'use server';

	await emitEvent({
		type: 'folder:progress',
		data: status,
	});
}

// Exportamos un objeto con todas las funciones relacionadas con eventos
export const events = {
	emit: emitEvent,
	emitProgress,
	useEvents,
};

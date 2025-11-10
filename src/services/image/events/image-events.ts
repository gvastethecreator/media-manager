/**
 * @file Sistema de eventos para el servicio de imágenes
 * @module services/image/events
 */

import type { EventType } from '@/lib/server/events.server';
import { emit } from '@/lib/server/events.server';
import { serverLogger } from '@/lib/logger/server-logger';

const SERVICE_NAME = 'ImageService';
const imageLogger = serverLogger.withContext(SERVICE_NAME);

// Definir los eventos de imágenes
export const IMAGE_EVENTS = {
	IMAGE_CREATED: 'image:created',
	IMAGE_UPDATED: 'image:updated',
	IMAGE_DELETED: 'image:deleted',
	IMAGES_CHANGED: 'images:changed',
	THUMBNAIL_GENERATED: 'image:thumbnail:generated',
	METADATA_UPDATED: 'image:metadata:updated',
	ERROR: 'image:error',
} as const;

// Mapeo de eventos internos a EventType
const EVENT_TYPE_MAPPING: Record<string, EventType> = {
	// Eventos genéricos
	error: 'folder:error',
	// Mapeos específicos
	[IMAGE_EVENTS.IMAGE_CREATED]: 'images:modified',
	[IMAGE_EVENTS.IMAGE_UPDATED]: 'images:modified',
	[IMAGE_EVENTS.IMAGE_DELETED]: 'images:modified',
	[IMAGE_EVENTS.IMAGES_CHANGED]: 'images:modified',
	[IMAGE_EVENTS.THUMBNAIL_GENERATED]: 'images:modified',
	[IMAGE_EVENTS.METADATA_UPDATED]: 'images:modified',
	[IMAGE_EVENTS.ERROR]: 'folder:error',
} as const;

/**
 * Emite un evento de imagen
 */
export async function emitImageEvent(event: string, data: unknown): Promise<void> {
	try {
		const eventType = EVENT_TYPE_MAPPING[event] || 'images:modified';
		await emit({
			type: eventType,
			data,
		});
	} catch (error) {
		imageLogger.error('Error emitiendo evento:', { event, error });
	}
}

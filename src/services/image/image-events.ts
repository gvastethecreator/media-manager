/**
 * @file Sistema de eventos para imágenes
 * @module services/image/image-events
 * @description Gestión de eventos y emisión para el servicio de imágenes
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { EventType } from '@/lib/server/events.server';
import { emit } from '@/lib/server/events.server';
import { SERVICE_NAME } from './image-utils';

/**
 * Constantes de eventos de imágenes
 */
export const IMAGE_EVENTS = {
	IMAGE_CREATED: 'image:created',
	IMAGE_UPDATED: 'image:updated',
	IMAGE_DELETED: 'image:deleted',
	IMAGES_CHANGED: 'images:changed',
	THUMBNAIL_GENERATED: 'image:thumbnail:generated',
	METADATA_UPDATED: 'image:metadata:updated',
	ERROR: 'image:error',
} as const;

/**
 * Mapeo de eventos internos a tipos de eventos del sistema
 */
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

const imageLogger = serverLogger.withContext(SERVICE_NAME);

/**
 * Emite un evento del servicio de imágenes al sistema central de eventos
 *
 * @param event - Nombre del evento a emitir
 * @param data - Datos asociados al evento
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

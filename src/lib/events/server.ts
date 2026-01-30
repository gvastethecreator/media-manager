/**
 * Archivo de compatibilidad para eventos del servidor
 * Re-exporta las funciones necesarias sin usar 'use server'
 */

import {
	type EventData,
	type EventType,
	emit as serverEmit,
	emitProgress as serverEmitProgress,
} from '../server/events.server';

// Re-exportar funciones y tipos
export const emit = serverEmit;
export const emitProgress = serverEmitProgress;
export type { EventData, EventType };

// Objeto de compatibilidad para el sistema anterior
export const serverEvents = {
	emit: (event: string | EventData, data?: unknown) => {
		// Si el primer parámetro es un string, convertirlo al formato de EventData
		if (typeof event === 'string') {
			return serverEmit({
				type: event as EventType,
				data,
			});
		}
		// Si ya es un objeto EventData, pasarlo directamente
		return serverEmit(event);
	},
	emitProgress: serverEmitProgress,
};

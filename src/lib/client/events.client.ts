'use client';

import { logger } from '@/lib/logger';
import { useOptimistic } from 'react';
import type { EventType } from '../server/events.server';
import type { EventData } from '../server/events.server';

const eventsLogger = logger.withContext('ClientEvents');

// Mapa de suscriptores de eventos
type EventCallback<T = unknown> = (data: T) => void;
const eventSubscribers = new Map<string, Set<EventCallback<unknown>>>();

/**
 * Hook para manejar eventos optimistas
 * @param initialState Estado inicial
 * @returns [state, addEvent] - Estado actual y función para añadir eventos
 */
export function useEvents<T>(initialState: T) {
	return useOptimistic<T, EventData>(initialState, (state, event) => {
		eventsLogger.info('📨 Evento recibido:', event);

		// Emitir el evento a los suscriptores
		const eventType = event.type;
		if (eventType) {
			emitToSubscribers(eventType, event.data);
		}

		return state;
	});
}

/**
 * Emite un evento a todos los suscriptores registrados
 */
function emitToSubscribers<T = unknown>(eventType: string, data: T): void {
	const subscribers = eventSubscribers.get(eventType);
	if (subscribers) {
		for (const callback of subscribers) {
			try {
				callback(data);
			} catch (error) {
				eventsLogger.error(`Error en callback para evento ${eventType}:`, error);
			}
		}
	}
}

/**
 * Registra un callback para un tipo de evento
 */
function on<T = unknown>(eventType: string, callback: EventCallback<T>): void {
	if (!eventSubscribers.has(eventType)) {
		eventSubscribers.set(eventType, new Set());
	}
	eventSubscribers.get(eventType)?.add(callback as EventCallback<unknown>);
	eventsLogger.debug(`Suscripción registrada para evento: ${eventType}`);
}

/**
 * Elimina un callback para un tipo de evento
 */
function off<T = unknown>(eventType: string, callback: EventCallback<T>): void {
	const subscribers = eventSubscribers.get(eventType);
	if (subscribers) {
		subscribers.delete(callback as EventCallback<unknown>);
		eventsLogger.debug(`Suscripción eliminada para evento: ${eventType}`);
	}
}

export const clientEvents = {
	useEvents,
	on,
	off,
	emit: emitToSubscribers,
};

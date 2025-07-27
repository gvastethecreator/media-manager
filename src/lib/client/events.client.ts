'use client';

import { useCallback, useEffect, useState } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';
import type { EventData } from '../server/events.server';

const eventsLogger = clientLogger.withContext('ClientEvents');

// Mapa de suscriptores de eventos
type EventCallback<T = unknown> = (data: T) => void;
const eventSubscribers = new Map<string, Set<EventCallback<unknown>>>();

/**
 * Hook para manejar eventos - MIGRADO PARA VITE
 * Reemplaza useOptimistic por useState simple para evitar loops infinitos
 * @param initialState Estado inicial
 * @returns [state, addEvent] - Estado actual y función para añadir eventos
 */
export function useEvents<T>(initialState: T) {
	const [state, setState] = useState<T>(initialState);

	// ✅ Sincronizar con el estado real cuando initialState cambia
	// Usar JSON.stringify para comparar contenido, no referencia
	useEffect(() => {
		const currentStateStr = JSON.stringify(state);
		const newStateStr = JSON.stringify(initialState);

		if (currentStateStr !== newStateStr) {
			setState(initialState);
		}
	}, [initialState, state]);

	const addEvent = useCallback((event: EventData) => {
		eventsLogger.info('📨 Evento recibido (MOCK):', event);

		// Emitir el evento a los suscriptores
		const eventType = event.type;
		if (eventType) {
			emitToSubscribers(eventType, event.data);
		}

		// En lugar de useOptimistic, simplemente mantenemos el estado actual
		// En una implementación real, aquí aplicaríamos los cambios optimistas
		eventsLogger.debug('Estado mantenido sin cambios optimistas');
	}, []);

	return [state, addEvent] as const;
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

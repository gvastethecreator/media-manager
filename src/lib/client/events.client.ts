'use client';

import { logger } from '@/lib/logger';
import { useOptimistic } from 'react';
import type { EventData } from '../server/events.server';

const eventsLogger = logger.withContext('ClientEvents');

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

export const clientEvents = {
	useEvents,
};

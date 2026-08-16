'use client';

/**
 * @file Gestor de eventos del servidor
 * @module utils/server-events
 */

import { clientEvents } from '@/lib/events/client';

type EventCallback<T = unknown> = (data: T) => void;

interface EventSubscription {
	callback: EventCallback;
	type: string;
}

/**
 * Suscribe a un evento del servidor
 * @param subscription Configuración de la suscripción
 * @returns Función para cancelar la suscripción
 */
export function subscribe<T = unknown>(subscription: EventSubscription): () => void {
	const { type, callback } = subscription;

	// Registrar el callback con el sistema de eventos del cliente
	clientEvents.on<T>(type, callback as EventCallback<T>);

	// Devolver función para cancelar suscripción
	return () => {
		clientEvents.off<T>(type, callback as EventCallback<T>);
	};
}

/**
 * Emite un evento a todos los suscriptores
 * @param type Tipo de evento
 * @param data Datos del evento
 */
export function emit<T = unknown>(type: string, data: T): void {
	clientEvents.emit(type, data);
}

// Namespace para mantener la compatibilidad con código existente que usa ServerEventManager
export const ServerEventManager = {
	subscribe,
	emit,
};

/**
 * @file Servicio de Tag con enfoque funcional
 * @module services/tag
 * @description Implementación funcional del servicio de etiquetas
 */

import type { ErrorResponse } from '@/app/actions/folders';
import {
    createTag as createTagAction,
    deleteTag as deleteTagAction,
    getTags as getTagsAction,
    updateTag as updateTagAction,
} from '@/app/actions/tags';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import type { TagCreateInput, TagUpdateInput, TagWithStats } from '@/types/entities/tag';

// Logger específico para el servicio de etiquetas
const tagLogger = serverLogger.withContext('TagService');

// Eventos que puede emitir el servicio de etiquetas
export enum TAG_EVENTS {
	CREATED = 'tag:created',
	UPDATED = 'tag:updated',
	DELETED = 'tag:deleted',
	ERROR = 'tag:error',
	STATS = 'tag:stats',
}

// Tipos para callbacks
type TagCallback = (tag: TagWithStats) => void;
type TagsCallback = (tags: TagWithStats[]) => void;
type ErrorCallback = (error: ErrorResponse) => void;

// Estado interno del servicio
const state = {
	operationsInProgress: new Map<string, Promise<any>>(),
	eventCallbacks: new Map<string, Set<Function>>(),
};

/**
 * Implementa control de concurrencia para evitar operaciones duplicadas
 * @param operationKey Clave única para la operación
 * @param operation Función a ejecutar
 * @returns Resultado de la operación
 */
const withConcurrencyControl = async <T>(operationKey: string, operation: () => Promise<T>): Promise<T> => {
	// Si ya hay una operación en progreso con la misma clave, esperar a que termine
	const existingOperation = state.operationsInProgress.get(operationKey);
	if (existingOperation) {
		tagLogger.debug(`⏳ Esperando operación en progreso: ${operationKey}`);
		return existingOperation;
	}

	// Ejecutar la operación y manejar el estado
	const operationPromise = operation()
		.finally(() => {
			// Limpiar del estado cuando termine (éxito o error)
			state.operationsInProgress.delete(operationKey);
		});

	// Guardar la promesa en el estado
	state.operationsInProgress.set(operationKey, operationPromise);

	return operationPromise;
};

/**
 * Emite un evento a todos los callbacks registrados y al sistema central
 * @param event Nombre del evento
 * @param args Argumentos a pasar al callback
 */
const emitEvent = async (event: string, ...args: unknown[]): Promise<void> => {
	try {
		// Obtener los callbacks para este evento
		const callbacks = state.eventCallbacks.get(event);
		if (callbacks && callbacks.size > 0) {
			// Invocar cada callback
			for (const callback of callbacks) {
				try {
					if (typeof callback === 'function') {
						await callback(...args);
					}
				} catch (error) {
					tagLogger.error(`Error en callback de evento ${event}:`, error);
				}
			}
		}

		// Mapeo de eventos locales a eventos del sistema central
		let serverEventType: string | null = null;
		switch (event) {
			case TAG_EVENTS.CREATED:
				serverEventType = 'tags:modified';
				break;
			case TAG_EVENTS.UPDATED:
				serverEventType = 'tags:modified';
				break;
			case TAG_EVENTS.DELETED:
				serverEventType = 'tags:modified';
				break;
			case TAG_EVENTS.ERROR:
				serverEventType = 'tag:error';
				break;
			case TAG_EVENTS.STATS:
				serverEventType = 'tag:stats';
				break;
			default:
				serverEventType = null;
		}

		// Emitir al sistema central si hay mapeo
		if (serverEventType) {
			try {
				await emit({
					type: serverEventType,
					data: args[0],
				});
				tagLogger.debug(`Evento ${event} emitido al sistema central como ${serverEventType}`);
			} catch (emitError) {
				tagLogger.error(`Error al emitir evento ${event} al sistema central:`, emitError);
			}
		}
	} catch (error) {
		tagLogger.error(`Error emitiendo evento ${event}:`, error);
	}
};

/**
 * Añade un callback para un evento específico
 * @param event Nombre del evento
 * @param callback Función callback
 */
const addCallback = (event: string, callback: Function): void => {
	if (!state.eventCallbacks.has(event)) {
		state.eventCallbacks.set(event, new Set());
	}
	state.eventCallbacks.get(event)!.add(callback);
};

/**
 * Elimina un callback para un evento específico
 * @param event Nombre del evento
 * @param callback Función callback a eliminar
 */
const removeCallback = (event: string, callback: Function): void => {
	const callbacks = state.eventCallbacks.get(event);
	if (callbacks) {
		callbacks.delete(callback);
	}
};

// 🚀 Funciones públicas del servicio

/**
 * Obtiene todas las etiquetas del sistema
 * @returns Lista de etiquetas con estadísticas
 */
export const getTags = async (): Promise<TagWithStats[]> => {
	return withConcurrencyControl('getTags', async () => {
		try {
			tagLogger.info('🏷️ Obteniendo lista de etiquetas...');
			const tags = await getTagsAction();

			tagLogger.info(`✅ ${tags.length} etiquetas obtenidas`);
			await emitEvent(TAG_EVENTS.STATS, { totalTags: tags.length });
			return tags;
		} catch (error) {
			const errorResponse: ErrorResponse = {
				message: error instanceof Error ? error.message : 'Error obteniendo etiquetas',
				details: error instanceof Error ? error.stack : String(error),
				timestamp: Date.now(),
			};
			tagLogger.error('❌ Error getting tags:', errorResponse);
			await emitEvent(TAG_EVENTS.ERROR, errorResponse);
			throw errorResponse;
		}
	});
};

/**
 * Crea una nueva etiqueta
 * @param data Datos de la etiqueta a crear
 * @returns Etiqueta creada con estadísticas
 */
export const createTag = async (data: TagCreateInput): Promise<TagWithStats> => {
	return withConcurrencyControl('createTag', async () => {
		try {
			tagLogger.info('➕ Creando nueva etiqueta:', data);

			const tag = await createTagAction(data);

			if (!tag || !tag.id) {
				throw new Error('Respuesta inválida al crear etiqueta');
			}

			tagLogger.info('✅ Etiqueta creada:', tag);
			await emitEvent(TAG_EVENTS.CREATED, tag);

			return tag;
		} catch (error) {
			const errorResponse: ErrorResponse = {
				message: error instanceof Error ? error.message : 'Error creando etiqueta',
				details: error instanceof Error ? error.stack : String(error),
				timestamp: Date.now(),
			};
			tagLogger.error('❌ Error creating tag:', errorResponse);
			await emitEvent(TAG_EVENTS.ERROR, errorResponse);
			throw errorResponse;
		}
	});
};

/**
 * Actualiza una etiqueta existente
 * @param id ID de la etiqueta a actualizar
 * @param data Datos a actualizar
 * @returns Etiqueta actualizada con estadísticas
 */
export const updateTag = async (id: string, data: TagUpdateInput): Promise<TagWithStats> => {
	return withConcurrencyControl(`updateTag:${id}`, async () => {
		try {
			tagLogger.info('🔄 Actualizando etiqueta:', { id, data });

			const tag = await updateTagAction(id, data);

			if (!tag || !tag.id) {
				throw new Error('Respuesta inválida al actualizar etiqueta');
			}

			tagLogger.info('✅ Etiqueta actualizada:', tag);
			await emitEvent(TAG_EVENTS.UPDATED, tag);

			return tag;
		} catch (error) {
			const errorResponse: ErrorResponse = {
				message: error instanceof Error ? error.message : 'Error actualizando etiqueta',
				details: error instanceof Error ? error.stack : String(error),
				timestamp: Date.now(),
				tagId: id,
			};
			tagLogger.error('❌ Error updating tag:', errorResponse);
			await emitEvent(TAG_EVENTS.ERROR, errorResponse);
			throw errorResponse;
		}
	});
};

/**
 * Elimina una etiqueta existente
 * @param id ID de la etiqueta a eliminar
 */
export const deleteTag = async (id: string): Promise<void> => {
	return withConcurrencyControl(`deleteTag:${id}`, async () => {
		try {
			tagLogger.info('🗑️ Eliminando etiqueta:', id);

			await deleteTagAction(id);

			tagLogger.info('✅ Etiqueta eliminada:', id);
			await emitEvent(TAG_EVENTS.DELETED, { id });
		} catch (error) {
			const errorResponse: ErrorResponse = {
				message: error instanceof Error ? error.message : 'Error eliminando etiqueta',
				details: error instanceof Error ? error.stack : String(error),
				timestamp: Date.now(),
				tagId: id,
			};
			tagLogger.error('❌ Error deleting tag:', errorResponse);
			await emitEvent(TAG_EVENTS.ERROR, errorResponse);
			throw errorResponse;
		}
	});
};

// 🎯 Funciones de gestión de eventos

/**
 * Registra un callback para cuando se crea una etiqueta
 * @param callback Función a ejecutar cuando se cree una etiqueta
 */
export const onCreated = (callback: TagCallback): void => {
	addCallback(TAG_EVENTS.CREATED, callback);
};

/**
 * Elimina un callback para cuando se crea una etiqueta
 * @param callback Función a eliminar
 */
export const offCreated = (callback: TagCallback): void => {
	removeCallback(TAG_EVENTS.CREATED, callback);
};

/**
 * Registra un callback para cuando se actualiza una etiqueta
 * @param callback Función a ejecutar cuando se actualice una etiqueta
 */
export const onUpdated = (callback: TagCallback): void => {
	addCallback(TAG_EVENTS.UPDATED, callback);
};

/**
 * Elimina un callback para cuando se actualiza una etiqueta
 * @param callback Función a eliminar
 */
export const offUpdated = (callback: TagCallback): void => {
	removeCallback(TAG_EVENTS.UPDATED, callback);
};

/**
 * Registra un callback para cuando se elimina una etiqueta
 * @param callback Función a ejecutar cuando se elimine una etiqueta
 */
export const onDeleted = (callback: (data: { id: string }) => void): void => {
	addCallback(TAG_EVENTS.DELETED, callback);
};

/**
 * Elimina un callback para cuando se elimina una etiqueta
 * @param callback Función a eliminar
 */
export const offDeleted = (callback: (data: { id: string }) => void): void => {
	removeCallback(TAG_EVENTS.DELETED, callback);
};

/**
 * Registra un callback para errores del servicio
 * @param callback Función a ejecutar cuando ocurra un error
 */
export const onError = (callback: ErrorCallback): void => {
	addCallback(TAG_EVENTS.ERROR, callback);
};

/**
 * Elimina un callback para errores del servicio
 * @param callback Función a eliminar
 */
export const offError = (callback: ErrorCallback): void => {
	removeCallback(TAG_EVENTS.ERROR, callback);
};

/**
 * Registra un callback para estadísticas del servicio
 * @param callback Función a ejecutar cuando se actualicen las estadísticas
 */
export const onStats = (callback: (stats: { totalTags: number }) => void): void => {
	addCallback(TAG_EVENTS.STATS, callback);
};

/**
 * Elimina un callback para estadísticas del servicio
 * @param callback Función a eliminar
 */
export const offStats = (callback: (stats: { totalTags: number }) => void): void => {
	removeCallback(TAG_EVENTS.STATS, callback);
};

// 🔧 Funciones de utilidad

/**
 * Obtiene información sobre el estado actual del servicio
 * @returns Información de estado del servicio
 */
export const getServiceStatus = () => {
	return {
		operationsInProgress: state.operationsInProgress.size,
		registeredCallbacks: Array.from(state.eventCallbacks.entries()).map(([event, callbacks]) => ({
			event,
			callbackCount: callbacks.size,
		})),
	};
};

/**
 * Limpia todos los callbacks registrados (útil para testing)
 */
export const clearAllCallbacks = (): void => {
	state.eventCallbacks.clear();
	tagLogger.debug('🧹 Todos los callbacks han sido limpiados');
};

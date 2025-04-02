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
    updateTag as updateTagAction
} from '@/app/actions/tags';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { transformTag } from '@/transformers/tag';
import type { TagComplete, TagCreateInput, TagUpdateInput } from '@/types/entities/tag/types';

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

// Tipos para los callbacks
type ErrorCallback = (error: ErrorResponse) => void;
type TagCallback = (tag: TagComplete) => void;
type TagsCallback = (tags: TagComplete[]) => void;

// 📊 Estado interno del servicio
type ServiceState = {
  operationsInProgress: Map<string, boolean>;
  eventCallbacks: Map<string, Set<CallableFunction>>;
};

// Estado inicial
const state: ServiceState = {
  operationsInProgress: new Map(),
  eventCallbacks: new Map(),
};

// 🛠️ Funciones auxiliares internas

/**
 * Añade un callback para un evento específico
 * @param event Nombre del evento
 * @param callback Función a ejecutar cuando ocurra el evento
 */
const addCallback = (event: string, callback: CallableFunction): void => {
  if (!state.eventCallbacks.has(event)) {
    state.eventCallbacks.set(event, new Set());
  }
  state.eventCallbacks.get(event)?.add(callback);
  tagLogger.debug(`🎧 Callback registrado para evento ${event}`);
};

/**
 * Elimina un callback para un evento específico
 * @param event Nombre del evento
 * @param callback Función a eliminar
 */
const removeCallback = (event: string, callback: CallableFunction): void => {
  state.eventCallbacks.get(event)?.delete(callback);
  tagLogger.debug(`🛑 Callback eliminado para evento ${event}`);
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
 * Control de concurrencia para operaciones asíncronas
 * @param operation Identificador único de la operación
 * @param fn Función a ejecutar
 * @returns Resultado de la función
 */
const withConcurrencyControl = async <T>(operation: string, fn: () => Promise<T>): Promise<T> => {
  if (state.operationsInProgress.get(operation)) {
    throw new Error(`Operación ${operation} en progreso`);
  }

  state.operationsInProgress.set(operation, true);
  try {
    return await fn();
  } finally {
    state.operationsInProgress.delete(operation);
  }
};

// 🚀 Funciones públicas del servicio

/**
 * Obtiene todas las etiquetas del sistema
 * @returns Lista de etiquetas
 */
export const getTags = async () => {
  return withConcurrencyControl('getTags', async () => {
    try {
      tagLogger.info('🏷️ Obteniendo lista de etiquetas...');
      const tags = await getTagsAction();

      // Transformar los resultados usando el transformador
      const transformedTags = tags.map(transformTag);

      tagLogger.info(`✅ ${transformedTags.length} etiquetas obtenidas`);
      await emitEvent(TAG_EVENTS.STATS, { totalTags: transformedTags.length });
      return transformedTags;
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
 * @returns Etiqueta creada
 */
export const createTag = async (data: TagCreateInput) => {
  return withConcurrencyControl('createTag', async () => {
    try {
      tagLogger.info('➕ Creando nueva etiqueta:', data);

      const tag = await createTagAction(data);

      if (!tag || !tag.id) {
        throw new Error('Respuesta inválida al crear etiqueta');
      }

      // Transformar el resultado usando el transformador
      const transformedTag = transformTag(tag);

      tagLogger.info('✅ Etiqueta creada:', transformedTag);
      await emitEvent(TAG_EVENTS.CREATED, transformedTag);

      return transformedTag;
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
 * @returns Etiqueta actualizada
 */
export const updateTag = async (id: string, data: TagUpdateInput) => {
  return withConcurrencyControl(`updateTag:${id}`, async () => {
    try {
      tagLogger.info('🔄 Actualizando etiqueta:', { id, data });

      const tag = await updateTagAction(id, data);

      if (!tag || !tag.id) {
        throw new Error('Respuesta inválida al actualizar etiqueta');
      }

      // Transformar el resultado usando el transformador
      const transformedTag = transformTag(tag);

      tagLogger.info('✅ Etiqueta actualizada:', transformedTag);
      await emitEvent(TAG_EVENTS.UPDATED, transformedTag);

      return transformedTag;
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
 * @returns Etiqueta eliminada
 */
export const deleteTag = async (id: string) => {
  return withConcurrencyControl(`deleteTag:${id}`, async () => {
    try {
      tagLogger.info('🗑️ Eliminando etiqueta:', id);

      const tag = await deleteTagAction(id);

      if (!tag || !tag.id) {
        throw new Error('Respuesta inválida al eliminar etiqueta');
      }

      // Transformar el resultado usando el transformador
      const transformedTag = transformTag(tag);

      tagLogger.info('✅ Etiqueta eliminada:', transformedTag);
      await emitEvent(TAG_EVENTS.DELETED, transformedTag);

      return transformedTag;
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

// 🔄 Gestión de eventos

/**
 * Registra un callback para un evento específico
 * @param event Nombre del evento
 * @param callback Función a ejecutar cuando ocurra el evento
 */
export const on = (event: string, callback: CallableFunction): void => {
  addCallback(event, callback);
};

/**
 * Elimina un callback para un evento específico
 * @param event Nombre del evento
 * @param callback Función a eliminar
 */
export const off = (event: string, callback: CallableFunction): void => {
  removeCallback(event, callback);
};

/**
 * Elimina todos los callbacks para todos los eventos
 */
export const offAll = (): void => {
  state.eventCallbacks.clear();
  tagLogger.debug('🧹 Todos los callbacks eliminados');
};

// 📌 Helpers específicos por tipo de evento

/**
 * Registra un callback para errores
 * @param callback Función a ejecutar cuando ocurra un error
 */
export const onError = (callback: ErrorCallback): void => {
  addCallback(TAG_EVENTS.ERROR, callback);
};

/**
 * Elimina un callback para errores
 * @param callback Función a eliminar
 */
export const offError = (callback: ErrorCallback): void => {
  removeCallback(TAG_EVENTS.ERROR, callback);
};

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
export const onDeleted = (callback: TagCallback): void => {
  addCallback(TAG_EVENTS.DELETED, callback);
};

/**
 * Elimina un callback para cuando se elimina una etiqueta
 * @param callback Función a eliminar
 */
export const offDeleted = (callback: TagCallback): void => {
  removeCallback(TAG_EVENTS.DELETED, callback);
};
/**
 * @file Servicio de Folder con enfoque funcional
 * @module services/folder
 * @description Implementación funcional del servicio de carpetas
 */

import type { ErrorResponse, FolderResponse, IndexCallbacks, ProcessStatus } from '@/app/actions/folders';
import {
    createFolder as createFolderAction,
    deleteFolder as deleteFolderAction,
    getFolders as getFoldersAction,
    indexFolder as indexFolderAction,
    reindexFolder as reindexFolderAction
} from '@/app/actions/folders';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import { transformFolder } from '@/transformers/folder';
import type { FolderStats } from '@/types/entities/folder/types';

// Logger específico para el servicio de carpetas
const folderLogger = serverLogger.withContext('FolderService');

// Eventos que puede emitir el servicio de carpetas
export enum FOLDER_EVENTS {
  PROGRESS = 'folder:progress',
  ERROR = 'folder:error',
  COMPLETE = 'folder:complete',
  STATS = 'folder:stats',
  FOLDER_ADDED = 'folder:added',
  FOLDER_DELETED = 'folder:deleted',
  FOLDER_MODIFIED = 'folder:modified',
  INDEXING_START = 'folder:indexing:start',
  INDEXING_FILE = 'folder:indexing:file',
  INDEXING_ERROR = 'folder:indexing:error',
  INDEXING_COMPLETE = 'folder:indexing:complete',
  REINDEX_ALL_START = 'folder:reindexAll:start',
  REINDEX_ALL_PROGRESS = 'folder:reindexAll:progress',
  REINDEX_ALL_COMPLETE = 'folder:reindexAll:complete',
}

// Tipos para los callbacks
type ProgressCallback = (status: ProcessStatus) => void;
type ErrorCallback = (error: ErrorResponse) => void;
type CompleteCallback = (data: FolderResponse) => void;
type StatsCallback = (stats: FolderStats) => void;

// Debounce para promesas
const debounce = <T, U extends unknown[]>(fn: (...args: U) => Promise<T>, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: U): Promise<T> => {
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn(...args)
          .then(resolve)
          .catch(reject);
      }, ms);
    });
  };
};

// 📊 Estado interno del servicio
type ServiceState = {
  operationsInProgress: Map<string, boolean>;
  globalProgress: Map<string, ProcessStatus>;
  startTimes: Map<string, number>;
  eventCallbacks: Map<string, Set<CallableFunction>>;
};

// Estado inicial
const state: ServiceState = {
  operationsInProgress: new Map(),
  globalProgress: new Map(),
  startTimes: new Map(),
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
  folderLogger.debug(`🎧 Callback registrado para evento ${event}`);
};

/**
 * Elimina un callback para un evento específico
 * @param event Nombre del evento
 * @param callback Función a eliminar
 */
const removeCallback = (event: string, callback: CallableFunction): void => {
  state.eventCallbacks.get(event)?.delete(callback);
  folderLogger.debug(`🛑 Callback eliminado para evento ${event}`);
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
          folderLogger.error(`Error en callback de evento ${event}:`, error);
        }
      }
    }

    // Mapeo de eventos locales a eventos del sistema central
    let serverEventType: string | null = null;
    switch (event) {
      case FOLDER_EVENTS.PROGRESS:
        serverEventType = 'folder:progress';
        break;
      case FOLDER_EVENTS.ERROR:
        serverEventType = 'folder:error';
        break;
      case FOLDER_EVENTS.COMPLETE:
        serverEventType = 'folder:complete';
        break;
      case FOLDER_EVENTS.STATS:
        serverEventType = 'folder:stats';
        break;
      case FOLDER_EVENTS.FOLDER_ADDED:
        serverEventType = 'folders:modified';
        break;
      case FOLDER_EVENTS.FOLDER_DELETED:
        serverEventType = 'folders:modified';
        break;
      case FOLDER_EVENTS.FOLDER_MODIFIED:
        serverEventType = 'folders:modified';
        break;
      case FOLDER_EVENTS.INDEXING_START:
        serverEventType = 'folder:progress';
        break;
      case FOLDER_EVENTS.INDEXING_COMPLETE:
        serverEventType = 'folder:complete';
        break;
      case FOLDER_EVENTS.REINDEX_ALL_START:
        serverEventType = 'folder:reindexAll:start';
        break;
      case FOLDER_EVENTS.REINDEX_ALL_PROGRESS:
        serverEventType = 'folder:reindexAll:progress';
        break;
      case FOLDER_EVENTS.REINDEX_ALL_COMPLETE:
        serverEventType = 'folder:reindexAll:complete';
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
        folderLogger.debug(`Evento ${event} emitido al sistema central como ${serverEventType}`);
      } catch (emitError) {
        folderLogger.error(`Error al emitir evento ${event} al sistema central:`, emitError);
      }
    }
  } catch (error) {
    folderLogger.error(`Error emitiendo evento ${event}:`, error);
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

/**
 * Actualiza el progreso de una operación
 * @param folderId ID de la carpeta
 * @param status Estado parcial a actualizar
 */
const updateProgress = (folderId: string, status: Partial<ProcessStatus>): void => {
  try {
    // Obtener estado actual
    const currentStatus = state.globalProgress.get(folderId) || {};

    // Actualizar estado
    const updatedStatus: ProcessStatus = {
      ...currentStatus,
      ...status,
      folderId,
      timestamp: Date.now(),
    };

    // Guardar en la memoria
    state.globalProgress.set(folderId, updatedStatus);
    emitEvent(FOLDER_EVENTS.PROGRESS, updatedStatus);
  } catch (error) {
    folderLogger.error('Error actualizando progreso:', error);
  }
};

/**
 * Limpia el progreso de una operación
 * @param folderId ID de la carpeta
 */
const clearProgress = (folderId: string): void => {
  state.globalProgress.delete(folderId);
  state.startTimes.delete(folderId);
};

// 🚀 Funciones públicas del servicio

/**
 * Obtiene todas las carpetas del sistema
 * @returns Lista de carpetas
 */
export const getFolders = async () => {
  return withConcurrencyControl('getFolders', async () => {
    try {
      folderLogger.info('📂 Obteniendo lista de carpetas...');
      const folders = await getFoldersAction();

      // Transformar los resultados usando el transformador
      const transformedFolders = folders.map(transformFolder);

      folderLogger.info(`✅ ${transformedFolders.length} carpetas obtenidas`);
      await emitEvent(FOLDER_EVENTS.STATS, { totalFolders: transformedFolders.length });
      return transformedFolders;
    } catch (error) {
      const errorResponse: ErrorResponse = {
        message: error instanceof Error ? error.message : 'Error obteniendo carpetas',
        details: error instanceof Error ? error.stack : String(error),
        timestamp: Date.now(),
      };
      folderLogger.error('❌ Error getting folders:', errorResponse);
      await emitEvent(FOLDER_EVENTS.ERROR, errorResponse);
      throw errorResponse;
    }
  });
};

/**
 * Añade una nueva carpeta y comienza su indexación
 * @param path Ruta de la carpeta a añadir
 * @param callbacks Callbacks para seguimiento de la operación
 * @returns Resultado de la operación
 */
export const addFolder = async (path: string, callbacks?: IndexCallbacks) => {
  return withConcurrencyControl('addFolder', async () => {
    try {
      folderLogger.info('📁 Agregando nueva carpeta:', path);

      const folder = await createFolderAction(path);
      folderLogger.info('✅ Carpeta creada:', folder);

      if (!folder || !folder.id) {
        throw { message: 'Respuesta inválida al crear carpeta' };
      }

      // Transformar el resultado usando el transformador
      const transformedFolder = transformFolder(folder);

      // Emitir eventos
      await emitEvent(FOLDER_EVENTS.FOLDER_ADDED, transformedFolder);
      statsEventEmitter.emit(STATS_EVENTS.FOLDER_CHANGE);
      statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['FOLDER_CHANGE']);

      // Iniciar indexación
      return indexFolder(transformedFolder.id, callbacks);
    } catch (error) {
      const errorResponse: ErrorResponse = {
        message: error instanceof Error ? error.message : 'Error agregando carpeta',
        details: error instanceof Error ? error.stack : String(error),
        timestamp: Date.now(),
      };
      folderLogger.error('❌ Error adding folder:', errorResponse);
      await emitEvent(FOLDER_EVENTS.ERROR, errorResponse);
      throw errorResponse;
    }
  });
};

/**
 * Inicia la indexación de una carpeta
 * @param id ID de la carpeta
 * @param callbacks Callbacks para seguimiento de la operación
 * @returns Resultado de la operación
 */
export const indexFolder = async (id: string, callbacks?: IndexCallbacks) => {
  return withConcurrencyControl(`indexFolder:${id}`, async () => {
    try {
      folderLogger.info('📊 Iniciando indexación de carpeta:', id);

      // Registrar callbacks si se proporcionaron
      if (callbacks?.onProgress) {
        addCallback(FOLDER_EVENTS.PROGRESS, callbacks.onProgress);
      }
      if (callbacks?.onError) {
        addCallback(FOLDER_EVENTS.ERROR, callbacks.onError);
      }
      if (callbacks?.onComplete) {
        addCallback(FOLDER_EVENTS.COMPLETE, callbacks.onComplete);
      }

      // Iniciar tiempo de operación
      state.startTimes.set(id, Date.now());

      // Notificar inicio
      updateProgress(id, {
        status: 'Iniciando indexación',
        progress: 0,
        phase: 'prepare',
        filesProcessed: 0,
        totalFiles: 0,
        startTime: state.startTimes.get(id) || Date.now(),
      });

      await emitEvent(FOLDER_EVENTS.INDEXING_START, { folderId: id });

      // Llamar a la acción de indexación
      const result = await indexFolderAction(id, {
        onProgress: (status: ProcessStatus) => updateProgress(id, status),
      });

      // Limpiar callbacks
      if (callbacks?.onProgress) {
        removeCallback(FOLDER_EVENTS.PROGRESS, callbacks.onProgress);
      }
      if (callbacks?.onError) {
        removeCallback(FOLDER_EVENTS.ERROR, callbacks.onError);
      }
      if (callbacks?.onComplete) {
        removeCallback(FOLDER_EVENTS.COMPLETE, callbacks.onComplete);
      }

      // Notificar finalización
      await emitEvent(FOLDER_EVENTS.INDEXING_COMPLETE, result);
      clearProgress(id);

      return result;
    } catch (error) {
      const errorResponse: ErrorResponse = {
        message: error instanceof Error ? error.message : 'Error indexando carpeta',
        details: error instanceof Error ? error.stack : String(error),
        timestamp: Date.now(),
        folderId: id,
      };
      folderLogger.error('❌ Error indexing folder:', errorResponse);
      await emitEvent(FOLDER_EVENTS.ERROR, errorResponse);

      // Limpiar callbacks específicos
      if (callbacks?.onProgress) {
        removeCallback(FOLDER_EVENTS.PROGRESS, callbacks.onProgress);
      }
      if (callbacks?.onError) {
        removeCallback(FOLDER_EVENTS.ERROR, callbacks.onError);
      }
      if (callbacks?.onComplete) {
        removeCallback(FOLDER_EVENTS.COMPLETE, callbacks.onComplete);
      }

      throw errorResponse;
    }
  });
};

/**
 * Reindexación de una carpeta
 * @param id ID de la carpeta a reindexar
 * @param callbacks Callbacks para seguimiento de la operación
 * @returns Resultado de la operación
 */
export const reindexFolder = async (id: string, callbacks?: IndexCallbacks) => {
  return withConcurrencyControl(`reindexFolder:${id}`, async () => {
    try {
      folderLogger.info('🔄 Iniciando reindexación de carpeta:', id);

      // Registrar callbacks si se proporcionaron
      if (callbacks?.onProgress) {
        addCallback(FOLDER_EVENTS.PROGRESS, callbacks.onProgress);
      }
      if (callbacks?.onError) {
        addCallback(FOLDER_EVENTS.ERROR, callbacks.onError);
      }
      if (callbacks?.onComplete) {
        addCallback(FOLDER_EVENTS.COMPLETE, callbacks.onComplete);
      }

      // Iniciar tiempo de operación
      state.startTimes.set(id, Date.now());

      // Notificar inicio
      updateProgress(id, {
        status: 'Iniciando reindexación',
        progress: 0,
        phase: 'prepare',
        filesProcessed: 0,
        totalFiles: 0,
        startTime: state.startTimes.get(id) || Date.now(),
      });

      // Llamar a la acción de reindexación
      const result = await reindexFolderAction(id, {
        onProgress: (status: ProcessStatus) => updateProgress(id, status),
      });

      // Limpiar callbacks
      if (callbacks?.onProgress) {
        removeCallback(FOLDER_EVENTS.PROGRESS, callbacks.onProgress);
      }
      if (callbacks?.onError) {
        removeCallback(FOLDER_EVENTS.ERROR, callbacks.onError);
      }
      if (callbacks?.onComplete) {
        removeCallback(FOLDER_EVENTS.COMPLETE, callbacks.onComplete);
      }

      // Notificar finalización
      if (result.success) {
        const finalStatus: ProcessStatus = {
          status: 'Reindexación completada',
          progress: 100,
          folderId: id,
          phase: 'metadata',
          filesProcessed: result.totalFiles || 0,
          totalFiles: result.totalFiles || 0,
          startTime: state.startTimes.get(id) || 0,
          endTime: Date.now(),
        };

        emitEvent(FOLDER_EVENTS.PROGRESS, finalStatus);
        emitEvent(FOLDER_EVENTS.COMPLETE, {
          id: result.id,
          name: result.name || '',
          path: result.path || '',
          totalFiles: result.totalFiles || 0,
          totalSize: result.totalSize || 0,
          lastIndexed: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          autoReindex: false,
          stats: {
            processed: result.totalFiles || 0,
            total: result.totalFiles || 0,
            totalSize: result.totalSize || 0,
          },
        });

        await emit({
          type: 'files:modified',
          data: { action: 'reindex', folderId: id },
        });

        await emit({
          type: 'folders:modified',
          data: {
            action: 'reindex',
            folder: {
              id: result.id,
              name: result.name || '',
              path: result.path || '',
              totalFiles: result.totalFiles || 0,
              totalSize: result.totalSize || 0,
              lastIndexed: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              autoReindex: false,
            },
          },
        });

        clearProgress(id);
        return result;
      }

      // Si hay un error en el resultado
      throw new Error(result.error || 'Error desconocido');
    } catch (error) {
      const errorResponse: ErrorResponse = {
        message: error instanceof Error ? error.message : 'Error reindexando carpeta',
        details: error instanceof Error ? error.stack : String(error),
        timestamp: Date.now(),
        folderId: id,
      };
      folderLogger.error('❌ Error reindexing folder:', errorResponse);
      await emitEvent(FOLDER_EVENTS.ERROR, errorResponse);

      // Limpiar callbacks específicos
      if (callbacks?.onProgress) {
        removeCallback(FOLDER_EVENTS.PROGRESS, callbacks.onProgress);
      }
      if (callbacks?.onError) {
        removeCallback(FOLDER_EVENTS.ERROR, callbacks.onError);
      }
      if (callbacks?.onComplete) {
        removeCallback(FOLDER_EVENTS.COMPLETE, callbacks.onComplete);
      }

      throw errorResponse;
    }
  });
};

/**
 * Elimina una carpeta
 * @param id ID de la carpeta a eliminar
 * @returns Resultado de la operación
 */
export const deleteFolder = async (id: string) => {
  return withConcurrencyControl(`deleteFolder:${id}`, async () => {
    try {
      folderLogger.info('🗑️ Eliminando carpeta:', id);
      await deleteFolderAction(id);

      // Emitir eventos
      await emitEvent(FOLDER_EVENTS.FOLDER_DELETED, { id });
      await emit({
        type: 'files:modified',
        data: { action: 'delete', folderId: id },
      });
      await emit({
        type: 'folders:modified',
        data: { action: 'delete', folder: { id } },
      });
      statsEventEmitter.emit(STATS_EVENTS.FOLDER_CHANGE);
      statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['FOLDER_CHANGE']);

      folderLogger.info('✅ Carpeta eliminada correctamente', { folderId: id });
      return { success: true, id };
    } catch (error) {
      const errorResponse: ErrorResponse = {
        message: error instanceof Error ? error.message : 'Error eliminando carpeta',
        details: error instanceof Error ? error.stack : String(error),
        timestamp: Date.now(),
      };
      folderLogger.error('❌ Error deleting folder:', errorResponse);
      await emitEvent(FOLDER_EVENTS.ERROR, errorResponse);
      throw errorResponse;
    }
  });
};

/**
 * Reindexación de todas las carpetas
 * @returns Resultado de la operación
 */
export const reindexAll = async () => {
  return withConcurrencyControl('reindexAll', async () => {
    try {
      folderLogger.info('🔄 Iniciando reindexación de todas las carpetas');

      // Obtener todas las carpetas
      const folders = await getFolders();

      // Notificar inicio
      await emitEvent(FOLDER_EVENTS.REINDEX_ALL_START, { totalFolders: folders.length });

      // Reindexar cada carpeta secuencialmente
      let completed = 0;
      const results = [];

      for (const folder of folders) {
        try {
          // Notificar progreso
          await emitEvent(FOLDER_EVENTS.REINDEX_ALL_PROGRESS, {
            current: completed + 1,
            total: folders.length,
            progress: ((completed + 1) / folders.length) * 100,
            currentFolder: {
              id: folder.id,
              name: folder.name,
            },
          });

          // Reindexar carpeta
          const result = await reindexFolder(folder.id);
          results.push({ id: folder.id, success: true, result });
        } catch (error) {
          results.push({
            id: folder.id,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
          folderLogger.error(`Error reindexando carpeta ${folder.id}:`, error);
        }

        completed++;
      }

      // Notificar finalización
      await emitEvent(FOLDER_EVENTS.REINDEX_ALL_COMPLETE, {
        totalFolders: folders.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      });

      folderLogger.info(`✅ Reindexación completa: ${results.filter(r => r.success).length}/${folders.length} carpetas`);

      return {
        success: true,
        totalFolders: folders.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      };
    } catch (error) {
      const errorResponse: ErrorResponse = {
        message: error instanceof Error ? error.message : 'Error reindexando todas las carpetas',
        details: error instanceof Error ? error.stack : String(error),
        timestamp: Date.now(),
      };
      folderLogger.error('❌ Error reindexing all folders:', errorResponse);
      await emitEvent(FOLDER_EVENTS.ERROR, errorResponse);
      throw errorResponse;
    }
  });
};

// Funciones de gestión de eventos

/**
 * Registra un callback para un evento
 * @param event Nombre del evento
 * @param callback Función a ejecutar
 */
export const on = (event: string, callback: CallableFunction): void => {
  addCallback(event, callback);
};

/**
 * Elimina un callback para un evento
 * @param event Nombre del evento
 * @param callback Función a eliminar
 */
export const off = (event: string, callback: CallableFunction): void => {
  removeCallback(event, callback);
};

/**
 * Elimina todos los callbacks registrados
 */
export const offAll = (): void => {
  state.eventCallbacks.clear();
  folderLogger.info('🧹 Limpiados todos los callbacks de eventos');
};

// Funciones específicas para eventos comunes

/**
 * Registra un callback para el evento de progreso
 * @param callback Función a ejecutar
 */
export const onProgress = (callback: ProgressCallback): void => {
  addCallback(FOLDER_EVENTS.PROGRESS, callback);
};

/**
 * Elimina un callback para el evento de progreso
 * @param callback Función a eliminar
 */
export const offProgress = (callback: ProgressCallback): void => {
  removeCallback(FOLDER_EVENTS.PROGRESS, callback);
};

/**
 * Registra un callback para el evento de error
 * @param callback Función a ejecutar
 */
export const onError = (callback: ErrorCallback): void => {
  addCallback(FOLDER_EVENTS.ERROR, callback);
};

/**
 * Elimina un callback para el evento de error
 * @param callback Función a eliminar
 */
export const offError = (callback: ErrorCallback): void => {
  removeCallback(FOLDER_EVENTS.ERROR, callback);
};

/**
 * Registra un callback para el evento de completado
 * @param callback Función a ejecutar
 */
export const onComplete = (callback: CompleteCallback): void => {
  addCallback(FOLDER_EVENTS.COMPLETE, callback);
};

/**
 * Elimina un callback para el evento de completado
 * @param callback Función a eliminar
 */
export const offComplete = (callback: CompleteCallback): void => {
  removeCallback(FOLDER_EVENTS.COMPLETE, callback);
};

/**
 * Registra un callback para el evento de estadísticas
 * @param callback Función a ejecutar
 */
export const onStats = (callback: StatsCallback): void => {
  addCallback(FOLDER_EVENTS.STATS, callback);
};

/**
 * Elimina un callback para el evento de estadísticas
 * @param callback Función a eliminar
 */
export const offStats = (callback: StatsCallback): void => {
  removeCallback(FOLDER_EVENTS.STATS, callback);
};

// Exportar todo como folderService para tener una API consistente con la versión anterior
export const folderService = {
  getFolders,
  addFolder,
  indexFolder,
  reindexFolder,
  deleteFolder,
  reindexAll,
  on,
  off,
  offAll,
  onProgress,
  offProgress,
  onError,
  offError,
  onComplete,
  offComplete,
  onStats,
  offStats,
};
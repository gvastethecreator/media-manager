import { logger } from '@/lib/logger';
import { eventsService, EventType } from '@/services/events.service';
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service';
import { EventEmitter } from 'events';
import type { ProcessStatus, ExtendedProcessStatus } from '@/types/process';
import {
  getFolders as getFoldersAction,
  createFolder as createFolderAction,
  indexFolder as indexFolderAction,
  reindexFolder as reindexFolderAction,
  deleteFolder as deleteFolderAction,
  type FolderResponse
} from '@/app/actions/folder.actions';

const folderLogger = logger.withContext('FolderService');

export interface ErrorResponse {
  message: string
  details?: string
  code?: string
  timestamp?: number
}

export interface IndexCallbacks {
  onProgress?: (status: ProcessStatus) => void
  onError?: (error: ErrorResponse) => void
  onComplete?: (data: FolderResponse) => void
}

export { type ProcessStatus, type ExtendedProcessStatus, type FolderResponse };

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
  REINDEX_ALL_START = 'folder:reindex:all:start',
  REINDEX_ALL_PROGRESS = 'folder:reindex:all:progress',
  REINDEX_ALL_COMPLETE = 'folder:reindex:all:complete'
}

// Debounce function para promesas
const debounce = <T>(fn: (...args: any[]) => Promise<T>, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: any[]): Promise<T> => {
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn(...args).then(resolve).catch(reject);
      }, ms);
    });
  };
};

class FolderServiceClass extends EventEmitter {
  private static instance: FolderServiceClass;
  private operationsInProgress = new Map<string, boolean>();
  private globalProgress = new Map<string, ProcessStatus>();
  private startTimes = new Map<string, number>();

  private constructor() {
    super();
    folderLogger.info('🚀 Inicializando FolderService');
    this.setMaxListeners(50);
  }

  static getInstance(): FolderServiceClass {
    if (!FolderServiceClass.instance) {
      FolderServiceClass.instance = new FolderServiceClass();
    }
    return FolderServiceClass.instance;
  }

  // Métodos de eventos
  onProgress(callback: (status: ProcessStatus) => void): void {
    this.on(FOLDER_EVENTS.PROGRESS, callback);
  }

  offProgress(callback: (status: ProcessStatus) => void): void {
    this.off(FOLDER_EVENTS.PROGRESS, callback);
  }

  onError(callback: (error: ErrorResponse) => void): void {
    this.on(FOLDER_EVENTS.ERROR, callback);
  }

  offError(callback: (error: ErrorResponse) => void): void {
    this.off(FOLDER_EVENTS.ERROR, callback);
  }

  onComplete(callback: (data: FolderResponse) => void): void {
    this.on(FOLDER_EVENTS.COMPLETE, callback);
  }

  offComplete(callback: (data: FolderResponse) => void): void {
    this.off(FOLDER_EVENTS.COMPLETE, callback);
  }

  onStats(callback: (stats: any) => void): void {
    this.on(FOLDER_EVENTS.STATS, callback);
  }

  offStats(callback: (stats: any) => void): void {
    this.off(FOLDER_EVENTS.STATS, callback);
  }

  // Control de concurrencia mejorado
  private async withConcurrencyControl<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    if (this.operationsInProgress.get(operation)) {
      throw new Error(`Operación ${operation} en progreso`);
    }

    this.operationsInProgress.set(operation, true);
    try {
      return await fn();
    } finally {
      this.operationsInProgress.delete(operation);
    }
  }

  // Métodos públicos
  async getFolders() {
    return this.withConcurrencyControl('getFolders', async () => {
      try {
        folderLogger.info('📂 Obteniendo lista de carpetas...');
        const folders = await getFoldersAction();

        folderLogger.info(`✅ ${folders.length} carpetas obtenidas`);
        this.emit(FOLDER_EVENTS.STATS, { totalFolders: folders.length });
        return folders;
      } catch (error) {
        const errorResponse: ErrorResponse = {
          message: error instanceof Error ? error.message : 'Error obteniendo carpetas',
          details: error instanceof Error ? error.stack : String(error),
          timestamp: Date.now()
        };
        folderLogger.error('❌ Error getting folders:', errorResponse);
        this.emit(FOLDER_EVENTS.ERROR, errorResponse);
        throw errorResponse;
      }
    });
  }

  async addFolder(path: string, callbacks?: IndexCallbacks) {
    return this.withConcurrencyControl('addFolder', async () => {
      try {
        folderLogger.info('📁 Agregando nueva carpeta:', path);

        const folder = await createFolderAction(path);
        folderLogger.info('✅ Carpeta creada:', folder);

        if (!folder || !folder.id) {
          throw { message: 'Respuesta inválida al crear carpeta' };
        }

        // Emitir eventos
        this.emit(FOLDER_EVENTS.FOLDER_ADDED, folder);
        eventsService.emit('folders:modified' as EventType);
        statsEventEmitter.emit(STATS_EVENTS.FOLDER_CHANGE);
        statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['FOLDER_CHANGE']);

        // Iniciar indexación
        return this.indexFolder(folder.id, callbacks);
      } catch (error) {
        const errorResponse: ErrorResponse = {
          message: error instanceof Error ? error.message : 'Error agregando carpeta',
          details: error instanceof Error ? error.stack : String(error),
          timestamp: Date.now()
        };
        folderLogger.error('❌ Error adding folder:', errorResponse);
        this.emit(FOLDER_EVENTS.ERROR, errorResponse);
        throw errorResponse;
      }
    });
  }

  private updateProgress(folderId: string, status: Partial<ProcessStatus>) {
    const currentProgress = this.globalProgress.get(folderId) || {}
    const startTime = this.startTimes.get(folderId) || Date.now()

    const updatedStatus: ProcessStatus = {
      ...currentProgress,
      ...status,
      timestamp: Date.now(),
      startTime,
    }

    // Calcular métricas adicionales
    if (updatedStatus.filesProcessed && updatedStatus.totalFiles) {
      const elapsedTime = (Date.now() - startTime) / 1000 // en segundos
      updatedStatus.processingSpeed = updatedStatus.filesProcessed / elapsedTime

      const remainingFiles = updatedStatus.totalFiles - updatedStatus.filesProcessed
      updatedStatus.estimatedTimeRemaining = remainingFiles / updatedStatus.processingSpeed
    }

    this.globalProgress.set(folderId, updatedStatus)
    this.emit(FOLDER_EVENTS.PROGRESS, updatedStatus)
  }

  private clearProgress(folderId: string) {
    this.globalProgress.delete(folderId)
    this.startTimes.delete(folderId)
  }

  async indexFolder(id: string, callbacks?: IndexCallbacks) {
    return this.withConcurrencyControl(`indexFolder:${id}`, async () => {
      try {
        this.startTimes.set(id, Date.now())

        const initialStatus: ProcessStatus = {
          status: 'Iniciando indexación...',
          progress: 0,
          current: 0,
          total: 0,
          folderId: id,
          phase: 'scanning',
          startTime: Date.now()
        }

        this.emit(FOLDER_EVENTS.INDEXING_START, initialStatus)
        this.updateProgress(id, initialStatus)
        callbacks?.onProgress?.(initialStatus)

        const result = await indexFolderAction(id)

        // Emitir eventos relevantes
        this.emit(FOLDER_EVENTS.INDEXING_COMPLETE, result)
        this.emit(FOLDER_EVENTS.COMPLETE, result)
        eventsService.emit('files:modified' as EventType)
        eventsService.emit('folders:modified' as EventType)

        this.clearProgress(id)
        callbacks?.onComplete?.(result)
        return result
      } catch (error) {
        const errorResponse: ErrorResponse = {
          message: error instanceof Error ? error.message : 'Error indexando carpeta',
          details: error instanceof Error ? error.stack : String(error),
          timestamp: Date.now()
        }
        this.emit(FOLDER_EVENTS.INDEXING_ERROR, errorResponse)
        this.emit(FOLDER_EVENTS.ERROR, errorResponse)
        callbacks?.onError?.(errorResponse)
        this.clearProgress(id)
        throw errorResponse
      }
    })
  }

  async reindexFolder(id: string, callbacks?: IndexCallbacks) {
    return this.withConcurrencyControl(`reindexFolder:${id}`, async () => {
      try {
        folderLogger.info('🔄 Reindexando carpeta:', id);
        this.startTimes.set(id, Date.now());

        // Notificar inicio del proceso
        const initialStatus: ProcessStatus = {
          status: 'Iniciando reindexación...',
          progress: 0,
          current: 0,
          total: 0,
          folderId: id,
          phase: 'scanning',
          startTime: Date.now()
        };

        this.emit(FOLDER_EVENTS.PROGRESS, initialStatus);
        this.updateProgress(id, initialStatus);
        callbacks?.onProgress?.(initialStatus);

        const result = await reindexFolderAction(id);

        // Emitir eventos relevantes
        this.emit(FOLDER_EVENTS.COMPLETE, result);
        eventsService.emit('files:modified' as EventType);
        eventsService.emit('folders:modified' as EventType);

        this.clearProgress(id);
        callbacks?.onComplete?.(result);
        return result;
      } catch (error) {
        const errorResponse: ErrorResponse = {
          message: error instanceof Error ? error.message : 'Error reindexando carpeta',
          details: error instanceof Error ? error.stack : String(error),
          timestamp: Date.now()
        };
        folderLogger.error('❌ Error reindexing folder:', errorResponse);
        this.emit(FOLDER_EVENTS.ERROR, errorResponse);
        callbacks?.onError?.(errorResponse);
        this.clearProgress(id);
        throw errorResponse;
      }
    });
  }

  async deleteFolder(id: string) {
    return this.withConcurrencyControl(`deleteFolder:${id}`, async () => {
      try {
        folderLogger.info('🗑️ Eliminando carpeta:', id);
        await deleteFolderAction(id);

        // Emitir eventos
        this.emit(FOLDER_EVENTS.FOLDER_DELETED, { id });
        eventsService.emit('folders:modified' as EventType);
        eventsService.emit('files:modified' as EventType);
        statsEventEmitter.emit(STATS_EVENTS.FOLDER_CHANGE);
        statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['FOLDER_CHANGE']);

        folderLogger.info('✅ Carpeta eliminada correctamente', { folderId: id });
      } catch (error) {
        const errorResponse: ErrorResponse = {
          message: error instanceof Error ? error.message : 'Error eliminando carpeta',
          details: error instanceof Error ? error.stack : String(error),
          timestamp: Date.now()
        };
        folderLogger.error('❌ Error deleting folder:', errorResponse);
        this.emit(FOLDER_EVENTS.ERROR, errorResponse);
        throw errorResponse;
      }
    });
  }

  async reindexAll() {
    return this.withConcurrencyControl('reindexAll', async () => {
      try {
        const folders = await this.getFolders();
        const totalFolders = folders.length;

        this.emit(FOLDER_EVENTS.REINDEX_ALL_START, { totalFolders });

        let processedFolders = 0;
        const errors: Array<{ folderId: string; error: string }> = [];

        for (const folder of folders) {
          try {
            const progressStatus = {
              current: processedFolders,
              total: totalFolders,
              progress: (processedFolders / totalFolders) * 100,
              currentFolder: folder.name,
              phase: 'scanning',
              status: `Reindexando ${folder.name}...`,
              timestamp: Date.now()
            };

            this.emit(FOLDER_EVENTS.REINDEX_ALL_PROGRESS, progressStatus);

            await this.reindexFolder(folder.id, {
              onProgress: (status) => {
                const updatedStatus = {
                  ...status,
                  globalProgress: {
                    current: processedFolders,
                    total: totalFolders,
                    progress: (processedFolders / totalFolders) * 100
                  }
                };
                this.emit(FOLDER_EVENTS.PROGRESS, updatedStatus);
                this.updateProgress(folder.id, updatedStatus);
              },
              onError: (error) => {
                errors.push({
                  folderId: folder.id,
                  error: error.message
                });
              }
            });

            processedFolders++;
          } catch (error) {
            errors.push({
              folderId: folder.id,
              error: error instanceof Error ? error.message : 'Error desconocido'
            });
          }
        }

        const completionStatus = {
          processedFolders,
          totalFolders,
          errors,
          progress: 100,
          status: errors.length > 0 ? 'Completado con errores' : 'Completado exitosamente',
          timestamp: Date.now()
        };

        this.emit(FOLDER_EVENTS.REINDEX_ALL_COMPLETE, completionStatus);

        return {
          success: processedFolders === totalFolders,
          processedFolders,
          totalFolders,
          errors
        };
      } catch (error) {
        const errorResponse: ErrorResponse = {
          message: error instanceof Error ? error.message : 'Error reindexando todas las carpetas',
          details: error instanceof Error ? error.stack : String(error),
          timestamp: Date.now()
        };
        this.emit(FOLDER_EVENTS.ERROR, errorResponse);
        throw errorResponse;
      }
    });
  }
}

// Instancia singleton
export const folderService = FolderServiceClass.getInstance();

// Versión con debounce de getFolders
export const getFolders = debounce(() => folderService.getFolders(), 300);

import { logger } from '@/lib/logger';
import { eventsService } from '@/services/events.service';
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service';
import { EventEmitter } from 'events';

const folderLogger = logger.withContext('FolderService');
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export enum FOLDER_EVENTS {
  PROGRESS = 'folder:progress',
  ERROR = 'folder:error',
  COMPLETE = 'folder:complete',
  STATS = 'folder:stats',
  FOLDER_ADDED = 'folder:added',
  FOLDER_DELETED = 'folder:deleted',
  FOLDER_MODIFIED = 'folder:modified'
}

export interface ProcessStatus {
  status?: string
  current?: number
  total?: number
  progress?: number
  currentFile?: string
  timestamp?: number
  folderId?: string
}

export interface ErrorResponse {
  message: string
  details?: string
  code?: string
  timestamp?: number
}

export interface FolderResponse {
  folder: {
    id: string
    name: string
    path: string
    totalFiles?: number
    totalSize?: number
    lastIndexed?: string | null
    createdAt?: string
    updatedAt?: string
  }
  stats?: {
    processed: number
    total: number
    totalSize?: number
  }
  timestamp?: number
}

export interface IndexCallbacks {
  onProgress?: (status: ProcessStatus) => void
  onError?: (error: ErrorResponse) => void
  onComplete?: (data: FolderResponse) => void
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

  private getFullUrl(path: string): string {
    return `${BASE_URL}${path}`;
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
        const response = await fetch(this.getFullUrl('/api/folders'));

        if (!response.ok) {
          const data = await response.json();
          throw { message: data.error || 'Error obteniendo carpetas', details: data.details };
        }

        const folders = await response.json();
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

        const response = await fetch(this.getFullUrl('/api/folders'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ path })
        });

        if (!response.ok) {
          const data = await response.json();
          throw { message: data.error || 'Error creando carpeta', details: data.details };
        }

        const folder = await response.json();
        folderLogger.info('✅ Carpeta creada:', folder);

        if (!folder || !folder.id) {
          throw { message: 'Respuesta inválida al crear carpeta' };
        }

        // Emitir eventos
        this.emit(FOLDER_EVENTS.FOLDER_ADDED, folder);
        eventsService.emit('folders:modified');
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

  async indexFolder(id: string, callbacks?: IndexCallbacks) {
    return this.withConcurrencyControl(`indexFolder:${id}`, async () => {
      try {
        folderLogger.info('🔄 Iniciando indexación de carpeta:', id);

        // Notificar inicio del proceso
        const initialStatus: ProcessStatus = {
          status: 'Iniciando indexación...',
          progress: 0,
          current: 0,
          total: 0,
          folderId: id
        };

        this.emit(FOLDER_EVENTS.PROGRESS, initialStatus);
        callbacks?.onProgress?.(initialStatus);

        const response = await fetch(this.getFullUrl(`/api/folders/${id}/index`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error en la indexación');
        }

        const result = await response.json();

        // Emitir eventos relevantes
        this.emit(FOLDER_EVENTS.COMPLETE, result);
        eventsService.emit('files:modified');
        eventsService.emit('folders:modified');

        callbacks?.onComplete?.(result);
        return result;
      } catch (error) {
        const errorResponse: ErrorResponse = {
          message: error instanceof Error ? error.message : 'Error indexando carpeta',
          details: error instanceof Error ? error.stack : String(error),
          timestamp: Date.now()
        };
        folderLogger.error('❌ Error indexing folder:', errorResponse);
        this.emit(FOLDER_EVENTS.ERROR, errorResponse);
        callbacks?.onError?.(errorResponse);
        throw errorResponse;
      }
    });
  }

  async reindexFolder(id: string, callbacks?: IndexCallbacks) {
    return this.withConcurrencyControl(`reindexFolder:${id}`, async () => {
      try {
        folderLogger.info('🔄 Reindexando carpeta:', id);

        // Notificar inicio del proceso
        const initialStatus: ProcessStatus = {
          status: 'Iniciando reindexación...',
          progress: 0,
          current: 0,
          total: 0,
          folderId: id
        };

        this.emit(FOLDER_EVENTS.PROGRESS, initialStatus);
        callbacks?.onProgress?.(initialStatus);

        const response = await fetch(this.getFullUrl(`/api/folders/reindex/${id}`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error en la reindexación');
        }

        const result = await response.json();

        // Emitir eventos relevantes
        this.emit(FOLDER_EVENTS.COMPLETE, result);
        eventsService.emit('files:modified');
        eventsService.emit('folders:modified');

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
        throw errorResponse;
      }
    });
  }

  async deleteFolder(id: string) {
    return this.withConcurrencyControl(`deleteFolder:${id}`, async () => {
      try {
        folderLogger.info('🗑️ Eliminando carpeta:', id);
        const response = await fetch(this.getFullUrl(`/api/folders/${id}`), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          const data = await response.json();
          throw { message: data.error || 'Error eliminando carpeta', details: data.details };
        }

        // Emitir eventos
        this.emit(FOLDER_EVENTS.FOLDER_DELETED, { id });
        eventsService.emit('folders:modified');
        eventsService.emit('files:modified');
        statsEventEmitter.emit(STATS_EVENTS.FOLDER_CHANGE);
        statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['FOLDER_CHANGE']);

        folderLogger.info('✅ Carpeta eliminada correctamente', { folderId: id });
        return response.json();
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
}

// Instancia singleton
export const folderService = FolderServiceClass.getInstance();

// Versión con debounce de getFolders
export const getFolders = debounce(() => folderService.getFolders(), 300);

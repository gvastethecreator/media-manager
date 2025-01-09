import { logger } from '@/lib/logger';
import { eventsService } from '@/services/events.service';

const folderLogger = logger.withContext('FolderService');
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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

// Cache para operaciones en curso
const operationsInProgress = new Map<string, boolean>();

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
    isWatched?: boolean
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

function getFullUrl(path: string): string {
  return `${BASE_URL}${path}`;
}

// Función para manejar operaciones concurrentes
function withConcurrencyControl<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  if (operationsInProgress.get(operation)) {
    throw new Error(`Operación ${operation} en progreso`);
  }

  operationsInProgress.set(operation, true);
  return fn().finally(() => {
    operationsInProgress.delete(operation);
  });
}

// Función getFolders sin debounce
async function getFoldersBase() {
  return withConcurrencyControl('getFolders', async () => {
    try {
      folderLogger.info('📂 Obteniendo lista de carpetas...');
      const response = await fetch(getFullUrl('/api/folders'));
      if (!response.ok) {
        const data = await response.json();
        throw { message: data.error || 'Error obteniendo carpetas', details: data.details };
      }
      const folders = await response.json();
      folderLogger.info(`✅ ${folders.length} carpetas obtenidas`);
      return folders;
    } catch (error) {
      const errorResponse: ErrorResponse = {
        message: error instanceof Error ? error.message : 'Error obteniendo carpetas',
        details: error instanceof Error ? error.stack : String(error),
        timestamp: Date.now()
      };
      folderLogger.error('❌ Error getting folders:', errorResponse);
      throw errorResponse;
    }
  });
}

// Versión con debounce
export const getFolders = debounce(() => getFoldersBase(), 300);

export async function addFolder(path: string, callbacks?: IndexCallbacks) {
  return withConcurrencyControl('addFolder', async () => {
    try {
      folderLogger.info('📁 Agregando nueva carpeta:', path);

      const response = await fetch(getFullUrl('/api/folders'), {
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

      // Emitir evento de carpeta agregada
      eventsService.emit('folders:added');

      // Iniciar indexación
      return indexFolder(folder.id, callbacks);
    } catch (error) {
      const errorResponse: ErrorResponse = {
        message: error instanceof Error ? error.message : 'Error agregando carpeta',
        details: error instanceof Error ? error.stack : String(error),
        timestamp: Date.now()
      };
      folderLogger.error('❌ Error adding folder:', errorResponse);
      throw errorResponse;
    }
  });
}

export async function indexFolder(id: string, callbacks?: IndexCallbacks) {
  return withConcurrencyControl(`indexFolder:${id}`, async () => {
    try {
      folderLogger.info('🔄 Iniciando indexación de carpeta:', id);

      // Notificar inicio del proceso
      callbacks?.onProgress?.({
        status: 'Iniciando indexación...',
        progress: 0,
        current: 0,
        total: 0,
        folderId: id
      });

      const response = await fetch(getFullUrl(`/api/folders/${id}/index`), {
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
      callbacks?.onError?.(errorResponse);
      throw errorResponse;
    }
  });
}

export async function reindexFolder(id: string, callbacks?: IndexCallbacks) {
  return withConcurrencyControl(`reindexFolder:${id}`, async () => {
    try {
      folderLogger.info('🔄 Reindexando carpeta:', id);

      // Notificar inicio del proceso
      callbacks?.onProgress?.({
        status: 'Iniciando reindexación...',
        progress: 0,
        current: 0,
        total: 0,
        folderId: id
      });

      const response = await fetch(getFullUrl(`/api/folders/reindex/${id}`), {
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
      callbacks?.onError?.(errorResponse);
      throw errorResponse;
    }
  });
}

export async function deleteFolder(id: string) {
  return withConcurrencyControl(`deleteFolder:${id}`, async () => {
    try {
      folderLogger.info('🗑️ Eliminando carpeta:', id);
      const response = await fetch(getFullUrl(`/api/folders/${id}`), {
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

      // Emitir evento de carpeta eliminada
      eventsService.emit('folders:deleted');
      eventsService.emit('files:deleted');

      folderLogger.info('✅ Carpeta eliminada correctamente', { folderId: id });
      return response.json();
    } catch (error) {
      const errorResponse: ErrorResponse = {
        message: error instanceof Error ? error.message : 'Error eliminando carpeta',
        details: error instanceof Error ? error.stack : String(error),
        timestamp: Date.now()
      };
      folderLogger.error('❌ Error deleting folder:', errorResponse);
      throw errorResponse;
    }
  });
}

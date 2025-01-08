import { logger } from '@/lib/logger';
import { EventsService } from './events.service';

const folderLogger = logger.withContext('FolderService');
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
let eventsService: EventsService;

export interface ProcessStatus {
  status?: string
  current?: number
  total?: number
  progress?: number
  currentFile?: string
}

export interface ErrorResponse {
  message?: string
  details?: string
  code?: string
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
}

export interface IndexCallbacks {
  onProgress?: (status: ProcessStatus) => void
  onError?: (error: Error | ErrorResponse) => void
  onComplete?: (data: FolderResponse) => void
}

function getFullUrl(path: string): string {
  return `${BASE_URL}${path}`;
}

export async function getFolders() {
  const response = await fetch(getFullUrl('/api/folders'));
  if (!response.ok) {
    throw new Error('Error obteniendo carpetas');
  }
  return response.json();
}

function setupEventHandlers(callbacks?: IndexCallbacks) {
  const handleProgress = (data: ProcessStatus) => {
    callbacks?.onProgress?.(data);
  };

  const handleError = (error: any) => {
    const formattedError = error instanceof Error ? error : new Error(String(error));
    callbacks?.onError?.(formattedError);
  };

  const handleComplete = (data: FolderResponse) => {
    callbacks?.onComplete?.(data);
  };

  return {
    'folder:progress': handleProgress,
    'folder:error': handleError,
    'folder:complete': handleComplete
  };
}

async function handleFolderProcess(endpoint: string, callbacks?: IndexCallbacks, context?: any): Promise<any> {
  const handlers = setupEventHandlers(callbacks);

  try {
    eventsService = new EventsService(endpoint);
    eventsService.connect();

    // Registrar handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      eventsService.on(event as any, handler);
    });

    // Esperar a que se complete el proceso
    const result = await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout - El proceso excedió el tiempo límite'));
      }, 300000); // 5 minutos

      const completeHandler = (data: any) => {
        clearTimeout(timeoutId);
        resolve(data);
      };

      const errorHandler = (error: any) => {
        clearTimeout(timeoutId);
        reject(error);
      };

      eventsService.on('complete', completeHandler);
      eventsService.on('error', errorHandler);

      // Limpiar handlers específicos
      return () => {
        clearTimeout(timeoutId);
        eventsService.off('complete', completeHandler);
        eventsService.off('error', errorHandler);
      };
    });

    return result;
  } catch (error) {
    folderLogger.error('Error en el proceso:', error);
    throw error;
  } finally {
    // Limpiar handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      eventsService.off(event as any, handler);
    });
    eventsService.disconnect();
  }
}

export async function addFolder(path: string, callbacks?: IndexCallbacks) {
  try {
    folderLogger.info('Adding new folder:', path);

    // Primero crear la carpeta
    const createResponse = await fetch(getFullUrl('/api/folders'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ path })
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(error.message || 'Error creando carpeta');
    }

    const folder = await createResponse.json();
    folderLogger.info('Folder created:', folder);

    if (!folder || !folder.id) {
      throw new Error('Respuesta inválida al crear carpeta');
    }

    // Luego iniciar el proceso de indexación con SSE
    return handleFolderProcess(`/api/folders/${folder.id}/index`, callbacks, folder);
  } catch (error) {
    folderLogger.error('Error adding folder:', error);
    throw error;
  }
}

export async function indexFolder(id: string, callbacks?: IndexCallbacks) {
  try {
    folderLogger.info('Starting folder indexing:', id);
    return handleFolderProcess(`/api/folders/${id}/index`, callbacks);
  } catch (error) {
    folderLogger.error('Error indexing folder:', error);
    throw error;
  }
}

export async function reindexFolder(id: string, callbacks?: IndexCallbacks) {
  try {
    folderLogger.info('Reindexing folder:', id);
    return handleFolderProcess(`/api/folders/${id}/index`, callbacks);
  } catch (error) {
    folderLogger.error('Error reindexing folder:', error);
    throw error;
  }
}

export async function deleteFolder(id: string) {
  try {
    folderLogger.info('Deleting folder:', id);
    const response = await fetch(getFullUrl(`/api/folders/${id}`), {
      method: 'DELETE'
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Error eliminando carpeta');
    }

    folderLogger.info('Folder deleted successfully', { folderId: id });
    return response.json();
  } catch (error) {
    folderLogger.error('Error deleting folder:', error);
    throw error;
  }
}

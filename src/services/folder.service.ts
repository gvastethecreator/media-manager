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
  message: string
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
  onError?: (error: ErrorResponse) => void
  onComplete?: (data: FolderResponse) => void
}

function getFullUrl(path: string): string {
  return `${BASE_URL}${path}`;
}

export async function getFolders() {
  try {
    const response = await fetch(getFullUrl('/api/folders'));
    if (!response.ok) {
      const data = await response.json();
      throw { message: data.error || 'Error obteniendo carpetas', details: data.details };
    }
    return response.json();
  } catch (error) {
    const errorResponse: ErrorResponse = {
      message: error instanceof Error ? error.message : 'Error obteniendo carpetas',
      details: error instanceof Error ? error.stack : String(error)
    };
    folderLogger.error('Error getting folders:', errorResponse);
    throw errorResponse;
  }
}

function setupEventHandlers(callbacks?: IndexCallbacks) {
  const handleProgress = (data: ProcessStatus) => {
    callbacks?.onProgress?.(data);
  };

  const handleError = (error: unknown) => {
    const errorResponse: ErrorResponse = {
      message: error instanceof Error ? error.message : 'Error desconocido',
      details: error instanceof Error ? error.stack : String(error)
    };
    callbacks?.onError?.(errorResponse);
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

    Object.entries(handlers).forEach(([event, handler]) => {
      eventsService.on(event as any, handler);
    });

    const result = await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject({ message: 'Timeout - El proceso excedió el tiempo límite' });
      }, 300000);

      const completeHandler = (data: any) => {
        clearTimeout(timeoutId);
        resolve(data);
      };

      const errorHandler = (error: unknown) => {
        clearTimeout(timeoutId);
        reject({
          message: error instanceof Error ? error.message : 'Error desconocido',
          details: error instanceof Error ? error.stack : String(error)
        });
      };

      eventsService.on('complete', completeHandler);
      eventsService.on('error', errorHandler);

      return () => {
        clearTimeout(timeoutId);
        eventsService.off('complete', completeHandler);
        eventsService.off('error', errorHandler);
      };
    });

    return result;
  } catch (error) {
    const errorResponse: ErrorResponse = {
      message: error instanceof Error ? error.message : 'Error en el proceso',
      details: error instanceof Error ? error.stack : String(error)
    };
    folderLogger.error('Error en el proceso:', errorResponse);
    throw errorResponse;
  } finally {
    Object.entries(handlers).forEach(([event, handler]) => {
      eventsService.off(event as any, handler);
    });
    eventsService.disconnect();
  }
}

export async function addFolder(path: string, callbacks?: IndexCallbacks) {
  try {
    folderLogger.info('Adding new folder:', path);

    const createResponse = await fetch(getFullUrl('/api/folders'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ path })
    });

    if (!createResponse.ok) {
      const data = await createResponse.json();
      throw { message: data.error || 'Error creando carpeta', details: data.details };
    }

    const folder = await createResponse.json();
    folderLogger.info('Folder created:', folder);

    if (!folder || !folder.id) {
      throw { message: 'Respuesta inválida al crear carpeta' };
    }

    return handleFolderProcess(`/api/folders/${folder.id}/index`, callbacks, folder);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      message: error instanceof Error ? error.message : 'Error agregando carpeta',
      details: error instanceof Error ? error.stack : String(error)
    };
    folderLogger.error('Error adding folder:', errorResponse);
    throw errorResponse;
  }
}

export async function indexFolder(id: string, callbacks?: IndexCallbacks) {
  try {
    folderLogger.info('Starting folder indexing:', id);
    return handleFolderProcess(`/api/folders/${id}/index`, callbacks);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      message: error instanceof Error ? error.message : 'Error indexando carpeta',
      details: error instanceof Error ? error.stack : String(error)
    };
    folderLogger.error('Error indexing folder:', errorResponse);
    throw errorResponse;
  }
}

export async function reindexFolder(id: string, callbacks?: IndexCallbacks) {
  try {
    folderLogger.info('Reindexing folder:', id);
    return handleFolderProcess(`/api/folders/${id}/index`, callbacks);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      message: error instanceof Error ? error.message : 'Error reindexando carpeta',
      details: error instanceof Error ? error.stack : String(error)
    };
    folderLogger.error('Error reindexing folder:', errorResponse);
    throw errorResponse;
  }
}

export async function deleteFolder(id: string) {
  try {
    folderLogger.info('Deleting folder:', id);
    const response = await fetch(getFullUrl(`/api/folders?id=${id}`), {
      method: 'DELETE'
    });

    if (!response.ok) {
      const data = await response.json();
      throw { message: data.error || 'Error eliminando carpeta', details: data.details };
    }

    folderLogger.info('Folder deleted successfully', { folderId: id });
    return response.json();
  } catch (error) {
    const errorResponse: ErrorResponse = {
      message: error instanceof Error ? error.message : 'Error eliminando carpeta',
      details: error instanceof Error ? error.stack : String(error)
    };
    folderLogger.error('Error deleting folder:', errorResponse);
    throw errorResponse;
  }
}

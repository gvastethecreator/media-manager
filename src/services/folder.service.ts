import { logger } from '@/lib/logger';
import { EventsService, EVENT_TYPES, EventData } from './events.service';

const folderLogger = logger.withContext('FolderService');
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
let eventsService: EventsService;

export interface ProcessStatus {
  status?: string
  current?: number
  total?: number
  progress?: number
  currentFile?: string
  timestamp?: number
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

export async function getFolders() {
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
}

function setupEventHandlers(callbacks?: IndexCallbacks) {
  const handleProgress = (event: EventData<ProcessStatus>) => {
    folderLogger.debug('📊 Progreso recibido:', event.data);
    callbacks?.onProgress?.({
      ...event.data,
      timestamp: event.timestamp
    });
  };

  const handleError = (event: EventData<ErrorResponse>) => {
    folderLogger.error('❌ Error recibido:', event.data);
    callbacks?.onError?.({
      ...event.data,
      timestamp: event.timestamp
    });
  };

  const handleComplete = (event: EventData<FolderResponse>) => {
    folderLogger.info('✅ Proceso completado:', event.data);
    callbacks?.onComplete?.({
      ...event.data,
      timestamp: event.timestamp
    });
  };

  return {
    [EVENT_TYPES.FOLDER_PROGRESS]: handleProgress,
    [EVENT_TYPES.FOLDER_ERROR]: handleError,
    [EVENT_TYPES.FOLDER_COMPLETE]: handleComplete,
    [EVENT_TYPES.PROGRESS]: handleProgress,
    [EVENT_TYPES.ERROR]: handleError,
    [EVENT_TYPES.COMPLETE]: handleComplete
  };
}

async function handleFolderProcess(endpoint: string, callbacks?: IndexCallbacks): Promise<any> {
  const handlers = setupEventHandlers(callbacks);

  try {
    folderLogger.info('🔄 Iniciando proceso de carpeta:', endpoint);
    eventsService = new EventsService(endpoint);
    eventsService.connect();

    Object.entries(handlers).forEach(([event, handler]) => {
      eventsService.on(event as EVENT_TYPES, handler);
    });

    const result = await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject({
          message: 'Timeout - El proceso excedió el tiempo límite',
          timestamp: Date.now()
        });
      }, 300000);

      const completeHandler = (event: EventData<FolderResponse>) => {
        clearTimeout(timeoutId);
        resolve(event.data);
      };

      const errorHandler = (event: EventData<ErrorResponse>) => {
        clearTimeout(timeoutId);
        reject({
          message: event.data.message || 'Error desconocido',
          details: event.data.details,
          timestamp: event.timestamp
        });
      };

      eventsService.on(EVENT_TYPES.COMPLETE, completeHandler);
      eventsService.on(EVENT_TYPES.ERROR, errorHandler);

      return () => {
        clearTimeout(timeoutId);
        eventsService.off(EVENT_TYPES.COMPLETE, completeHandler);
        eventsService.off(EVENT_TYPES.ERROR, errorHandler);
      };
    });

    return result;
  } catch (error) {
    const errorResponse: ErrorResponse = {
      message: error instanceof Error ? error.message : 'Error en el proceso',
      details: error instanceof Error ? error.stack : String(error),
      timestamp: Date.now()
    };
    folderLogger.error('❌ Error en el proceso:', errorResponse);
    throw errorResponse;
  } finally {
    Object.entries(handlers).forEach(([event, handler]) => {
      eventsService.off(event as EVENT_TYPES, handler);
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

    return handleFolderProcess(`/api/folders/${folder.id}/index`, callbacks);
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
    folderLogger.info('Reindexando carpeta:', id);
    return handleFolderProcess(`/api/folders/${id}/index`, callbacks);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      message: error instanceof Error ? error.message : 'Error reindexando carpeta',
      details: error instanceof Error ? error.stack : String(error),
      timestamp: Date.now()
    };
    folderLogger.error('❌ Error reindexing folder:', errorResponse);
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

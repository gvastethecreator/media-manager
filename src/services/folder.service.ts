import { logger } from '@/lib/logger';
import { eventService } from './events.service';

const folderLogger = logger.withContext('FolderService');
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ProcessStatus {
  status?: string
  current?: number
  total?: number
  progress?: number
  currentFile?: string
}

export interface IndexCallbacks {
  onProgress?: (status: ProcessStatus) => void
  onError?: (error: Error) => void
  onComplete?: () => void
}

export interface FolderResponse {
  id: string
  name: string
  path: string
  isWatched: boolean
  totalFiles: number
  totalSize: number
  lastIndexed: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    images: number
  }
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

  const handleComplete = () => {
    callbacks?.onComplete?.();
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
    await eventService.connect(endpoint, {
      withCredentials: true,
      heartbeatTimeout: 300000, // 5 minutos
      reconnectInterval: 1000,
      headers: {
        'Cache-Control': 'no-cache',
        'Accept': 'text/event-stream'
      }
    });

    // Registrar handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      eventService.on(event, handler);
    });

    // Esperar a que se complete el proceso
    const result = await new Promise((resolve, reject) => {
      eventService.on('complete', () => resolve(context));
      eventService.on('error', reject);
    });

    return result;
  } catch (error) {
    folderLogger.error('Error en el proceso:', error);
    throw error;
  } finally {
    // Limpiar handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      eventService.off(event, handler);
    });
    eventService.disconnect();
  }
}

export async function addFolder(path: string, callbacks?: IndexCallbacks) {
  try {
    folderLogger.info('Adding new folder:', path);

    // Primero crear la carpeta
    const createResponse = await fetch(getFullUrl('/api/folders'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path })
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(error.message || 'Error creando carpeta');
    }

    const folder = await createResponse.json();
    folderLogger.info('Folder created:', folder);

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

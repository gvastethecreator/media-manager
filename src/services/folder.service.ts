import { EventSourcePolyfill as EventSource } from 'event-source-polyfill'
import { logger } from '@/lib/logger';

// Crear una instancia específica para el servicio de carpetas
const folderLogger = logger.withContext('FolderService');

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

export async function getFolders() {
  const response = await fetch('/api/folders');
  if (!response.ok) {
    throw new Error('Error obteniendo carpetas');
  }
  return response.json();
}

export async function addFolder(path: string, callbacks?: IndexCallbacks) {
  try {
    folderLogger.info('Adding new folder:', path);

    // Primero crear la carpeta
    const createResponse = await fetch('/api/folders', {
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
    console.log('Carpeta creada:', folder);

    // Luego iniciar el proceso de indexación con SSE
    const eventSource = new EventSource(`/api/folders/${folder.id}/index?_=${Date.now()}`, {
      withCredentials: true,
      heartbeatTimeout: 300000, // 5 minutos
    });

    eventSource.onmessage = (event) => {
      try {
        if (!event.data) return;
        const data = JSON.parse(event.data);
        console.log('Evento recibido:', data);

        switch (data.type) {
          case 'progress':
            callbacks?.onProgress?.(data.data);
            break;
          case 'error':
            const error = new Error(data.data.message);
            error.name = data.data.type;
            callbacks?.onError?.(error);
            eventSource.close();
            break;
          case 'complete':
            callbacks?.onComplete?.();
            eventSource.close();
            break;
        }
      } catch (error) {
        console.error('Error procesando evento:', error);
        callbacks?.onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    };

    eventSource.onerror = (error) => {
      console.error('Error en EventSource:', error);
      eventSource.close();
      callbacks?.onError?.(new Error('Error en la conexión'));
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        eventSource.close();
        reject(new Error('Timeout esperando respuesta'));
      }, 300000); // 5 minutos

      eventSource.addEventListener('complete', (event) => {
        try {
          clearTimeout(timeout);
          const data = JSON.parse(event.data);
          resolve(data.folder);
        } catch (error) {
          reject(error);
        } finally {
          eventSource.close();
        }
      });

      eventSource.addEventListener('error', (event: any) => {
        try {
          clearTimeout(timeout);
          if (event.data) {
            const data = JSON.parse(event.data);
            reject(new Error(data.message));
          } else {
            reject(new Error('Error en la conexión'));
          }
        } catch (error) {
          reject(error);
        } finally {
          eventSource.close();
        }
      });
    });
  } catch (error) {
    folderLogger.error('Error adding folder:', error);
    throw error;
  }
}

export async function indexFolder(id: string, callbacks?: IndexCallbacks) {
  try {
    console.log('Iniciando indexación de carpeta:', id);

    const eventSource = new EventSource(`/api/folders/${id}/index?_=${Date.now()}`, {
      withCredentials: true,
      heartbeatTimeout: 300000, // 5 minutos
    });

    eventSource.onmessage = (event) => {
      try {
        if (!event.data) return;
        const data = JSON.parse(event.data);
        console.log('Evento de indexación recibido:', data);

        switch (data.type) {
          case 'progress':
            callbacks?.onProgress?.(data.data);
            break;
          case 'error':
            const error = new Error(data.data.message);
            error.name = data.data.type;
            callbacks?.onError?.(error);
            eventSource.close();
            break;
          case 'complete':
            callbacks?.onComplete?.();
            eventSource.close();
            break;
        }
      } catch (error) {
        console.error('Error procesando evento de indexación:', error);
        callbacks?.onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    };

    eventSource.onerror = (error) => {
      console.error('Error en EventSource de indexación:', error);
      eventSource.close();
      callbacks?.onError?.(new Error('Error en la conexión'));
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        eventSource.close();
        reject(new Error('Timeout esperando respuesta'));
      }, 300000); // 5 minutos

      eventSource.addEventListener('complete', (event) => {
        try {
          clearTimeout(timeout);
          const data = JSON.parse(event.data);
          resolve(data);
        } catch (error) {
          reject(error);
        } finally {
          eventSource.close();
        }
      });

      eventSource.addEventListener('error', (event: any) => {
        try {
          clearTimeout(timeout);
          if (event.data) {
            const data = JSON.parse(event.data);
            reject(new Error(data.message));
          } else {
            reject(new Error('Error en la conexión'));
          }
        } catch (error) {
          reject(error);
        } finally {
          eventSource.close();
        }
      });
    });
  } catch (error) {
    console.error('Error en indexación:', error);
    callbacks?.onError?.(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function reindexFolder(id: string, callbacks?: IndexCallbacks) {
  try {
    folderLogger.info('Reindexing folder:', id);
    return indexFolder(id, callbacks);
  } catch (error) {
    folderLogger.error('Error reindexing folder:', error);
    throw error;
  }
}

export async function deleteFolder(id: string) {
  try {
    folderLogger.info('Deleting folder:', id);
    const response = await fetch(`/api/folders/${id}`, {
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

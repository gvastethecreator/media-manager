import { EventSourcePolyfill as EventSource } from 'event-source-polyfill'

export interface ProcessStatus {
  status?: string
  currentFile?: string
  current?: number
  total?: number
  progress?: number
  folderId?: string
  pendingMetadata?: number
}

export interface IndexStats extends ProcessStatus {
  error?: string
  errors?: number
}

export interface IndexCallbacks {
  onProgress?: (stats: IndexStats) => void
  onError?: (error: Error) => void
  onComplete?: (data: IndexStats) => void
}

export interface ReindexCallbacks extends IndexCallbacks { }

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

const parseSSEData = (data: string) => {
  try {
    // Remover el prefijo "data: " si existe
    const jsonStr = data.replace(/^data: /, '');
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error parseando datos SSE:', error);
    throw new Error('Error parseando respuesta del servidor');
  }
};

const createEventSource = (url: string, options = {}): Promise<EventSource> => {
  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(url, { withCredentials: true, ...options });
    const timeout = setTimeout(() => {
      eventSource.close();
      reject(new Error('Timeout esperando conexión SSE'));
    }, 10000); // 10 segundos de timeout

    eventSource.onopen = () => {
      clearTimeout(timeout);
      resolve(eventSource);
    };

    eventSource.onerror = (error) => {
      clearTimeout(timeout);
      eventSource.close();
      reject(error);
    };
  });
};

export async function getFolders() {
  const response = await fetch('/api/folders');
  if (!response.ok) {
    throw new Error('Error obteniendo carpetas');
  }
  return response.json();
}

export async function addFolder(path: string, callbacks: IndexCallbacks) {
  try {
    const response = await fetch('/api/folders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path })
    });

    if (!response.ok) {
      const data = await response.json();
      const error = new Error(data.message || 'Error agregando carpeta');
      error.name = data.type || 'ERROR';
      throw error;
    }

    const data = await response.json();
    console.log('Respuesta al agregar carpeta:', data);

    if (!data.id) {
      throw new Error('No se recibió ID de carpeta');
    }

    // Iniciar monitoreo de eventos SSE
    const eventSource = await createEventSource(`/api/folders/reindex/${data.id}/events`);

    return new Promise((resolve, reject) => {
      const initTimeout = setTimeout(() => {
        eventSource.close();
        reject(new Error('Timeout esperando inicio de indexación'));
      }, 15000);

      eventSource.addEventListener('connected', async () => {
        clearTimeout(initTimeout);
        console.log('Stream conectado, iniciando indexación');

        try {
          const response = await fetch(`/api/folders/reindex/${data.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error iniciando indexación');
          }
        } catch (error) {
          eventSource.close();
          reject(error);
        }
      });

      eventSource.addEventListener('progress', (event) => {
        try {
          const data = parseSSEData(event.data);
          callbacks.onProgress?.(data);
        } catch (error) {
          console.error('Error procesando evento de progreso:', error);
        }
      });

      eventSource.addEventListener('error', (event) => {
        try {
          const data = parseSSEData(event.data);
          callbacks.onError?.(new Error(data.message || 'Error en indexación'));
          eventSource.close();
          reject(new Error(data.message));
        } catch (error) {
          console.error('Error procesando evento de error:', error);
          eventSource.close();
          reject(error);
        }
      });

      eventSource.addEventListener('complete', (event) => {
        try {
          const data = parseSSEData(event.data);
          callbacks.onComplete?.(data);
          eventSource.close();
          resolve(data);
        } catch (error) {
          console.error('Error procesando evento complete:', error);
          eventSource.close();
          reject(error);
        }
      });

      // Mantener conexión viva
      const heartbeat = setInterval(() => {
        if (eventSource.readyState === EventSource.CLOSED) {
          clearInterval(heartbeat);
          clearTimeout(initTimeout);
        }
      }, 30000);

      // Cleanup
      eventSource.onerror = () => {
        clearInterval(heartbeat);
        clearTimeout(initTimeout);
      };
    });
  } catch (error) {
    console.error('Error en addFolder:', error);
    callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function reindexFolder(id: string, callbacks?: ReindexCallbacks) {
  try {
    console.log('Iniciando conexión SSE para reindexación...');
    const eventSource = await createEventSource(`/api/folders/reindex/${id}/events`);

    return new Promise((resolve, reject) => {
      const initTimeout = setTimeout(() => {
        eventSource.close();
        reject(new Error('Timeout esperando inicio de reindexación'));
      }, 15000);

      eventSource.addEventListener('connected', async () => {
        clearTimeout(initTimeout);
        console.log('Stream conectado, iniciando reindexación');

        try {
          const response = await fetch(`/api/folders/reindex/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error iniciando reindexación');
          }
        } catch (error) {
          eventSource.close();
          reject(error);
        }
      });

      eventSource.addEventListener('progress', (event) => {
        try {
          const data = parseSSEData(event.data);
          callbacks?.onProgress?.(data);
        } catch (error) {
          console.error('Error procesando evento de progreso:', error);
        }
      });

      eventSource.addEventListener('error', (event) => {
        try {
          const data = parseSSEData(event.data);
          callbacks?.onError?.(new Error(data.message || 'Error en reindexación'));
          eventSource.close();
          reject(new Error(data.message));
        } catch (error) {
          console.error('Error procesando evento de error:', error);
          eventSource.close();
          reject(error);
        }
      });

      eventSource.addEventListener('complete', (event) => {
        try {
          const data = parseSSEData(event.data);
          callbacks?.onComplete?.(data);
          eventSource.close();
          resolve(data);
        } catch (error) {
          console.error('Error procesando evento complete:', error);
          eventSource.close();
          reject(error);
        }
      });

      // Mantener conexión viva
      const heartbeat = setInterval(() => {
        if (eventSource.readyState === EventSource.CLOSED) {
          clearInterval(heartbeat);
          clearTimeout(initTimeout);
        }
      }, 30000);

      // Cleanup
      eventSource.onerror = () => {
        clearInterval(heartbeat);
        clearTimeout(initTimeout);
      };
    });
  } catch (error) {
    console.error('Error en reindexFolder:', error);
    throw error;
  }
}

export async function deleteFolder(id: string) {
  const response = await fetch(`/api/folders/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error eliminando carpeta');
  }

  return response.json();
}

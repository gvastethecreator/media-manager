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
}

interface IndexCallbacks {
  onProgress?: (stats: IndexStats) => void
  onError?: (error: Error) => void
  onComplete?: (data: any) => void
}

function startIndexing(id: string, callbacks: IndexCallbacks) {
  let retryCount = 0;
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  function connect() {
    console.log('Iniciando conexión SSE para:', id);
    const eventSource = new EventSource(`/api/folders/reindex/${id}/events`, {
      withCredentials: true
    });

    eventSource.onmessage = (event) => {
      try {
        console.log('Evento SSE recibido:', event.data);
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'progress':
            if (data.data) {
              callbacks.onProgress?.(data.data);
            }
            break;
          case 'error':
            const error = new Error(data.data?.message || 'Error desconocido');
            if (data.data?.type) error.name = data.data.type;
            callbacks.onError?.(error);
            if (data.data?.type === 'FATAL_ERROR') {
              eventSource.close();
            }
            break;
          case 'complete':
            callbacks.onComplete?.(data.data);
            eventSource.close();
            break;
          case 'heartbeat':
            console.log('Heartbeat recibido');
            break;
        }
      } catch (error) {
        console.error('Error procesando evento SSE:', error);
        callbacks.onError?.(new Error('Error procesando evento'));
      }
    };

    eventSource.onerror = (error) => {
      console.error('Error en EventSource:', error);
      eventSource.close();

      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`Reintentando conexión SSE (${retryCount}/${MAX_RETRIES})...`);
        setTimeout(connect, RETRY_DELAY * retryCount);
      } else {
        callbacks.onError?.(new Error('Error en la conexión después de varios intentos'));
      }
    };

    eventSource.addEventListener('open', () => {
      console.log('Conexión SSE establecida para:', id);
      retryCount = 0;
    });

    return eventSource;
  }

  return connect();
}

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

    const data = await response.json();
    console.log('Respuesta al agregar carpeta:', data);

    if (!response.ok) {
      if (data.type === 'FOLDER_EXISTS' && data.folder?.id) {
        console.log('Carpeta existente, iniciando reindexación:', data.folder.id);
        return reindexFolder({
          id: data.folder.id,
          ...callbacks
        });
      }

      const error = new Error(data.message || 'Error agregando carpeta');
      error.name = data.type || 'ERROR';
      throw error;
    }

    if (!data.id) {
      throw new Error('No se recibió ID de carpeta');
    }

    return startIndexing(data.id, callbacks);
  } catch (error) {
    console.error('Error en addFolder:', error);
    callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function reindexFolder(id: string, callbacks?: ReindexCallbacks) {
  const MAX_RETRIES = 3;
  const INITIAL_RETRY_DELAY = 1000;
  const MAX_RETRY_DELAY = 10000;
  let retryCount = 0;

  const connectWithRetry = async (): Promise<EventSource> => {
    try {
      const eventSource = new EventSource(`/api/folders/reindex/${id}/events`);

      return new Promise((resolve, reject) => {
        const connectionTimeout = setTimeout(() => {
          eventSource.close();
          reject(new Error('Timeout esperando conexión SSE'));
        }, 10000);

        eventSource.onopen = () => {
          console.log('Conexión SSE establecida');
          clearTimeout(connectionTimeout);
          resolve(eventSource);
        };

        eventSource.onerror = async (error) => {
          console.error('Error en conexión SSE:', error);
          eventSource.close();
          clearTimeout(connectionTimeout);

          if (retryCount < MAX_RETRIES) {
            retryCount++;
            const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCount - 1), MAX_RETRY_DELAY);
            console.log(`Reintentando conexión en ${delay}ms (intento ${retryCount}/${MAX_RETRIES})`);

            try {
              const newEventSource = await new Promise(resolve =>
                setTimeout(() => resolve(connectWithRetry()), delay)
              );
              resolve(newEventSource);
            } catch (retryError) {
              reject(retryError);
            }
          } else {
            reject(new Error('Error en conexión SSE después de varios intentos'));
          }
        };
      });
    } catch (error) {
      console.error('Error creando EventSource:', error);
      throw error;
    }
  };

  try {
    console.log('Iniciando conexión SSE para reindexación...');
    const eventSource = await connectWithRetry();
    let isConnected = false;

    return new Promise((resolve, reject) => {
      eventSource.addEventListener('connected', async (event) => {
        console.log('Stream conectado, iniciando reindexación');
        isConnected = true;

        try {
          const response = await fetch(`/api/folders/reindex/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error iniciando reindexación');
          }

          console.log('Reindexación iniciada correctamente');
        } catch (error) {
          eventSource.close();
          reject(error);
        }
      });

      eventSource.addEventListener('progress', (event) => {
        try {
          const data = JSON.parse(event.data);
          callbacks?.onProgress?.(data);
        } catch (error) {
          console.error('Error procesando evento de progreso:', error);
        }
      });

      eventSource.addEventListener('error', (event) => {
        try {
          const data = JSON.parse(event.data);
          callbacks?.onError?.(data);
          eventSource.close();
          reject(new Error(data.message || 'Error en reindexación'));
        } catch (error) {
          console.error('Error procesando evento de error:', error);
          eventSource.close();
          reject(error);
        }
      });

      eventSource.addEventListener('complete', (event) => {
        try {
          const data = JSON.parse(event.data);
          callbacks?.onComplete?.(data);
          eventSource.close();
          resolve(data);
        } catch (error) {
          console.error('Error procesando evento complete:', error);
          eventSource.close();
          reject(error);
        }
      });

      eventSource.addEventListener('heartbeat', () => {
        console.log('Heartbeat recibido');
      });
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

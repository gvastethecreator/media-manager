import { ThumbnailQuality } from "./thumbnail.service"

export interface IndexStats {
  current: number
  total: number
  currentFile: string
  status: string
  progress?: number
}

export interface IndexCompleteData {
  processed: number
  total: number
  errors: number
  folder: {
    id: string
    name: string
    path: string
    errors: number
  }
}

export interface IndexOptions {
  id: string
  onProgress?: (stats: IndexStats) => void
  onError?: (error: Error) => void
  onComplete?: (data: IndexCompleteData) => void
}

export interface FolderWithStats {
  id: string
  name: string
  path: string
  totalSize: number
  lastIndexed: Date | null
  updatedAt: Date
  _count: {
    images: number
  }
}

class FolderService {
  private static instance: FolderService;
  private readonly timeout = 30000; // 30 segundos por defecto

  private constructor() {
    // Bind de métodos para mantener el contexto
    this.getFolders = this.getFolders.bind(this);
    this.addFolder = this.addFolder.bind(this);
    this.reindexFolder = this.reindexFolder.bind(this);
    this.deleteFolder = this.deleteFolder.bind(this);
  }

  public static getInstance(): FolderService {
    if (!FolderService.instance) {
      FolderService.instance = new FolderService();
    }
    return FolderService.instance;
  }

  private async fetchWithTimeout(
    input: RequestInfo | URL,
    init?: RequestInit,
    timeout = this.timeout
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  private async processSSEStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    options: {
      onProgress?: (stats: IndexStats) => void
      onError?: (error: Error) => void
      onComplete?: (data: any) => void
    }
  ) {
    const decoder = new TextDecoder();
    let buffer = '';

    const processEvent = async (eventData: string) => {
      try {
        const event = JSON.parse(eventData);
        console.log('Evento SSE recibido:', event);

        switch (event.type) {
          case 'progress':
            if (event.data) {
              options.onProgress?.({
                current: event.data.current || 0,
                total: event.data.total || 0,
                currentFile: event.data.currentFile || '',
                status: event.data.status || 'Procesando...',
                progress: event.data.progress || 0
              });
            }
            break;
          case 'error':
            const error = new Error(event.data?.message || 'Error desconocido');
            error.name = event.data?.type || 'UNKNOWN_ERROR';
            console.log('Error en el proceso:', error.message);
            options.onError?.(error);
            break;
          case 'complete':
            if (event.data) {
              options.onComplete?.(event.data);
            }
            break;
          default:
            console.warn('Tipo de evento desconocido:', event.type);
        }
      } catch (parseError) {
        console.log('Error parseando evento SSE:', parseError instanceof Error ? parseError.message : 'Error desconocido');
        options.onError?.(new Error('Error procesando evento del servidor'));
      }
    };

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          if (buffer.trim()) {
            const lines = buffer.split('\n');
            for (const line of lines) {
              if (line.trim() && line.startsWith('data: ')) {
                await processEvent(line.slice(6));
              }
            }
          }
          console.log('Stream completado');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Procesar líneas completas
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line && line.startsWith('data: ')) {
            await processEvent(line.slice(6));
          }
        }

        // Mantener el último fragmento incompleto en el buffer
        buffer = lines[lines.length - 1];
      }
    } catch (streamError) {
      console.log('Error en el stream:', streamError instanceof Error ? streamError.message : 'Error desconocido');
      options.onError?.(new Error('Error en la comunicación con el servidor'));
    } finally {
      try {
        await reader.cancel();
      } catch (cancelError) {
        console.log('Error cancelando el stream:', cancelError instanceof Error ? cancelError.message : 'Error desconocido');
      }
    }
  }

  async getFolders() {
    try {
      const response = await this.fetchWithTimeout('/api/folders');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al obtener carpetas');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getFolders:', error);
      throw error;
    }
  }

  async addFolder(path: string, options?: {
    thumbnailQuality?: ThumbnailQuality
    generateThumbnails?: boolean
    onProgress?: (stats: IndexStats) => void
    onError?: (error: Error) => void
    onComplete?: (data: any) => void
  }) {
    try {
      console.log('Iniciando addFolder con path:', path);
      const response = await this.fetchWithTimeout(
        '/api/folders',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          },
          body: JSON.stringify({
            path,
            thumbnailQuality: options?.thumbnailQuality || 'mid',
            generateThumbnails: options?.generateThumbnails ?? true
          })
        },
        60000 // 60 segundos para agregar carpeta
      );

      console.log('Respuesta recibida:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const error = await response.json();
          console.log('Error JSON recibido:', error);
          const errorObj = new Error(error.message || 'Error al agregar carpeta');
          errorObj.name = error.type || 'UNKNOWN_ERROR';
          throw errorObj;
        }
        throw new Error(`Error al agregar carpeta: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No se recibió respuesta del servidor');
      }

      console.log('Iniciando lectura del stream');
      const reader = response.body.getReader();
      await this.processSSEStream(reader, {
        onProgress: (stats) => {
          console.log('Progreso:', stats);
          options?.onProgress?.(stats);
        },
        onError: (error) => {
          console.log('Error en stream:', error);
          options?.onError?.(error);
        },
        onComplete: (data) => {
          console.log('Completado:', data);
          options?.onComplete?.(data);
        }
      });

      return true;
    } catch (error) {
      console.error('Error en addFolder:', error);
      const errorObj = error instanceof Error ? error : new Error('Error desconocido');
      options?.onError?.(errorObj);
      throw errorObj;
    }
  }

  async reindexFolder({ id, onProgress, onError, onComplete }: IndexOptions) {
    try {
      console.log('Iniciando reindexación de carpeta:', id)
      const response = await this.fetchWithTimeout(
        `/api/folders/reindex/${id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          },
          body: JSON.stringify({
            generateThumbnails: true,
            thumbnailQuality: 'mid'
          })
        },
        60000 // 60 segundos para reindexar
      );

      console.log('Respuesta recibida:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          console.log('Error JSON recibido:', errorData)
          const error = new Error(errorData.message || 'Error al reindexar carpeta');
          error.name = errorData.type || 'UNKNOWN_ERROR';
          throw error;
        }
        throw new Error(`Error al reindexar carpeta: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No se recibió respuesta del servidor');
      }

      console.log('Iniciando lectura del stream')
      const reader = response.body.getReader();
      await this.processSSEStream(reader, {
        onProgress: (stats) => {
          console.log('Progreso:', stats)
          onProgress?.(stats)
        },
        onError: (error) => {
          console.log('Error en stream:', error)
          onError?.(error)
        },
        onComplete: (data) => {
          console.log('Completado:', data)
          onComplete?.(data)
        }
      });
    } catch (error) {
      console.error('Error en reindexFolder:', error)
      onError?.(error instanceof Error ? error : new Error('Error desconocido'));
      throw error;
    }
  }

  async deleteFolder(id: string) {
    try {
      const response = await this.fetchWithTimeout(`/api/folders?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar carpeta');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en deleteFolder:', error);
      throw error;
    }
  }
}

// Creamos una única instancia del servicio
const folderServiceInstance = FolderService.getInstance();

// Exportamos el servicio completo
export const folderService = {
  getFolders: folderServiceInstance.getFolders,
  addFolder: folderServiceInstance.addFolder,
  reindexFolder: folderServiceInstance.reindexFolder,
  deleteFolder: folderServiceInstance.deleteFolder
};

// También exportamos las funciones individuales para compatibilidad
export const {
  getFolders,
  addFolder,
  reindexFolder,
  deleteFolder
} = folderService;

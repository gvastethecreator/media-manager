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

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('Stream completado');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          try {
            const eventData = line.slice(6);
            const event = JSON.parse(eventData);
            console.log('Evento SSE recibido:', event);

            switch (event.type) {
              case 'progress':
                options.onProgress?.(event.data);
                break;
              case 'error':
                const errorMessage = event.data.error || 'Error desconocido';
                const error = new Error(errorMessage);
                error.name = event.data.code || 'UNKNOWN_ERROR';
                console.error('Error en el proceso:', error);
                options.onError?.(error);
                break;
              case 'complete':
                options.onComplete?.(event.data);
                break;
              default:
                console.warn('Tipo de evento desconocido:', event.type);
            }
          } catch (parseError) {
            console.error('Error parseando evento SSE:', parseError);
            options.onError?.(new Error('Error procesando evento del servidor'));
          }
        }
      }
    } catch (streamError) {
      console.error('Error en el stream:', streamError);
      options.onError?.(new Error('Error en la comunicación con el servidor'));
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

      if (!response.ok || !response.body) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const error = await response.json();
          throw new Error(error.message || 'Error al agregar carpeta');
        }
        throw new Error('Error al agregar carpeta');
      }

      const reader = response.body.getReader();
      await this.processSSEStream(reader, options || {});

      return true;
    } catch (error) {
      console.error('Error en addFolder:', error);
      options?.onError?.(error instanceof Error ? error : new Error('Error desconocido'));
      throw error;
    }
  }

  async reindexFolder({ id, onProgress, onError, onComplete }: IndexOptions) {
    try {
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

      if (!response.ok || !response.body) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const error = await response.json();
          throw new Error(error.message || 'Error al reindexar carpeta');
        }
        throw new Error('Error al reindexar carpeta');
      }

      const reader = response.body.getReader();
      await this.processSSEStream(reader, { onProgress, onError, onComplete });
    } catch (error) {
      console.error('Error en reindexFolder:', error);
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

import { EventSourcePolyfill as EventSource } from 'event-source-polyfill'

export interface ProcessStatus {
  status?: string
  current?: number
  total?: number
  progress?: number
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
    console.log('Iniciando proceso de agregar carpeta:', path);
    
    // Crear la carpeta
    const response = await fetch('/api/folders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Error agregando carpeta');
    }

    const folder = await response.json();
    console.log('Carpeta creada:', folder);

    // Iniciar indexación
    await indexFolder(folder.id, callbacks);
    
    return folder;
  } catch (error) {
    console.error('Error en addFolder:', error);
    callbacks?.onError?.(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function indexFolder(id: string, callbacks?: IndexCallbacks) {
  try {
    console.log('Iniciando indexación de carpeta:', id);
    
    const response = await fetch(`/api/folders/${id}/index`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(data.message || `Error en indexación: ${response.status}`);
    }

    const result = await response.json();
    console.log('Indexación completada:', result);
    
    callbacks?.onComplete?.();
    return result;
  } catch (error) {
    console.error('Error en indexación:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    callbacks?.onError?.(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function reindexFolder(id: string, callbacks?: IndexCallbacks) {
  return indexFolder(id, callbacks);
}

export async function deleteFolder(id: string) {
  const response = await fetch(`/api/folders/${id}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Error eliminando carpeta');
  }
  
  return response.json();
}

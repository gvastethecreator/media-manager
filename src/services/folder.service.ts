import { prisma } from '@/lib/prisma'

// Interfaces
export interface IndexStats {
  totalFiles: number;
  processedFiles: number;
  currentFile?: string;
  error?: string;
}

export interface FolderWithStats {
  id: string;
  name: string;
  path: string;
  totalSize: bigint;
  lastIndexed: Date | null;
  updatedAt: Date;
  _count: {
    images: number;
  };
}

export interface FolderStats {
  totalFolders: number;
  totalFiles: number;
  totalSize: number;
  lastIndexed: Date | null;
}

export interface ReindexOptions {
  id: string;
  onProgress: (stats: IndexStats) => void;
  onError: (error: Error) => void;
  onComplete: () => void;
}

// Funciones
/**
 * Obtener todas las carpetas
 */
export async function getFolders() {
  try {
    const folders = await prisma.folder.findMany({
      include: {
        _count: {
          select: { images: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Convertir BigInt a número para que sea serializable
    return folders.map(folder => ({
      ...folder,
      totalSize: Number(folder.totalSize || 0)
    }));
  } catch (error) {
    console.error('Error obteniendo carpetas:', error);
    throw new Error('No se pudieron obtener las carpetas');
  }
}

/**
 * Obtener una carpeta específica
 */
export async function getFolder(id: string) {
  try {
    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        _count: {
          select: { images: true }
        }
      }
    });

    if (!folder) {
      throw new Error('Carpeta no encontrada');
    }

    return {
      ...folder,
      totalSize: Number(folder.totalSize || 0)
    };
  } catch (error) {
    console.error('Error obteniendo carpeta:', error);
    throw new Error('No se pudo obtener la carpeta');
  }
}

/**
 * Eliminar una carpeta
 */
export async function deleteFolder(id: string) {
  try {
    await prisma.folder.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Error eliminando carpeta:', error);
    throw new Error('No se pudo eliminar la carpeta');
  }
}

/**
 * Reindexar una carpeta específica
 */
export async function reindexFolder({ id, onProgress, onError, onComplete }: ReindexOptions) {
  try {
    const response = await fetch(`/api/folders/reindex/${id}`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Error al reindexar la carpeta');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No se pudo leer la respuesta');
    }

    const decoder = new TextDecoder();
    let isComplete = false;

    try {
      while (!isComplete) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const events = chunk
          .split('\n')
          .filter(Boolean)
          .map(line => {
            try {
              return JSON.parse(line);
            } catch (error) {
              console.error('Error parsing event:', error);
              return null;
            }
          })
          .filter(event => event !== null);

        for (const event of events) {
          if (!event?.type || !event?.data) continue;

          switch (event.type) {
            case 'progress':
              onProgress(event.data);
              break;
            case 'error':
              onError(new Error(event.data.error));
              break;
            case 'complete':
              isComplete = true;
              onComplete();
              break;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    console.error('Error reindexando carpeta:', error);
    onError(error instanceof Error ? error : new Error('Error desconocido'));
  }
}

/**
 * Reindexar todas las carpetas
 */
export async function reindexAll() {
  try {
    const response = await fetch('/api/folders/reindex', {
      method: 'POST'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al reindexar las carpetas');
    }
  } catch (error) {
    console.error('Error en reindexAll:', error);
    throw error;
  }
}

/**
 * Obtener estadísticas de indexación
 */
export async function getIndexStats(): Promise<FolderStats> {
  try {
    const response = await fetch('/api/folders/stats');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener las estadísticas');
    }

    const stats = await response.json();
    return {
      ...stats,
      lastIndexed: stats.lastIndexed ? new Date(stats.lastIndexed) : null
    };
  } catch (error) {
    console.error('Error en getIndexStats:', error);
    throw error;
  }
}

// Exportar todas las funciones como un objeto de servicio
export const folderService = {
  getFolders,
  getFolder,
  deleteFolder,
  reindexFolder,
  reindexAll,
  getIndexStats
};

import type { Collection as PrismaCollection } from '.prisma/client'
import type { FileItem } from '@/types/file-item'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service'

const collectionLogger = logger.withContext('CollectionService')

export interface Collection extends PrismaCollection {
  count: number
  size: string
}

export interface CollectionCreate {
  name: string
  emoji?: string
  color?: string
  description?: string
  shortcut?: string
  sortBy?: string
  filters?: any[]
}

export interface CollectionUpdate extends Partial<Omit<CollectionCreate, 'name'>> {
  id: string
  name?: string
}

export interface CollectionStats {
  count: number;
  size: number;
  lastUpdated?: Date;
}

export interface CollectionWithStats extends Collection {
  count: number;
  size: string;
  stats?: CollectionStats;
}

export interface CollectionWithImages extends Collection {
  images: FileItem[]
}

export const collectionService = {
  async getCollections(): Promise<CollectionWithStats[]> {
    try {
      collectionLogger.info('📚 Obteniendo lista de colecciones');
      const response = await fetch('/api/collections', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch collections');
      }

      const collections = await response.json();
      collectionLogger.info(`✅ ${collections.length} colecciones obtenidas`);
      return collections;
    } catch (error) {
      collectionLogger.error('❌ Error al obtener colecciones:', error);
      throw error;
    }
  },

  async getCollection(id: string): Promise<CollectionWithStats | null> {
    try {
      collectionLogger.info('🔍 Obteniendo colección:', id);
      const response = await fetch(`/api/collections/${id}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch collection');
      }

      const collection = await response.json();
      collectionLogger.info('✅ Colección obtenida:', collection.name);
      return collection;
    } catch (error) {
      collectionLogger.error('❌ Error al obtener colección:', error);
      throw error;
    }
  },

  async createCollection(data: CollectionCreate): Promise<Collection> {
    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create collection')
      }

      return response.json()
    } catch (error) {
      collectionLogger.error('Error creating collection:', error)
      throw error
    }
  },

  async updateCollection(id: string, data: CollectionUpdate): Promise<Collection> {
    try {
      const response = await fetch(`/api/collections/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update collection')
      }

      return response.json()
    } catch (error) {
      collectionLogger.error('Error updating collection:', error)
      throw error
    }
  },

  async deleteCollection(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/collections/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete collection')
      }
    } catch (error) {
      collectionLogger.error('Error deleting collection:', error)
      throw error
    }
  },

  async addImageToCollection(collectionId: string, imageId: string): Promise<void> {
    try {
      const response = await fetch(`/api/collections/${collectionId}/images/${imageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add image to collection')
      }

      statsEventEmitter.emit(STATS_EVENTS.COLLECTION_CHANGE)
    } catch (error) {
      collectionLogger.error('Error adding image to collection:', error)
      throw error
    }
  },

  async removeImageFromCollection(collectionId: string, imageId: string): Promise<void> {
    try {
      const response = await fetch(`/api/collections/${collectionId}/images/${imageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove image from collection')
      }

      statsEventEmitter.emit(STATS_EVENTS.COLLECTION_CHANGE)
    } catch (error) {
      collectionLogger.error('Error removing image from collection:', error)
      throw error
    }
  },

  async getCollectionImages(collectionId: string): Promise<FileItem[]> {
    try {
      const response = await fetch(`/api/collections/${collectionId}/images`)
      if (!response.ok) {
        throw new Error('Failed to fetch collection images')
      }
      return response.json()
    } catch (error) {
      collectionLogger.error('Error fetching collection images:', error)
      throw error
    }
  },

  async getCollectionStats(id: string): Promise<CollectionStats> {
    try {
      collectionLogger.info('📊 Obteniendo estadísticas de colección:', id);
      const response = await fetch(`/api/collections/${id}/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch collection stats');
      }
      const stats = await response.json();
      collectionLogger.info('✅ Estadísticas obtenidas:', stats);
      return stats;
    } catch (error) {
      collectionLogger.error('❌ Error al obtener estadísticas:', error);
      throw error;
    }
  },

  async updateCollectionStats(id: string, stats: Partial<CollectionStats>): Promise<CollectionStats> {
    try {
      collectionLogger.info('📝 Actualizando estadísticas de colección:', { id, stats });
      const response = await fetch(`/api/collections/${id}/stats`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stats),
      });

      if (!response.ok) {
        throw new Error('Failed to update collection stats');
      }

      const updatedStats = await response.json();
      collectionLogger.info('✅ Estadísticas actualizadas:', updatedStats);
      return updatedStats;
    } catch (error) {
      collectionLogger.error('❌ Error al actualizar estadísticas:', error);
      throw error;
    }
  },

  formatBytes(bytes: number): string {
    return formatBytes(bytes);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export async function addImageToCollection(collectionId: string, fileId: string) {
  try {
    const response = await fetch(`/api/collections/${collectionId}/files`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileId }),
    });

    if (!response.ok) {
      throw new Error("Error al agregar imagen a la colección");
    }

    const data = await response.json();
    collectionLogger.info("✨ Imagen agregada a la colección:", {
      collectionId,
      fileId,
    });
    return data;
  } catch (error) {
    collectionLogger.error("❌ Error al agregar imagen a la colección:", {
      error,
      collectionId,
      fileId,
    });
    throw error;
  }
}

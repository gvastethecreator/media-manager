import type { Collection as PrismaCollection } from '.prisma/client'
import type { FileItem } from '@/types/file-item'

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

export interface CollectionWithStats extends Collection {
  count: number
  size: string
}

export interface CollectionWithImages extends Collection {
  images: FileItem[]
}

export const collectionService = {
  async getCollections(): Promise<CollectionWithStats[]> {
    try {
      const response = await fetch('/api/collections')
      if (!response.ok) {
        throw new Error('Failed to fetch collections')
      }
      return response.json()
    } catch (error) {
      console.error('Error fetching collections:', error)
      throw error
    }
  },

  async getCollection(id: string): Promise<CollectionWithStats | null> {
    try {
      const response = await fetch(`/api/collections/${id}`)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch collection')
      }
      return response.json()
    } catch (error) {
      console.error('Error fetching collection:', error)
      throw error
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
      console.error('Error creating collection:', error)
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
      console.error('Error updating collection:', error)
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
      console.error('Error deleting collection:', error)
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
    } catch (error) {
      console.error('Error adding image to collection:', error)
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
    } catch (error) {
      console.error('Error removing image from collection:', error)
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
      console.error('Error fetching collection images:', error)
      throw error
    }
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

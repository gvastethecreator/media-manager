import { Collection } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export interface CollectionCreate {
  name: string
  emoji?: string
  color?: string
  description?: string
  shortcut?: string
  sortBy?: string
  filters?: any[]
}

export interface CollectionUpdate extends Partial<CollectionCreate> {
  id: string
}

export interface CollectionWithStats extends Collection {
  count: number
  size: string
}

export const collectionService = {
  async getCollections(): Promise<CollectionWithStats[]> {
    const collections = await prisma.collection.findMany({
      include: {
        _count: {
          select: { images: true }
        },
        images: {
          select: { size: true }
        }
      }
    })

    return collections.map(collection => ({
      ...collection,
      filters: collection.filters ? JSON.parse(collection.filters) : [],
      count: collection._count.images,
      size: formatBytes(collection.images.reduce((acc, img) => acc + img.size, 0))
    }))
  },

  async getCollection(id: string): Promise<CollectionWithStats | null> {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: { images: true }
        },
        images: {
          select: { size: true }
        }
      }
    })

    if (!collection) return null

    return {
      ...collection,
      filters: collection.filters ? JSON.parse(collection.filters) : [],
      count: collection._count.images,
      size: formatBytes(collection.images.reduce((acc, img) => acc + img.size, 0))
    }
  },

  async createCollection(data: CollectionCreate): Promise<Collection> {
    return prisma.collection.create({
      data: {
        ...data,
        filters: JSON.stringify(data.filters || [])
      }
    })
  },

  async updateCollection(id: string, data: CollectionUpdate): Promise<Collection> {
    const updateData: any = { ...data }
    if (data.filters) {
      updateData.filters = JSON.stringify(data.filters)
    }
    delete updateData.id

    return prisma.collection.update({
      where: { id },
      data: updateData
    })
  },

  async deleteCollection(id: string): Promise<void> {
    await prisma.collection.delete({
      where: { id }
    })
  },

  async addImageToCollection(collectionId: string, imageId: string): Promise<void> {
    await prisma.collection.update({
      where: { id: collectionId },
      data: {
        images: {
          connect: { id: imageId }
        }
      }
    })
  },

  async removeImageFromCollection(collectionId: string, imageId: string): Promise<void> {
    await prisma.collection.update({
      where: { id: collectionId },
      data: {
        images: {
          disconnect: { id: imageId }
        }
      }
    })
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

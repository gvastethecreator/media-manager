import { prisma } from '@/lib/prisma'
import type { Collection } from '@prisma/client'

export type CreateCollectionInput = {
  name: string
  description?: string
  coverImage?: string
  isPublic?: boolean
  userId: string
}

export const collectionService = {
  // Create a new collection
  async createCollection(data: CreateCollectionInput): Promise<Collection> {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    return prisma.collection.create({
      data: {
        ...data,
        slug,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        images: true,
        albums: true,
      },
    })
  },

  // Get collection by ID
  async getCollection(id: string): Promise<Collection | null> {
    return prisma.collection.findUnique({
      where: { id },
      include: {
        images: true,
        albums: true,
      },
    })
  },

  // Get user collections
  async getUserCollections(userId: string): Promise<Collection[]> {
    return prisma.collection.findMany({
      where: { userId },
      include: {
        images: true,
        albums: true,
      },
    })
  },

  // Update collection
  async updateCollection(
    id: string,
    data: Partial<CreateCollectionInput>,
  ): Promise<Collection> {
    const updateData: any = { ...data }
    if (data.name) {
      updateData.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }
    
    return prisma.collection.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        images: true,
        albums: true,
      },
    })
  },

  // Delete collection
  async deleteCollection(id: string): Promise<void> {
    await prisma.collection.delete({
      where: { id },
    })
  },

  // Add images to collection
  async addImagesToCollection(
    collectionId: string,
    imageIds: string[],
  ): Promise<Collection> {
    return prisma.collection.update({
      where: { id: collectionId },
      data: {
        images: {
          connect: imageIds.map((id) => ({ id })),
        },
        updatedAt: new Date(),
      },
      include: {
        images: true,
        albums: true,
      },
    })
  },

  // Remove images from collection
  async removeImagesFromCollection(
    collectionId: string,
    imageIds: string[],
  ): Promise<Collection> {
    return prisma.collection.update({
      where: { id: collectionId },
      data: {
        images: {
          disconnect: imageIds.map((id) => ({ id })),
        },
        updatedAt: new Date(),
      },
      include: {
        images: true,
        albums: true,
      },
    })
  },

  // Add albums to collection
  async addAlbumsToCollection(
    collectionId: string,
    albumIds: string[],
  ): Promise<Collection> {
    return prisma.collection.update({
      where: { id: collectionId },
      data: {
        albums: {
          connect: albumIds.map((id) => ({ id })),
        },
        updatedAt: new Date(),
      },
      include: {
        images: true,
        albums: true,
      },
    })
  },

  // Remove albums from collection
  async removeAlbumsFromCollection(
    collectionId: string,
    albumIds: string[],
  ): Promise<Collection> {
    return prisma.collection.update({
      where: { id: collectionId },
      data: {
        albums: {
          disconnect: albumIds.map((id) => ({ id })),
        },
        updatedAt: new Date(),
      },
      include: {
        images: true,
        albums: true,
      },
    })
  },
}

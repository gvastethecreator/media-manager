import { prisma } from '@/lib/prisma'
import type { Image, Thumbnail } from '@prisma/client'
import { statsService } from './stats.service'

export type CreateImageInput = {
  title: string
  name: string
  description?: string
  filePath: string
  fileSize: number
  mimeType: string
  width: number
  height: number
  userId: string
  metadata?: {
    width?: number
    height?: number
    description?: string
    [key: string]: any
  }
  hash?: string
  isPublic?: boolean
}

export type CreateThumbnailInput = {
  size: string
  width: number
  height: number
  filePath: string
  fileSize: number
  quality: number
  format: string
  imageId: string
}

export const imageService = {
  // Create a new image
  async createImage(data: CreateImageInput): Promise<Image> {
    const image = await prisma.image.create({
      data: {
        ...data,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        thumbnails: true,
        tags: true,
      },
    })

    // Initialize stats for the new image
    await statsService.getOrCreateImageStats(image.id)

    return image
  },

  // Get image by ID
  async getImage(id: string): Promise<Image | null> {
    const image = await prisma.image.findUnique({
      where: { id },
      include: {
        thumbnails: true,
        tags: true,
        stats: true,
        favorites: true,
      },
    })

    if (image) {
      // Increment view count
      await statsService.incrementViewCount(image.id)
    }

    return {
      ...image,
      metadata: image.metadata ? JSON.parse(image.metadata) : null,
    }
  },

  // Get images by user ID
  async getUserImages(
    userId: string,
    options?: {
      skip?: number
      take?: number
      orderBy?: { [key: string]: 'asc' | 'desc' }
      includePrivate?: boolean
    },
  ): Promise<{ images: Image[]; total: number }> {
    const where = {
      userId,
      ...(options?.includePrivate ? {} : { isPublic: true }),
    }

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        orderBy: options?.orderBy,
        include: {
          thumbnails: true,
          tags: true,
          stats: true,
        },
      }),
      prisma.image.count({ where }),
    ])

    return {
      images: images.map((image) => ({
        ...image,
        metadata: image.metadata ? JSON.parse(image.metadata) : null,
      })),
      total,
    }
  },

  // Create thumbnail for image
  async createThumbnail(data: CreateThumbnailInput): Promise<Thumbnail> {
    return prisma.thumbnail.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
  },

  // Delete image and its thumbnails
  async deleteImage(id: string): Promise<void> {
    await prisma.image.delete({
      where: { id },
    })
  },

  // Update image metadata
  async updateImageMetadata(id: string, metadata: { [key: string]: any }): Promise<Image> {
    return prisma.image.update({
      where: { id },
      data: {
        metadata: JSON.stringify(metadata),
        updatedAt: new Date(),
      },
    })
  },

  // Add tags to image
  async addTagsToImage(imageId: string, tagIds: string[]): Promise<Image> {
    return prisma.image.update({
      where: { id: imageId },
      data: {
        tags: {
          connect: tagIds.map((id) => ({ id })),
        },
        updatedAt: new Date(),
      },
      include: {
        tags: true,
      },
    })
  },

  // Remove tags from image
  async removeTagsFromImage(imageId: string, tagIds: string[]): Promise<Image> {
    return prisma.image.update({
      where: { id: imageId },
      data: {
        tags: {
          disconnect: tagIds.map((id) => ({ id })),
        },
        updatedAt: new Date(),
      },
      include: {
        tags: true,
      },
    })
  },

  // Search images by tags
  async searchByTags(
    tagIds: string[],
    options?: {
      userId?: string
      skip?: number
      take?: number
      includePrivate?: boolean
    },
  ): Promise<{ images: Image[]; total: number }> {
    const where = {
      tags: {
        some: {
          id: {
            in: tagIds,
          },
        },
      },
      ...(options?.userId ? { userId: options.userId } : {}),
      ...(options?.includePrivate ? {} : { isPublic: true }),
    }

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        include: {
          thumbnails: true,
          tags: true,
          stats: true,
        },
      }),
      prisma.image.count({ where }),
    ])

    return {
      images: images.map((image) => ({
        ...image,
        metadata: image.metadata ? JSON.parse(image.metadata) : null,
      })),
      total,
    }
  },

  // Search images by text
  async searchByText(
    query: string,
    options?: {
      userId?: string
      skip?: number
      take?: number
      includePrivate?: boolean
    },
  ): Promise<{ images: Image[]; total: number }> {
    const where = {
      OR: [
        { title: { contains: query } },
        { description: { contains: query } },
        { name: { contains: query } },
      ],
      ...(options?.userId ? { userId: options.userId } : {}),
      ...(options?.includePrivate ? {} : { isPublic: true }),
    }

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        include: {
          thumbnails: true,
          tags: true,
          stats: true,
        },
      }),
      prisma.image.count({ where }),
    ])

    return {
      images: images.map((image) => ({
        ...image,
        metadata: image.metadata ? JSON.parse(image.metadata) : null,
      })),
      total,
    }
  },

  // Get similar images based on tags
  async getSimilarImages(
    imageId: string,
    limit: number = 10,
  ): Promise<Image[]> {
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      include: { tags: true },
    })

    if (!image || image.tags.length === 0) {
      return []
    }

    const tagIds = image.tags.map((tag) => tag.id)

    const similarImages = await prisma.image.findMany({
      where: {
        id: { not: imageId },
        tags: {
          some: {
            id: { in: tagIds },
          },
        },
      },
      take: limit,
      include: {
        thumbnails: true,
        tags: true,
        stats: true,
      },
    })

    return similarImages.map((image) => ({
      ...image,
      metadata: image.metadata ? JSON.parse(image.metadata) : null,
    }))
  },

  // Update image privacy
  async updatePrivacy(id: string, isPublic: boolean): Promise<Image> {
    return prisma.image.update({
      where: { id },
      data: {
        isPublic,
        updatedAt: new Date(),
      },
    })
  },
}

import { prisma } from '@/lib/prisma'
import type { Album } from '@prisma/client'

export type CreateAlbumInput = {
  name: string
  description?: string
  userId: string
}

export const albumService = {
  // Create a new album
  async createAlbum(data: CreateAlbumInput): Promise<Album> {
    return prisma.album.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
  },

  // Get album by ID
  async getAlbum(id: string): Promise<Album | null> {
    return prisma.album.findUnique({
      where: { id },
      include: {
        images: true,
      },
    })
  },

  // Get user albums
  async getUserAlbums(userId: string): Promise<Album[]> {
    return prisma.album.findMany({
      where: { userId },
      include: {
        images: true,
      },
    })
  },

  // Update album
  async updateAlbum(
    id: string,
    data: { name?: string; description?: string },
  ): Promise<Album> {
    return prisma.album.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })
  },

  // Delete album
  async deleteAlbum(id: string): Promise<void> {
    await prisma.album.delete({
      where: { id },
    })
  },

  // Add images to album
  async addImagesToAlbum(albumId: string, imageIds: string[]): Promise<Album> {
    return prisma.album.update({
      where: { id: albumId },
      data: {
        images: {
          connect: imageIds.map((id) => ({ id })),
        },
        updatedAt: new Date(),
      },
      include: {
        images: true,
      },
    })
  },

  // Remove images from album
  async removeImagesFromAlbum(albumId: string, imageIds: string[]): Promise<Album> {
    return prisma.album.update({
      where: { id: albumId },
      data: {
        images: {
          disconnect: imageIds.map((id) => ({ id })),
        },
        updatedAt: new Date(),
      },
      include: {
        images: true,
      },
    })
  },
}

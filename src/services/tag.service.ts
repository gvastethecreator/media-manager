import { Tag } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export interface TagCreate {
  name: string
  color?: string
  description?: string
  shortcut?: string
}

export interface TagUpdate extends Partial<TagCreate> {
  id: string
}

export interface TagWithStats extends Tag {
  count: number
  size: string
}

export const tagService = {
  async getTags(): Promise<TagWithStats[]> {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { images: true }
        },
        images: {
          select: { size: true }
        }
      }
    })

    return tags.map(tag => ({
      ...tag,
      count: tag._count.images,
      size: formatBytes(tag.images.reduce((acc, img) => acc + img.size, 0))
    }))
  },

  async getTag(id: string): Promise<TagWithStats | null> {
    const tag = await prisma.tag.findUnique({
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

    if (!tag) return null

    return {
      ...tag,
      count: tag._count.images,
      size: formatBytes(tag.images.reduce((acc, img) => acc + img.size, 0))
    }
  },

  async createTag(data: TagCreate): Promise<Tag> {
    return prisma.tag.create({
      data
    })
  },

  async updateTag(id: string, data: TagUpdate): Promise<Tag> {
    const updateData = { ...data }
    delete updateData.id

    return prisma.tag.update({
      where: { id },
      data: updateData
    })
  },

  async deleteTag(id: string): Promise<void> {
    await prisma.tag.delete({
      where: { id }
    })
  },

  async addImageToTag(tagId: string, imageId: string): Promise<void> {
    await prisma.tag.update({
      where: { id: tagId },
      data: {
        images: {
          connect: { id: imageId }
        }
      }
    })
  },

  async removeImageFromTag(tagId: string, imageId: string): Promise<void> {
    await prisma.tag.update({
      where: { id: tagId },
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

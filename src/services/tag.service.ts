import { prisma } from '@/lib/prisma'
import type { Tag } from '@prisma/client'

export type CreateTagInput = {
  name: string
  color?: string
  description?: string
  type?: string
  metadata?: string
  userId: string
}

export const tagService = {
  // Create a new tag
  async createTag(data: CreateTagInput): Promise<Tag> {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    return prisma.tag.create({
      data: {
        ...data,
        slug,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        images: true,
      },
    })
  },

  // Get all tags for a user
  async getUserTags(userId: string): Promise<Tag[]> {
    return prisma.tag.findMany({
      where: { userId },
      include: {
        images: true,
      },
    })
  },

  // Get tag by ID
  async getTag(id: string): Promise<Tag | null> {
    return prisma.tag.findUnique({
      where: { id },
      include: {
        images: true,
      },
    })
  },

  // Get tag by slug
  async getTagBySlug(userId: string, slug: string): Promise<Tag | null> {
    return prisma.tag.findFirst({
      where: { 
        userId,
        slug,
      },
      include: {
        images: true,
      },
    })
  },

  // Delete tag
  async deleteTag(id: string): Promise<void> {
    await prisma.tag.delete({
      where: { id },
    })
  },

  // Update tag
  async updateTag(
    id: string,
    data: Partial<CreateTagInput>,
  ): Promise<Tag> {
    const updateData: any = { ...data }
    if (data.name) {
      updateData.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }

    return prisma.tag.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        images: true,
      },
    })
  },

  // Get tags by image ID
  async getImageTags(imageId: string): Promise<Tag[]> {
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      include: {
        tags: true,
      },
    })
    return image?.tags ?? []
  },

  // Get popular tags
  async getPopularTags(
    userId: string,
    limit: number = 10,
  ): Promise<(Tag & { imageCount: number })[]> {
    const tags = await prisma.tag.findMany({
      where: { userId },
      include: {
        _count: {
          select: { images: true },
        },
      },
      orderBy: {
        images: {
          _count: 'desc',
        },
      },
      take: limit,
    })

    return tags.map((tag) => ({
      ...tag,
      imageCount: tag._count.images,
    }))
  },

  // Get recently used tags
  async getRecentTags(
    userId: string,
    limit: number = 10,
  ): Promise<Tag[]> {
    return prisma.tag.findMany({
      where: { userId },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
      include: {
        images: true,
      },
    })
  },

  // Search tags
  async searchTags(
    userId: string,
    query: string,
    limit: number = 10,
  ): Promise<Tag[]> {
    return prisma.tag.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
      },
      take: limit,
      include: {
        images: true,
      },
    })
  },

  // Get related tags (tags that are often used together)
  async getRelatedTags(
    tagId: string,
    limit: number = 5,
  ): Promise<(Tag & { commonImages: number })[]> {
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
      include: {
        images: {
          include: {
            tags: true,
          },
        },
      },
    })

    if (!tag) return []

    const tagCounts = new Map<string, { tag: Tag; count: number }>()

    tag.images.forEach((image) => {
      image.tags.forEach((relatedTag) => {
        if (relatedTag.id === tagId) return

        const existing = tagCounts.get(relatedTag.id)
        if (existing) {
          existing.count++
        } else {
          tagCounts.set(relatedTag.id, { tag: relatedTag, count: 1 })
        }
      })
    })

    return Array.from(tagCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(({ tag, count }) => ({
        ...tag,
        commonImages: count,
      }))
  },

  // Merge tags
  async mergeTags(sourceTagId: string, targetTagId: string): Promise<Tag> {
    const [sourceTag, targetTag] = await Promise.all([
      prisma.tag.findUnique({
        where: { id: sourceTagId },
        include: { images: true },
      }),
      prisma.tag.findUnique({
        where: { id: targetTagId },
        include: { images: true },
      }),
    ])

    if (!sourceTag || !targetTag) {
      throw new Error('One or both tags not found')
    }

    // Move all images from source tag to target tag
    await prisma.tag.update({
      where: { id: targetTagId },
      data: {
        images: {
          connect: sourceTag.images.map((image) => ({ id: image.id })),
        },
      },
    })

    // Delete the source tag
    await prisma.tag.delete({
      where: { id: sourceTagId },
    })

    return prisma.tag.findUnique({
      where: { id: targetTagId },
      include: {
        images: true,
      },
    }) as Promise<Tag>
  },
}

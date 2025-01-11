import type { Tag as PrismaTag } from '.prisma/client'
import type { FileItem } from '@/types/file-item'
import { logger } from "@/lib/logger";

const tagLogger = logger.withContext("TagService");

export interface Tag extends PrismaTag {
  count: number
}

export interface TagCreate {
  name: string
  color?: string
  description?: string
  shortcut?: string
}

export interface TagUpdate extends Partial<Omit<TagCreate, 'name'>> {
  id: string
  name?: string
}

export interface TagWithStats extends Tag {
  count: number
  size: string
}

export interface TagWithImages extends Tag {
  images: FileItem[]
}

class TagService {
  async getTags(): Promise<TagWithStats[]> {
    try {
      const response = await fetch('/api/tags')
      if (!response.ok) {
        throw new Error('Failed to fetch tags')
      }
      return response.json()
    } catch (error) {
      console.error('Error fetching tags:', error)
      throw error
    }
  }

  async getTag(id: string): Promise<TagWithStats | null> {
    try {
      const response = await fetch(`/api/tags/${id}`)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch tag')
      }
      return response.json()
    } catch (error) {
      console.error('Error fetching tag:', error)
      throw error
    }
  }

  async createTag(data: TagCreate): Promise<Tag> {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create tag')
      }

      return response.json()
    } catch (error) {
      console.error('Error creating tag:', error)
      throw error
    }
  }

  async updateTag(id: string, data: TagUpdate): Promise<Tag> {
    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update tag')
      }

      return response.json()
    } catch (error) {
      console.error('Error updating tag:', error)
      throw error
    }
  }

  async deleteTag(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete tag')
      }
    } catch (error) {
      console.error('Error deleting tag:', error)
      throw error
    }
  }

  async addImageToTag(tagId: string, fileId: string) {
    try {
      const response = await fetch(`/api/tags/${tagId}/files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        throw new Error("Error al agregar imagen a la etiqueta");
      }

      const data = await response.json();
      tagLogger.info("✨ Imagen agregada a la etiqueta:", {
        tagId,
        fileId,
      });
      return data;
    } catch (error) {
      tagLogger.error("❌ Error al agregar imagen a la etiqueta:", {
        error,
        tagId,
        fileId,
      });
      throw error;
    }
  }

  async removeImageFromTag(tagId: string, imageId: string): Promise<void> {
    try {
      const response = await fetch(`/api/tags/${tagId}/images/${imageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to remove image from tag')
      }
    } catch (error) {
      console.error('Error removing image from tag:', error)
      throw error
    }
  }

  async getTagImages(tagId: string): Promise<FileItem[]> {
    try {
      const response = await fetch(`/api/tags/${tagId}/images`)
      if (!response.ok) {
        throw new Error('Failed to fetch tag images')
      }
      return response.json()
    } catch (error) {
      console.error('Error fetching tag images:', error)
      throw error
    }
  }
}

export const tagService = new TagService();
export const { addImageToTag } = tagService;

import { Tag } from '@prisma/client'

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

export const tagService = {
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
  },

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
  },

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
        throw new Error('Failed to create tag')
      }

      return response.json()
    } catch (error) {
      console.error('Error creating tag:', error)
      throw error
    }
  },

  async updateTag(id: string, data: TagUpdate): Promise<Tag> {
    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update tag')
      }

      return response.json()
    } catch (error) {
      console.error('Error updating tag:', error)
      throw error
    }
  },

  async deleteTag(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete tag')
      }
    } catch (error) {
      console.error('Error deleting tag:', error)
      throw error
    }
  },

  async addImageToTag(tagId: string, imageId: string): Promise<void> {
    try {
      const response = await fetch(`/api/tags/${tagId}/images/${imageId}`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to add image to tag')
      }
    } catch (error) {
      console.error('Error adding image to tag:', error)
      throw error
    }
  },

  async removeImageFromTag(tagId: string, imageId: string): Promise<void> {
    try {
      const response = await fetch(`/api/tags/${tagId}/images/${imageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove image from tag')
      }
    } catch (error) {
      console.error('Error removing image from tag:', error)
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

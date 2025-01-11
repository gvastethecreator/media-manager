import type { Character as PrismaCharacter } from '@prisma/client'
import type { FileItem } from '@/types/file-item'
import { logger } from '@/lib/logger'

const characterLogger = logger.withContext('CharacterService')

export interface CharacterCreate {
  name: string
  emoji?: string
  color?: string
  description?: string
  shortcut?: string
  sortBy?: string
  filters?: string
}

export interface CharacterUpdate extends Partial<CharacterCreate> {
  id: string
}

export interface CharacterWithStats {
  id: string
  name: string
  emoji: string
  description: string | null
  color: string
  shortcut: string | null
  sortBy: string
  filters: string
  createdAt: Date
  updatedAt: Date
  count: number
}

export interface CharacterWithImages extends CharacterWithStats {
  images: FileItem[]
}

export const characterService = {
  async getCharacters(): Promise<CharacterWithStats[]> {
    try {
      characterLogger.info('👥 Obteniendo lista de personajes')
      const response = await fetch('/api/characters')
      if (!response.ok) {
        throw new Error('Failed to fetch characters')
      }
      const characters = await response.json()
      characterLogger.info(`✅ ${characters.length} personajes obtenidos`)
      return characters
    } catch (error) {
      characterLogger.error('❌ Error al obtener personajes:', error)
      throw error
    }
  },

  async getCharacter(id: string): Promise<CharacterWithStats | null> {
    try {
      characterLogger.info('👤 Obteniendo personaje:', id)
      const response = await fetch(`/api/characters/${id}`)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch character')
      }
      const character = await response.json()
      characterLogger.info('✅ Personaje obtenido:', character.name)
      return character
    } catch (error) {
      characterLogger.error('❌ Error al obtener personaje:', error)
      throw error
    }
  },

  async createCharacter(data: CharacterCreate): Promise<CharacterWithStats> {
    try {
      characterLogger.info('➕ Creando personaje:', data)
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create character')
      }

      const character = await response.json()
      characterLogger.info('✅ Personaje creado:', character.name)
      return character
    } catch (error) {
      characterLogger.error('❌ Error al crear personaje:', error)
      throw error
    }
  },

  async updateCharacter(id: string, data: CharacterUpdate): Promise<CharacterWithStats> {
    try {
      characterLogger.info('📝 Actualizando personaje:', { id, data })
      const response = await fetch(`/api/characters/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update character')
      }

      const character = await response.json()
      characterLogger.info('✅ Personaje actualizado:', character.name)
      return character
    } catch (error) {
      characterLogger.error('❌ Error al actualizar personaje:', error)
      throw error
    }
  },

  async deleteCharacter(id: string): Promise<void> {
    try {
      characterLogger.info('🗑️ Eliminando personaje:', id)
      const response = await fetch(`/api/characters/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete character')
      }
      characterLogger.info('✅ Personaje eliminado:', id)
    } catch (error) {
      characterLogger.error('❌ Error al eliminar personaje:', error)
      throw error
    }
  },

  async addImageToCharacter(characterId: string, imageId: string): Promise<void> {
    try {
      const response = await fetch(`/api/characters/${characterId}/images/${imageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add image to character')
      }
    } catch (error) {
      characterLogger.error('Error adding image to character:', error)
      throw error
    }
  },

  async removeImageFromCharacter(characterId: string, imageId: string): Promise<void> {
    try {
      const response = await fetch(`/api/characters/${characterId}/images/${imageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove image from character')
      }
    } catch (error) {
      characterLogger.error('Error removing image from character:', error)
      throw error
    }
  },

  async getCharacterImages(characterId: string): Promise<FileItem[]> {
    try {
      const response = await fetch(`/api/characters/${characterId}/images`)
      if (!response.ok) {
        throw new Error('Failed to fetch character images')
      }
      return response.json()
    } catch (error) {
      characterLogger.error('Error fetching character images:', error)
      throw error
    }
  },

  async getCharacterStats(id: string): Promise<{ count: number; size: string }> {
    try {
      characterLogger.info('📊 Obteniendo estadísticas de personaje:', id)
      const response = await fetch(`/api/characters/${id}/stats`)
      if (!response.ok) {
        throw new Error('Failed to fetch character stats')
      }
      const stats = await response.json()
      characterLogger.info('✅ Estadísticas obtenidas:', stats)
      return stats
    } catch (error) {
      characterLogger.error('❌ Error al obtener estadísticas:', error)
      throw error
    }
  }
}
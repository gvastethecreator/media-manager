import { prisma } from '@/lib/prisma'
import type { Character as PrismaCharacter } from '@prisma/client'
import type { FileItem } from '@/types/file-item'
import { logger } from '@/lib/logger'
import { eventsService, type EventData } from './events.service'

const characterLogger = logger.withContext('CharacterService')

export interface CharacterCreate {
  name: string
  emoji?: string
  color?: string
  description?: string
  shortcut?: string
  level?: number
  class?: string
  race?: string
  alignment?: string
  backstory?: string
  stats?: string
  sortBy?: string
  filters?: string
}

export interface CharacterUpdate extends Partial<CharacterCreate> {
  id: string
}

export interface CharacterWithStats extends PrismaCharacter {
  _count: {
    images: number
  }
  totalSize: number
}

class CharacterService {
  async getCharacters(): Promise<CharacterWithStats[]> {
    try {
      characterLogger.info('🔍 Buscando personajes...')
      const characters = await prisma.character.findMany({
        include: {
          _count: {
            select: { images: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      const charactersWithStats = await Promise.all(
        characters.map(async (character) => {
          const totalSize = await prisma.image.aggregate({
            where: { characters: { some: { id: character.id } } },
            _sum: { size: true }
          })

          return {
            ...character,
            totalSize: totalSize._sum?.size || 0
          }
        })
      )

      characterLogger.info('✅ Personajes obtenidos correctamente:', { count: characters.length })
      return charactersWithStats
    } catch (error) {
      characterLogger.error('❌ Error al obtener personajes:', error)
      throw error
    }
  }

  async getCharacter(id: string): Promise<CharacterWithStats | null> {
    try {
      const character = await prisma.character.findUnique({
        where: { id },
        include: {
          _count: {
            select: { images: true }
          }
        }
      })

      if (!character) return null

      const totalSize = await prisma.image.aggregate({
        where: { characters: { some: { id } } },
        _sum: { size: true }
      })

      return {
        ...character,
        totalSize: totalSize._sum?.size || 0
      }
    } catch (error) {
      characterLogger.error('❌ Error al obtener personaje:', error)
      throw error
    }
  }

  async createCharacter(data: CharacterCreate): Promise<CharacterWithStats> {
    try {
      const characterData = {
        ...data,
        emoji: data.emoji || '👤',
        color: data.color || '#3b82f6',
        level: data.level || 1,
        class: data.class || 'unknown',
        race: data.race || 'unknown',
        alignment: data.alignment || 'neutral',
        backstory: data.backstory || '',
        stats: data.stats || '{}',
        sortBy: data.sortBy || 'name',
        filters: data.filters || '[]'
      }

      const character = await prisma.character.create({
        data: characterData,
        include: {
          _count: {
            select: { images: true }
          }
        }
      })

      const characterWithStats = {
        ...character,
        totalSize: 0
      }

      characterLogger.info('✨ Personaje creado:', character)
      const eventData: EventData = { type: 'create', id: character.id }
      eventsService.emit('characters:modified', eventData)
      return characterWithStats
    } catch (error) {
      characterLogger.error('❌ Error al crear personaje:', error)
      throw error
    }
  }

  async updateCharacter(id: string, data: CharacterUpdate): Promise<CharacterWithStats> {
    try {
      const character = await prisma.character.update({
        where: { id },
        data,
        include: {
          _count: {
            select: { images: true }
          }
        }
      })

      const totalSize = await prisma.image.aggregate({
        where: { characters: { some: { id } } },
        _sum: { size: true }
      })

      const characterWithStats = {
        ...character,
        totalSize: totalSize._sum?.size || 0
      }

      characterLogger.info('📝 Personaje actualizado:', { id, data })
      const eventData: EventData = { type: 'update', id }
      eventsService.emit('characters:modified', eventData)
      return characterWithStats
    } catch (error) {
      characterLogger.error('❌ Error al actualizar personaje:', error)
      throw error
    }
  }

  async deleteCharacter(id: string): Promise<void> {
    try {
      await prisma.character.delete({
        where: { id }
      })
      characterLogger.info('🗑️ Personaje eliminado:', id)
      const eventData: EventData = { type: 'delete', id }
      eventsService.emit('characters:modified', eventData)
    } catch (error) {
      characterLogger.error('❌ Error al eliminar personaje:', error)
      throw error
    }
  }

  async addImageToCharacter(characterId: string, fileId: string) {
    try {
      await prisma.character.update({
        where: { id: characterId },
        data: {
          images: {
            connect: { id: fileId }
          }
        }
      })

      characterLogger.info('✨ Imagen agregada al personaje:', {
        characterId,
        fileId,
      })

      const eventData: EventData = { type: 'addImage', objectId: characterId, imageId: fileId }
      eventsService.emit('characters:modified', eventData)
    } catch (error) {
      characterLogger.error('❌ Error al agregar imagen al personaje:', {
        error,
        characterId,
        fileId,
      })
      throw error
    }
  }

  async removeImageFromCharacter(characterId: string, fileId: string): Promise<void> {
    try {
      await prisma.character.update({
        where: { id: characterId },
        data: {
          images: {
            disconnect: { id: fileId }
          }
        }
      })
      characterLogger.info('🗑️ Imagen eliminada del personaje:', { characterId, fileId })
      const eventData: EventData = { type: 'removeImage', objectId: characterId, imageId: fileId }
      eventsService.emit('characters:modified', eventData)
    } catch (error) {
      characterLogger.error('❌ Error al eliminar imagen del personaje:', error)
      throw error
    }
  }

  async getCharacterImages(id: string): Promise<FileItem[]> {
    try {
      const images = await prisma.image.findMany({
        where: {
          characters: {
            some: { id }
          }
        },
        include: {
          collections: {
            select: {
              id: true,
              name: true,
              emoji: true,
              color: true
            }
          },
          tags: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          albums: {
            select: {
              id: true,
              name: true,
              emoji: true,
              color: true
            }
          },
          characters: {
            select: {
              id: true,
              name: true,
              emoji: true,
              color: true
            }
          },
          places: {
            select: {
              id: true,
              name: true,
              emoji: true,
              color: true
            }
          },
          objects: {
            select: {
              id: true,
              name: true,
              emoji: true,
              color: true
            }
          }
        }
      })

      return images.map(image => {
        const metadata = image.metadata ? JSON.parse(image.metadata as string) : undefined
        return {
          id: image.id,
          name: image.name,
          path: image.path,
          type: 'image',
          mimeType: metadata?.mimeType,
          size: image.size,
          width: image.width || undefined,
          height: image.height || undefined,
          metadata,
          thumbnail: image.thumbnail ? Buffer.from(image.thumbnail).toString('base64') : undefined,
          thumbnailSize: image.thumbnailSize || undefined,
          thumbnailWidth: image.thumbnailWidth || undefined,
          thumbnailHeight: image.thumbnailHeight || undefined,
          isFavorite: image.isFavorite || false,
          isPublic: image.isPublic || false,
          createdAt: image.createdAt.toISOString(),
          updatedAt: image.updatedAt.toISOString(),
          collections: image.collections,
          tags: image.tags,
          albums: image.albums,
          characters: image.characters,
          places: image.places,
          objects: image.objects
        }
      })
    } catch (error) {
      characterLogger.error('❌ Error al obtener imágenes del personaje:', error)
      throw error
    }
  }
}

export const characterService = new CharacterService()
export const { addImageToCharacter } = characterService
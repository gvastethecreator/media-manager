import { logger } from '@/lib/logger'
import type { FileItem } from '@/types/file-item'
import {
  getCharacters,
  getCharacter,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  addImageToCharacter,
  removeImageFromCharacter,
  getCharacterImages,
  type CharacterCreate,
  type CharacterUpdate,
  type CharacterWithStats
} from '@/app/actions/character.actions'
import { createBaseStore, type BaseEntity } from './base.store'

const characterLogger = logger.withContext('CharacterStore')

interface Character extends BaseEntity {
  emoji: string
  description?: string
  color: string
  shortcut?: string
  level: number
  class: string
  race: string
  alignment: string
  backstory: string
  stats: string
  sortBy: string
  filters: string
  _count: { images: number }
  totalSize: number
}

interface CharacterState {
  currentCharacter: Character | null
  currentItems: FileItem[]
  addImageToCharacter: (characterId: string, imageId: string) => Promise<void>
  removeImageFromCharacter: (characterId: string, imageId: string) => Promise<void>
  loadCharacterContent: (id: string) => Promise<void>
}

const validateMetadata = (metadata: string | null): Record<string, any> | undefined => {
  if (!metadata) return undefined
  try {
    const parsed = JSON.parse(metadata)
    return typeof parsed === 'object' ? parsed : undefined
  } catch {
    characterLogger.warn('⚠️ Error al parsear metadata de imagen')
    return undefined
  }
}

const convertServerImageToFileItem = (image: Awaited<ReturnType<typeof getCharacterImages>>[0]): FileItem => {
  try {
    const metadata = validateMetadata(image.metadata)
    const thumbnail = image.thumbnail
      ? Buffer.from(image.thumbnail).toString('base64')
      : undefined

    return {
      id: image.id,
      name: image.name,
      path: image.path,
      type: 'image',
      size: image.size,
      width: image.width ?? undefined,
      height: image.height ?? undefined,
      metadata,
      thumbnail,
      thumbnailSize: image.thumbnailSize ?? undefined,
      thumbnailWidth: image.thumbnailWidth ?? undefined,
      thumbnailHeight: image.thumbnailHeight ?? undefined,
      createdAt: image.createdAt.toISOString(),
      updatedAt: image.updatedAt.toISOString(),
      isPublic: image.isPublic ?? false,
      isFavorite: image.isFavorite ?? false,
      folderId: image.folderId,
    }
  } catch (error) {
    characterLogger.error('❌ Error al convertir imagen del servidor:', { error, image })
    throw new Error('Error al procesar imagen del servidor')
  }
}

export const useCharactersStore = createBaseStore<Character>(
  'Character',
  '/api/characters',
  { customLogger: characterLogger }
)((set, get) => ({
  currentCharacter: null,
  currentItems: [],

  // Sobreescribir métodos del BaseStore
  loadItems: async () => {
    try {
      set({ loading: true, error: null })
      const characters = await getCharacters()
      set({ items: characters, loading: false })
      characterLogger.info('📥 Personajes cargados:', { count: characters.length })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: new Error(errorMessage), loading: false })
      characterLogger.error('❌ Error al cargar personajes:', { error })
    }
  },

  createItem: async (data: CharacterCreate) => {
    try {
      set({ loading: true, error: null })
      const character = await createCharacter(data)
      const characterWithStats = {
        ...character,
        _count: { images: 0 },
        totalSize: 0,
      } as Character
      set(state => ({
        items: [...state.items, characterWithStats],
        loading: false
      }))
      characterLogger.info('✨ Personaje creado:', { character })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: new Error(errorMessage), loading: false })
      characterLogger.error('❌ Error al crear personaje:', { error })
    }
  },

  updateItem: async (id: string, data: CharacterUpdate) => {
    try {
      set({ loading: true, error: null })
      const updatedCharacter = await updateCharacter(id, data)
      const currentStats = get().items.find(c => c.id === id)
      const updatedCharacterWithStats = {
        ...updatedCharacter,
        _count: currentStats?._count || { images: 0 },
        totalSize: currentStats?.totalSize || 0,
      } as Character
      set(state => ({
        items: state.items.map(c =>
          c.id === id ? updatedCharacterWithStats : c
        ),
        currentCharacter: state.currentCharacter?.id === id ? updatedCharacterWithStats : state.currentCharacter,
        loading: false
      }))
      characterLogger.info('📝 Personaje actualizado:', { id, data })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: new Error(errorMessage), loading: false })
      characterLogger.error('❌ Error al actualizar personaje:', { id, error })
    }
  },

  deleteItem: async (id: string) => {
    try {
      set({ loading: true, error: null })
      await deleteCharacter(id)
      set(state => ({
        items: state.items.filter(c => c.id !== id),
        currentCharacter: state.currentCharacter?.id === id ? null : state.currentCharacter,
        currentItems: state.currentCharacter?.id === id ? [] : state.currentItems,
        loading: false
      }))
      characterLogger.info('🗑️ Personaje eliminado:', { id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: new Error(errorMessage), loading: false })
      characterLogger.error('❌ Error al eliminar personaje:', { id, error })
    }
  },

  // Métodos específicos de Character
  addImageToCharacter: async (characterId: string, imageId: string) => {
    try {
      await addImageToCharacter(characterId, imageId)
      characterLogger.info('📸 Imagen agregada a personaje:', { characterId, imageId })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: new Error(errorMessage) })
      characterLogger.error('❌ Error al agregar imagen a personaje:', { characterId, imageId, error })
    }
  },

  removeImageFromCharacter: async (characterId: string, imageId: string) => {
    try {
      await removeImageFromCharacter(characterId, imageId)
      set(state => ({
        currentItems: state.currentItems.filter(item => item.id !== imageId)
      }))
      characterLogger.info('🗑️ Imagen eliminada de personaje:', { characterId, imageId })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: new Error(errorMessage) })
      characterLogger.error('❌ Error al eliminar imagen de personaje:', { characterId, imageId, error })
    }
  },

  loadCharacterContent: async (id: string) => {
    try {
      set({ loading: true, error: null })
      const [character, images] = await Promise.all([
        getCharacter(id),
        getCharacterImages(id)
      ])
      if (!character) {
        throw new Error('Personaje no encontrado')
      }

      const fileItems = images.map(convertServerImageToFileItem)

      set({
        currentCharacter: character as Character,
        currentItems: fileItems,
        loading: false
      })
      characterLogger.info('📂 Contenido de personaje cargado:', { id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: new Error(errorMessage), loading: false })
      characterLogger.error('❌ Error al cargar contenido de personaje:', { id, error })
    }
  }
}))
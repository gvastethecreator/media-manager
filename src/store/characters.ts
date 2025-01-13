import { create } from 'zustand'
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

const characterLogger = logger.withContext('CharacterStore')

interface CharactersState {
  characters: CharacterWithStats[]
  currentCharacter: CharacterWithStats | null
  currentItems: FileItem[]
  isLoading: boolean
  error: string | null
  // Acciones
  loadCharacters: () => Promise<void>
  createCharacter: (data: CharacterCreate) => Promise<void>
  updateCharacter: (id: string, data: CharacterUpdate) => Promise<void>
  deleteCharacter: (id: string) => Promise<void>
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

export const useCharactersStore = create<CharactersState>((set, get) => ({
  characters: [],
  currentCharacter: null,
  currentItems: [],
  isLoading: false,
  error: null,

  loadCharacters: async () => {
    try {
      set({ isLoading: true, error: null })
      const characters = await getCharacters()
      set({ characters, isLoading: false })
      characterLogger.info('📥 Personajes cargados:', { count: characters.length })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      characterLogger.error('❌ Error al cargar personajes:', { error })
    }
  },

  createCharacter: async (data: CharacterCreate) => {
    try {
      set({ isLoading: true, error: null })
      const character = await createCharacter(data)
      const characterWithStats = {
        ...character,
        _count: { images: 0 },
        totalSize: 0,
      } as CharacterWithStats
      set(state => ({
        characters: [...state.characters, characterWithStats],
        isLoading: false
      }))
      characterLogger.info('✨ Personaje creado:', { character })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      characterLogger.error('❌ Error al crear personaje:', { error })
    }
  },

  updateCharacter: async (id: string, data: CharacterUpdate) => {
    try {
      set({ isLoading: true, error: null })
      const updatedCharacter = await updateCharacter(id, data)
      const currentStats = get().characters.find(c => c.id === id)
      const updatedCharacterWithStats = {
        ...updatedCharacter,
        _count: currentStats?._count || { images: 0 },
        totalSize: currentStats?.totalSize || 0,
      } as CharacterWithStats
      set(state => ({
        characters: state.characters.map(c =>
          c.id === id ? updatedCharacterWithStats : c
        ),
        currentCharacter: state.currentCharacter?.id === id ? updatedCharacterWithStats : state.currentCharacter,
        isLoading: false
      }))
      characterLogger.info('📝 Personaje actualizado:', { id, data })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      characterLogger.error('❌ Error al actualizar personaje:', { id, error })
    }
  },

  deleteCharacter: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      await deleteCharacter(id)
      set(state => ({
        characters: state.characters.filter(c => c.id !== id),
        currentCharacter: state.currentCharacter?.id === id ? null : state.currentCharacter,
        currentItems: state.currentCharacter?.id === id ? [] : state.currentItems,
        isLoading: false
      }))
      characterLogger.info('🗑️ Personaje eliminado:', { id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      characterLogger.error('❌ Error al eliminar personaje:', { id, error })
    }
  },

  addImageToCharacter: async (characterId: string, imageId: string) => {
    try {
      await addImageToCharacter(characterId, imageId)
      characterLogger.info('📸 Imagen agregada a personaje:', { characterId, imageId })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
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
      set({ error: errorMessage })
      characterLogger.error('❌ Error al eliminar imagen de personaje:', { characterId, imageId, error })
    }
  },

  loadCharacterContent: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      const [character, images] = await Promise.all([
        getCharacter(id),
        getCharacterImages(id)
      ])
      if (!character) {
        throw new Error('Personaje no encontrado')
      }

      const fileItems = images.map(convertServerImageToFileItem)

      set({
        currentCharacter: character,
        currentItems: fileItems,
        isLoading: false
      })
      characterLogger.info('📂 Contenido de personaje cargado:', { id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      characterLogger.error('❌ Error al cargar contenido de personaje:', { id, error })
    }
  }
}))
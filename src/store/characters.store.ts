import { PrismaClient } from '@prisma/client'
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
import { createBaseStore, type BaseEntity, type BaseState, type BaseActions } from './base.store'

const characterLogger = logger.withContext('CharacterStore')

// Extender el tipo base con los campos específicos de Character
interface Character extends BaseEntity {
  emoji: string
  description: string | null
  color: string
  shortcut: string | null
  level: number
  class: string
  race: string
  alignment: string
  backstory: string
  stats: string
  sortBy: string
  filters: string
  _count?: { images: number }
  totalSize?: number
  createdAt: Date
  updatedAt: Date
}

// Estado específico para Character
interface CharacterState extends Omit<BaseState<Character>, 'error'> {
  currentCharacter: Character | null
  currentItems: FileItem[]
  error: Error | null
}

// Acciones específicas para Character
interface CharacterActions extends Omit<BaseActions<Character>, 'createItem' | 'updateItem'> {
  createItem: (data: CharacterCreate) => Promise<void>
  updateItem: (id: string, data: CharacterUpdate) => Promise<void>
  addImageToCharacter: (characterId: string, imageId: string) => Promise<void>
  removeImageFromCharacter: (characterId: string, imageId: string) => Promise<void>
  loadCharacterContent: (id: string) => Promise<void>
}

type CharacterStore = CharacterState & CharacterActions

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

export const useCharactersStore = createBaseStore<Character, 'character'>(
  'character',
  '/api/characters',
  { customLogger: characterLogger }
)((set: (state: Partial<CharacterState>) => void, get: () => CharacterState) => {
  const baseStore: CharacterStore = {
    // Estado inicial
    currentCharacter: null,
    currentItems: [],
    items: [],
    loading: false,
    error: null,
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 50,
    selectedItem: null,
    selectedItems: [],
    lastSelectedItem: null,

    // Sobreescribir métodos del BaseStore
    loadItems: async () => {
      try {
        set({ loading: true, error: null })
        const characters = await getCharacters()
        set({
          items: characters.map(char => ({
            ...char,
            _count: char._count || { images: 0 },
            totalSize: char.totalSize || 0
          })),
          loading: false
        })
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
        const characterWithStats: Character = {
          ...character,
          _count: { images: 0 },
          totalSize: 0,
        }
        set({
          items: [...get().items, characterWithStats],
          loading: false
        })
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
        const currentStats = get().items.find((c: Character) => c.id === id)
        const updatedCharacterWithStats: Character = {
          ...updatedCharacter,
          _count: currentStats?._count || { images: 0 },
          totalSize: currentStats?.totalSize || 0,
        }
        set({
          items: get().items.map((c: Character) =>
            c.id === id ? updatedCharacterWithStats : c
          ),
          currentCharacter: get().currentCharacter?.id === id ? updatedCharacterWithStats : get().currentCharacter,
          loading: false
        })
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
        set({
          items: get().items.filter((c: Character) => c.id !== id),
          currentCharacter: get().currentCharacter?.id === id ? null : get().currentCharacter,
          currentItems: get().currentCharacter?.id === id ? [] : get().currentItems,
          loading: false
        })
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
        set({
          currentItems: get().currentItems.filter((item: FileItem) => item.id !== imageId)
        })
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
    },

    // Implementar métodos requeridos por BaseActions
    loadMoreItems: async () => {
      const state = get()
      if (state.loading || state.currentPage >= state.totalPages) return

      try {
        set({ loading: true })
        const nextPage = state.currentPage + 1
        const response = await fetch(`/api/characters?page=${nextPage}&limit=${state.itemsPerPage}`)

        if (!response.ok) throw new Error('Error al cargar más personajes')

        const data = await response.json()
        characterLogger.info(`✅ ${data.items.length} personajes adicionales cargados`)

        set({
          items: [...state.items, ...data.items],
          currentPage: data.page,
          loading: false
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage), loading: false })
        characterLogger.error('❌ Error al cargar más personajes:', { error })
      }
    },

    refreshItems: async () => {
      set({ selectedItem: null, selectedItems: [], lastSelectedItem: null })
      await baseStore.loadItems()
    },

    selectItem: (item: Character) => {
      set({
        selectedItem: item,
        selectedItems: [...get().selectedItems, item],
        lastSelectedItem: item
      })
    },

    deselectItem: (id: string) => {
      const state = get()
      set({
        selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
        selectedItems: state.selectedItems.filter(item => item.id !== id),
        lastSelectedItem: state.lastSelectedItem?.id === id ? null : state.lastSelectedItem
      })
    },

    toggleItemSelection: (item: Character, isMultiSelect: boolean) => {
      const state = get()
      const isSelected = state.selectedItems.some(i => i.id === item.id)

      if (!isMultiSelect) {
        set({
          selectedItem: isSelected ? null : item,
          selectedItems: isSelected ? [] : [item],
          lastSelectedItem: isSelected ? null : item
        })
        return
      }

      if (isSelected) {
        baseStore.deselectItem(item.id)
      } else {
        baseStore.selectItem(item)
      }
    },

    clearSelection: () => {
      set({
        selectedItem: null,
        selectedItems: [],
        lastSelectedItem: null
      })
    }
  }

  return baseStore
})
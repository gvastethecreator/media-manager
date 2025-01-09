import { create } from 'zustand'
import { logger } from '@/lib/logger'
import type { FileItem } from '@/types/file-item'
import { favoriteService } from '@/services/favorite.service'

const favoritesLogger = logger.withContext('FavoritesStore')

interface FavoritesState {
  items: FileItem[]
  isLoading: boolean
  error: string | null
  // Acciones
  toggleFavorite: (imageId: string) => Promise<void>
  addToFavorites: (imageId: string) => Promise<void>
  removeFromFavorites: (imageId: string) => Promise<void>
  loadFavorites: () => Promise<void>
  isFavorited: (imageId: string) => boolean
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  toggleFavorite: async (imageId: string) => {
    try {
      const isFavorited = get().isFavorited(imageId)
      if (isFavorited) {
        await favoriteService.removeFromFavorites(imageId)
        set(state => ({
          items: state.items.filter(item => item.id !== imageId)
        }))
        favoritesLogger.info('🗑️ Imagen eliminada de favoritos:', { imageId })
      } else {
        const favorite = await favoriteService.addToFavorites(imageId)
        if (favorite.image) {
          set(state => ({
            items: [...state.items, favorite.image]
          }))
          favoritesLogger.info('⭐ Imagen agregada a favoritos:', { imageId })
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
      favoritesLogger.error('❌ Error al gestionar favorito:', { imageId, error })
    }
  },

  addToFavorites: async (imageId: string) => {
    try {
      const favorite = await favoriteService.addToFavorites(imageId)
      if (favorite.image) {
        set(state => ({
          items: [...state.items, favorite.image]
        }))
        favoritesLogger.info('⭐ Imagen agregada a favoritos:', { imageId })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
      favoritesLogger.error('❌ Error al agregar a favoritos:', { imageId, error })
    }
  },

  removeFromFavorites: async (imageId: string) => {
    try {
      await favoriteService.removeFromFavorites(imageId)
      set(state => ({
        items: state.items.filter(item => item.id !== imageId)
      }))
      favoritesLogger.info('🗑️ Imagen eliminada de favoritos:', { imageId })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
      favoritesLogger.error('❌ Error al eliminar de favoritos:', { imageId, error })
    }
  },

  loadFavorites: async () => {
    try {
      set({ isLoading: true, error: null })
      const favorites = await favoriteService.getFavorites()
      const items = favorites.map(f => f.image).filter(Boolean) as FileItem[]
      set({ items, isLoading: false })
      favoritesLogger.info('📥 Favoritos cargados:', { count: items.length })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      favoritesLogger.error('❌ Error al cargar favoritos:', { error })
    }
  },

  isFavorited: (imageId: string) => {
    return get().items.some(item => item.id === imageId)
  }
}))
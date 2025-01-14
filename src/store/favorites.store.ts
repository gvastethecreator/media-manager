import { create } from 'zustand'
import { logger } from '@/lib/logger'
import { getFavorites, toggleFavorite } from '@/app/actions/favorite.actions'

const favoritesLogger = logger.withContext('FavoritesStore')

interface FavoritesState {
  favorites: string[]
  toggleFavorite: (id: string) => Promise<void>
  isFavorited: (id: string) => boolean
  loadFavorites: () => Promise<void>
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  toggleFavorite: async (id: string) => {
    try {
      await toggleFavorite(id)

      // Actualizar el estado local
      set((state) => ({
        favorites: state.favorites.includes(id)
          ? state.favorites.filter((fav) => fav !== id)
          : [...state.favorites, id]
      }))

      favoritesLogger.info('✨ Estado de favorito cambiado:', { id })
    } catch (error) {
      favoritesLogger.error('❌ Error al cambiar estado de favorito:', {
        error,
        id
      })
      throw error
    }
  },
  isFavorited: (id: string) => get().favorites.includes(id),
  loadFavorites: async () => {
    try {
      const favorites = await getFavorites()
      set({ favorites: favorites.map(f => f.imageId) })
      favoritesLogger.info('✅ Favoritos cargados:', { count: favorites.length })
    } catch (error) {
      favoritesLogger.error('❌ Error al cargar favoritos:', error)
      throw error
    }
  }
}))

export const useFavorites = () => {
  const store = useFavoritesStore()
  return {
    toggleFavorite: store.toggleFavorite,
    isFavorited: store.isFavorited
  }
}
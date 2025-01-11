import { create } from 'zustand'
import { logger } from '@/lib/logger'

const placeLogger = logger.withContext('placeLogger')

interface PlaceState {
  places: any[]
  loading: boolean
  error: Error | null
  loadPlaces: () => Promise<void>
  createPlace: (data: any) => Promise<void>
  updatePlace: (id: string, data: any) => Promise<void>
  deletePlace: (id: string) => Promise<void>
}

export const usePlacesStore = create<PlaceState>((set, get) => ({
  places: [],
  loading: false,
  error: null,

  loadPlaces: async () => {
    try {
      set({ loading: true, error: null })
      placeLogger.info('🔄 Cargando lugares...')
      const response = await fetch('/api/places')
      if (!response.ok) throw new Error('Error al cargar lugares')
      const places = await response.json()
      placeLogger.info('✅ Lugares cargados:', places.length)
      set({ places, loading: false })
    } catch (error: any) {
      placeLogger.error('❌ Error al cargar lugares:', error)
      set({ error, loading: false })
    }
  },

  createPlace: async (data) => {
    try {
      set({ loading: true, error: null })
      placeLogger.info('📤 Creando lugar:', data)
      const response = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Error al crear lugar')
      const place = await response.json()
      placeLogger.info('✅ Lugar creado:', place)
      set((state) => ({
        places: [...state.places, place],
        loading: false
      }))
    } catch (error: any) {
      placeLogger.error('❌ Error al crear lugar:', error)
      set({ error, loading: false })
    }
  },

  updatePlace: async (id, data) => {
    try {
      set({ loading: true, error: null })
      placeLogger.info('📤 Actualizando lugar:', { id, data })
      const response = await fetch(`/api/places/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Error al actualizar lugar')
      const updatedPlace = await response.json()
      placeLogger.info('✅ Lugar actualizado:', updatedPlace)
      set((state) => ({
        places: state.places.map((place) =>
          place.id === id ? updatedPlace : place
        ),
        loading: false
      }))
    } catch (error: any) {
      placeLogger.error('❌ Error al actualizar lugar:', error)
      set({ error, loading: false })
    }
  },

  deletePlace: async (id) => {
    try {
      set({ loading: true, error: null })
      placeLogger.info('🗑️ Eliminando lugar:', id)
      const response = await fetch(`/api/places/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Error al eliminar lugar')
      placeLogger.info('✅ Lugar eliminado:', id)
      set((state) => ({
        places: state.places.filter((place) => place.id !== id),
        loading: false
      }))
    } catch (error: any) {
      placeLogger.error('❌ Error al eliminar lugar:', error)
      set({ error, loading: false })
    }
  }
}))
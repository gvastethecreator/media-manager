import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Stats {
  totalFiles: number
  totalSize: number
  totalCollections: number
  totalFolders: number
  totalTags: number
  recentlyAdded: number
  recentlyModified: number
  duplicates: number
}

interface StatsState {
  stats: Stats
  isLoading: boolean
  error: string | null
  initialize: () => Promise<void>
  updateStats: (newStats: Partial<Stats>) => void
}

const initialStats: Stats = {
  totalFiles: 0,
  totalSize: 0,
  totalCollections: 0,
  totalFolders: 0,
  totalTags: 0,
  recentlyAdded: 0,
  recentlyModified: 0,
  duplicates: 0
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set) => ({
      stats: initialStats,
      isLoading: false,
      error: null,

      initialize: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch('/api/stats');
          if (!response.ok) {
            throw new Error('Error al obtener las estadísticas');
          }
          const stats = await response.json();
          set({ stats, isLoading: false });
        } catch (error) {
          console.error('Error initializing stats:', error);
          set({ 
            error: 'Error al cargar las estadísticas',
            isLoading: false 
          });
        }
      },

      updateStats: (newStats) => 
        set((state) => ({
          stats: { ...state.stats, ...newStats }
        }))
    }),
    {
      name: 'stats-storage',
      version: 1,
    }
  )
)

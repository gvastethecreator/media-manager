import { createStoreFactory } from './store.factory';
import { create } from 'zustand';
import { logger } from '@/lib/logger';
import type { BaseEntity } from './types';

const statsLogger = logger.withContext('StatsStore');

// Interfaces existentes
interface FolderStat {
  id: string;
  name: string;
  count: number;
}

interface CollectionStat {
  id: string;
  name: string;
  emoji: string;
  count: number;
}

interface TagStat {
  id: string;
  name: string;
  color: string;
  count: number;
}

interface AlbumStat {
  id: string;
  name: string;
  emoji: string;
  count: number;
}

interface CharacterStat {
  id: string;
  name: string;
  emoji: string;
  count: number;
}

interface PlaceStat {
  id: string;
  name: string;
  emoji: string;
  count: number;
}

interface ObjectStat {
  id: string;
  name: string;
  emoji: string;
  count: number;
}

interface Activity {
  description: string;
  timestamp: string;
  imageId: string;
  imageName: string;
}

// Interfaz base para estadísticas
interface StatsData extends BaseEntity {
  // Conteos básicos
  totalImages: number;
  totalFolders: number;
  totalTags: number;
  totalCollections: number;
  totalFavorites: number;
  totalViews: number;
  totalDownloads: number;
  totalSize: number;
  totalAlbums: number;
  totalCharacters: number;
  totalPlaces: number;
  totalObjects: number;
  totalActivities: number;

  // Listas detalladas
  folders: FolderStat[];
  collections: CollectionStat[];
  tags: TagStat[];
  albums: AlbumStat[];
  characters: CharacterStat[];
  places: PlaceStat[];
  objects: ObjectStat[];
  topTags: TagStat[];
  recentActivity: Activity[];

  // Metadata
  timestamp: number;
}

// Estado extendido específico para Stats
interface StatsFilters {
  filters: {
    startDate: string | null;
    endDate: string | null;
    type: string[];
  };
  refreshInterval: number;
  lastRefresh: number;
  setFilters: (filters: Partial<StatsFilters['filters']>) => void;
  setRefreshInterval: (interval: number) => void;
  updateLastRefresh: () => void;
}

// Tipos para crear y actualizar estadísticas
type StatsCreate = Partial<StatsData>;
type StatsUpdate = Partial<StatsData>;

// Acciones del servidor
const getStats = async () => {
  try {
    const response = await fetch('/api/stats');
    if (!response.ok) throw new Error('Error al obtener estadísticas');
    const data = await response.json();
    return [{
      id: 'stats',
      name: 'Estadísticas',
      ...data
    }];
  } catch (error) {
    statsLogger.error('Error al obtener estadísticas:', error);
    throw error;
  }
};

const updateStats = async (id: string, data: StatsUpdate) => {
  try {
    const response = await fetch(`/api/stats/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al actualizar estadísticas');
    const updatedData = await response.json();
    return {
      id: 'stats',
      name: 'Estadísticas',
      ...updatedData
    };
  } catch (error) {
    statsLogger.error('Error al actualizar estadísticas:', error);
    throw error;
  }
};

// Crear el store base usando StoreFactory
export const useStatsBaseStore = createStoreFactory<StatsData, {}, StatsCreate, StatsUpdate>(
  {
    name: 'stats',
    logger: statsLogger,
    initialState: {
      items: [],
      loading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 1,
      selectedItem: null,
      selectedItems: [],
      lastSelectedItem: null
    },
    actions: {
      beforeCreate: async (data) => {
        // Validaciones antes de crear
        if (!data.timestamp) {
          data.timestamp = Date.now();
        }
        return data;
      },
      afterCreate: async (stats) => {
        statsLogger.info('Estadísticas creadas exitosamente', { stats });
      },
      beforeUpdate: async (id, data) => {
        // Validaciones antes de actualizar
        if (data.timestamp === undefined) {
          data.timestamp = Date.now();
        }
        return data;
      },
      afterUpdate: async (stats) => {
        statsLogger.info('Estadísticas actualizadas exitosamente', { stats });
      }
    }
  },
  {
    getItems: getStats,
    updateItem: updateStats,
    createItem: async () => {
      throw new Error('No se pueden crear estadísticas manualmente');
    },
    deleteItem: async () => {
      throw new Error('No se pueden eliminar estadísticas manualmente');
    }
  }
);

// Crear el store para el estado extendido
export const useStatsFiltersStore = create<StatsFilters>((set) => ({
  filters: {
    startDate: null,
    endDate: null,
    type: []
  },
  refreshInterval: 60000,
  lastRefresh: Date.now(),

  setFilters: (filters) => set((state) => ({
    ...state,
    filters: { ...state.filters, ...filters }
  })),

  setRefreshInterval: (interval) => set((state) => ({
    ...state,
    refreshInterval: interval
  })),

  updateLastRefresh: () => set((state) => ({
    ...state,
    lastRefresh: Date.now()
  }))
}));

// Hook personalizado para facilitar el uso
export const useStats = () => {
  const baseStore = useStatsBaseStore();
  const filtersStore = useStatsFiltersStore();

  return {
    stats: baseStore.items[0], // Siempre usamos el primer item ya que solo hay un conjunto de estadísticas
    loading: baseStore.loading,
    error: baseStore.error,
    refresh: baseStore.refreshItems,
    updateStats: baseStore.updateItem,
    filters: filtersStore.filters,
    refreshInterval: filtersStore.refreshInterval,
    lastRefresh: filtersStore.lastRefresh,
    setFilters: filtersStore.setFilters,
    setRefreshInterval: filtersStore.setRefreshInterval,
    updateLastRefresh: filtersStore.updateLastRefresh
  };
};

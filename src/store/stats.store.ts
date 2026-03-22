import { create } from 'zustand';
// Se sustituye el uso de servicios por el cliente de API
import { getSystemStatsFromApi, invalidateStatsInApi } from '@/lib/api/client/stats.client';
import { clientLogger } from '@/lib/logger/client-logger';
import type { BaseEntity } from './types';

const statsLogger = clientLogger.withContext('StatsStore');

// Interfaces existentes
interface FolderStat {
	count: number;
	id: string;
	name: string;
}

interface CollectionStat {
	count: number;
	emoji: string;
	id: string;
	name: string;
}

interface TagStat {
	color: string | undefined;
	count: number;
	id: string;
	name: string;
}

interface AlbumStat {
	count: number;
	emoji: string;
	id: string;
	name: string;
}

interface CharacterStat {
	count: number;
	emoji: string;
	id: string;
	name: string;
}

interface PlaceStat {
	count: number;
	emoji: string;
	id: string;
	name: string;
}

interface WorldItemStat {
	count: number;
	emoji: string;
	id: string;
	name: string;
}

interface Activity {
	createdAt: Date;
	description: string;
	id: string;
	image: {
		id: string;
		name: string;
		thumbnail: Uint8Array | null;
	} | null;
	type: string;
}

// Interfaz base para estadísticas
interface StatsData extends BaseEntity {
	albums: AlbumStat[];
	characters: CharacterStat[];
	collections: CollectionStat[];
	// Metadatos de entidad
	createdAt: Date;

	// Listas detalladas
	folders: FolderStat[];
	places: PlaceStat[];
	recentActivity: Activity[];
	tags: TagStat[];

	// Metadata
	timestamp: number;
	topTags: TagStat[];
	totalActivities: number;
	totalAlbums: number;
	totalAudio: number;
	totalCharacters: number;
	totalCollections: number;
	totalDocuments: number;
	totalDownloads: number;
	totalFavorites: number;
	totalFile3D: number;
	totalFolders: number;

	// Conteos básicos
	totalImages: number;
	totalJsonFiles: number;
	totalPlaces: number;
	totalSize: number;
	totalTags: number;
	totalViews: number;
	totalWorldItems: number;
	updatedAt: Date;
	worldItems: WorldItemStat[];
}

// Estado extendido específico para Stats
interface StatsFilters {
	filters: {
		startDate: string | null;
		endDate: string | null;
		type: string[];
	};
	lastRefresh: number;
	refreshInterval: number;
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
		const data = await getSystemStatsFromApi();
		if (!data) {
			throw new Error('No se pudieron obtener las estadísticas');
		}
		return [
			{
				id: 'stats',
				name: 'Estadísticas',
				...data,
			},
		];
	} catch (error) {
		statsLogger.error('Error al obtener estadísticas:', error);
		throw error;
	}
};

const updateStats = async (_id: string, _data: StatsUpdate) => {
	try {
		await invalidateStatsInApi();
		const data = await getSystemStatsFromApi();
		if (!data) {
			throw new Error('Error al actualizar estadísticas');
		}
		return {
			id: 'stats',
			name: 'Estadísticas',
			...data,
		};
	} catch (error) {
		statsLogger.error('Error al actualizar estadísticas:', error);
		throw error;
	}
};

// Crear el store usando Zustand directamente
export const useStatsBaseStore = create<{
	stats: StatsData | null;
	loading: boolean;
	error: string | null;
	fetchStats: () => Promise<void>;
	updateStats: (data: StatsUpdate) => Promise<void>;
}>((set, _get) => ({
	stats: null,
	loading: false,
	error: null,
	fetchStats: async () => {
		set({ loading: true, error: null });
		try {
			const data = await getSystemStatsFromApi();
			if (!data) {
				throw new Error('No se pudieron obtener las estadísticas');
			}
			set({
				stats: {
					id: 'stats',
					name: 'Estadísticas',
					...data,
					// Propiedades adicionales requeridas por StatsData
					totalFavorites: 0,
					totalViews: 0,
					totalDownloads: 0,
					totalSize: data.storageUsed || 0,
					totalPlaces: 0,
					totalWorldItems: 0,
					totalActivities: 0,
					totalDocuments: 0,
					totalJsonFiles: 0,
					totalFile3D: 0,
					// Listas detalladas
					folders: [],
					collections: [],
					tags: [],
					albums: [],
					characters: [],
					places: [],
					worldItems: [],
					topTags: [],
					recentActivity: [],
					// Metadata
					timestamp: Date.now(),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				loading: false,
			});
		} catch (error) {
			statsLogger.error('Error al obtener estadísticas:', error);
			set({ error: error instanceof Error ? error.message : 'Error desconocido', loading: false });
		}
	},
	updateStats: async (_data: StatsUpdate) => {
		set({ loading: true, error: null });
		try {
			await invalidateStatsInApi();
			const updatedData = await getSystemStatsFromApi();
			if (!updatedData) {
				throw new Error('Error al actualizar estadísticas');
			}
			set({
				stats: {
					id: 'stats',
					name: 'Estadísticas',
					...updatedData,
					// Propiedades adicionales requeridas por StatsData
					totalFavorites: 0,
					totalViews: 0,
					totalDownloads: 0,
					totalSize: updatedData.storageUsed || 0,
					totalPlaces: 0,
					totalWorldItems: 0,
					totalActivities: 0,
					totalDocuments: 0,
					totalJsonFiles: 0,
					totalFile3D: 0,
					// Listas detalladas
					folders: [],
					collections: [],
					tags: [],
					albums: [],
					characters: [],
					places: [],
					worldItems: [],
					topTags: [],
					recentActivity: [],
					// Metadata
					timestamp: Date.now(),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				loading: false,
			});
			statsLogger.info('Estadísticas actualizadas exitosamente');
		} catch (error) {
			statsLogger.error('Error al actualizar estadísticas:', error);
			set({ error: error instanceof Error ? error.message : 'Error desconocido', loading: false });
		}
	},
}));

// Crear el store para el estado extendido
export const useStatsFiltersStore = create<StatsFilters>((set) => ({
	filters: {
		startDate: null,
		endDate: null,
		type: [],
	},
	refreshInterval: 60_000,
	lastRefresh: Date.now(),

	setFilters: (filters) =>
		set((state) => ({
			...state,
			filters: { ...state.filters, ...filters },
		})),

	setRefreshInterval: (interval) =>
		set((state) => ({
			...state,
			refreshInterval: interval,
		})),

	updateLastRefresh: () =>
		set((state) => ({
			...state,
			lastRefresh: Date.now(),
		})),
}));

// Hook personalizado para facilitar el uso
export const useStats = () => {
	const baseStore = useStatsBaseStore();
	const filtersStore = useStatsFiltersStore();

	return {
		stats: baseStore.stats,
		loading: baseStore.loading,
		error: baseStore.error,
		refresh: baseStore.fetchStats,
		updateStats: baseStore.updateStats,
		filters: filtersStore.filters,
		refreshInterval: filtersStore.refreshInterval,
		lastRefresh: filtersStore.lastRefresh,
		setFilters: filtersStore.setFilters,
		setRefreshInterval: filtersStore.setRefreshInterval,
		updateLastRefresh: filtersStore.updateLastRefresh,
	};
};

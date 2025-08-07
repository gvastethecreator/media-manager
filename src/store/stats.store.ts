import { create } from 'zustand';
// Se sustituye el uso de servicios por el cliente de API
import { getSystemStatsFromApi, invalidateStatsInApi } from '@/lib/api/client/stats.client';
import { clientLogger } from '@/lib/logger/client-logger';
import type { BaseEntity } from './types';

const statsLogger = clientLogger.withContext('StatsStore');

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
	color: string | undefined;
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

interface WorldItemStat {
	id: string;
	name: string;
	emoji: string;
	count: number;
}

interface Activity {
	id: string;
	type: string;
	description: string;
	createdAt: Date;
	image: {
		id: string;
		name: string;
		thumbnail: Uint8Array | null;
	} | null;
}

// Interfaz base para estadísticas
interface StatsData extends BaseEntity {
	// Metadatos de entidad
	createdAt: Date;
	updatedAt: Date;

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
	totalWorldItems: number;
	totalActivities: number;
	totalDocuments: number;
	totalAudio: number;
	totalJsonFiles: number;
	totalWorkflows: number;
	totalFile3D: number;

	// Listas detalladas
	folders: FolderStat[];
	collections: CollectionStat[];
	tags: TagStat[];
	albums: AlbumStat[];
	characters: CharacterStat[];
	places: PlaceStat[];
	worldItems: WorldItemStat[];
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
		const data = await getSystemStatsFromApi();
		if (!data) throw new Error('No se pudieron obtener las estadísticas');
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
		if (!data) throw new Error('Error al actualizar estadísticas');
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
			if (!data) throw new Error('No se pudieron obtener las estadísticas');
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
					totalWorkflows: 0,
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
			if (!updatedData) throw new Error('Error al actualizar estadísticas');
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
					totalWorkflows: 0,
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

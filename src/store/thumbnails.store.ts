import { create } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';
import type { ThumbnailStats } from '@/types/thumbnails';

export interface ProcessStatus {
	current?: number;
	currentFile?: string;
	lastProcessed?: {
		id: string;
		path: string;
		processedAt: string;
		saved?: number;
	};
	progress: number;
	status: string;
	total?: number;
}

interface ThumbnailStore {
	error: string | null;
	initialize: () => Promise<void>;
	isLoading: boolean;
	isProcessing: boolean;
	processStatus: ProcessStatus;
	reset: () => void;
	setError: (error: string | null) => void;
	setLoading: (loading: boolean) => void;
	setProcessing: (processing: boolean) => void;
	setProcessStatus: (status: Partial<ProcessStatus>) => void;
	setStats: (stats: Partial<ThumbnailStats>) => void;
	stats: ThumbnailStats;
}

const initialStats: ThumbnailStats = {
	total: 0,
	processed: 0,
	failed: 0,
	pending: 0,
	totalSize: 0,
	processedSize: 0,
	totalFiles: 0,
	errors: [],
	averageProcessingTime: 0,
};

const initialProcessStatus: ProcessStatus = {
	status: '',
	progress: 0,
};

const THUMBNAILS_BASE_URL = '/api/thumbnails';

export const useThumbnailStore = create<ThumbnailStore>((set, get) => ({
	isLoading: true,
	isProcessing: false,
	error: null,
	stats: initialStats,
	processStatus: initialProcessStatus,

	setLoading: (loading) => set({ isLoading: loading }),

	setProcessing: (processing) =>
		set((_state) => {
			if (!processing) {
				return {
					isProcessing: false,
					processStatus: initialProcessStatus,
				};
			}
			return { isProcessing: true };
		}),

	setError: (error) =>
		set((state) => ({
			error,
			isProcessing: error ? false : state.isProcessing,
			processStatus: error ? initialProcessStatus : state.processStatus,
		})),

	setStats: (stats) =>
		set((state) => ({
			stats: {
				...state.stats,
				...stats,
				errors: stats.errors || state.stats.errors,
			},
		})),

	setProcessStatus: (status) =>
		set((state) => ({
			processStatus: {
				...state.processStatus,
				...status,
				progress: status.progress ?? state.processStatus.progress,
				status: status.status || state.processStatus.status,
			},
		})),

	initialize: async () => {
		const store = get();
		try {
			store.setLoading(true);
			store.setError(null);

			// Intentar obtener estadísticas con reintentos
			let retries = 3;
			let stats = null;
			let _lastError = null;

			while (retries > 0 && !stats) {
				try {
					const response = await fetch(`${THUMBNAILS_BASE_URL}/stats`);
					if (!response.ok) {
						throw new Error('Error al obtener estadísticas de miniaturas');
					}
					stats = (await response.json()) as ThumbnailStats;
					break;
				} catch (error) {
					_lastError = error;
					retries--;
					// Esperar antes de reintentar
					if (retries > 0) {
						await new Promise((resolve) => setTimeout(resolve, 1000));
					}
				}
			}

			if (stats) {
				store.setStats(stats);
			} else {
				// Si después de los reintentos no se pudo obtener, establecer un error amigable
				throw new Error('No se pudieron cargar las estadísticas de miniaturas. Por favor, intenta más tarde.');
			}
		} catch (error) {
			clientLogger.error('Error inicializando thumbnails:', error);
			store.setError(error instanceof Error ? error.message : 'Error desconocido');
			// Establecer estadísticas vacías para evitar errores en la UI
			store.setStats(initialStats);
		} finally {
			store.setLoading(false);
		}
	},

	reset: () =>
		set({
			isLoading: false,
			isProcessing: false,
			error: null,
			stats: initialStats,
			processStatus: initialProcessStatus,
		}),
}));

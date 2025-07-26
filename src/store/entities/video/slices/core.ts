/**
 * @file Slice principal para operaciones CRUD del store de videos
 * @module store/entities/video/slices/core
 * @description Core slice optimizado con patrón VideoWithStats y Record
 * Última refactorización: 2025-01-27
 */

import type { StateCreator } from 'zustand';
// Refactor 2025-07: se reemplazan servicios por cliente API
// Refactor 2025-07: se reemplazan servicios por cliente API
import { createVideoInApi, deleteVideoFromApi, findVideosInApi, getVideoFromApi } from '@/lib/api/client/video.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';
import type { VideoCreateInput, VideoFilters, VideoWithStats } from '@/types/entities/video';
import type { VideoStore } from '..';

export interface VideoCoreState {
	/** 🎬 Mapa de videos indexados por ID (Record optimizado) */
	videos: Record<string, VideoWithStats>;
	/** 📁 Items asociados a cada folder */
	folderVideos: Record<string, string[]>; // folderId -> videoIds[]
	/** ⏳ Estado de carga */
	isLoading: boolean;
	/** ❌ Error si existe */
	error: string | null;
	/** 📅 Fecha de última actualización */
	lastUpdated: Date | null;
}

// Estado inicial optimizado
export const initialCoreState: VideoCoreState = {
	videos: {},
	folderVideos: {},
	isLoading: false,
	error: null,
	lastUpdated: null,
};

// Logger específico
const videoLogger = clientLogger.withContext('VideoStore:Core');

// --- Slice Interface ---

export interface VideoCoreSlice extends VideoCoreState {
	// 🔍 Getters optimizados (acceso O(1))
	getVideo: (id: string) => VideoWithStats | undefined;
	getVideos: () => VideoWithStats[];
	getVideosByFolder: (folderId: string) => VideoWithStats[];

	// 🎯 Selectores avanzados
	selectVideos: (options?: {
		filters?: Partial<VideoFilters>;
		sortBy?: keyof VideoWithStats;
		sortDirection?: 'asc' | 'desc';
	}) => VideoWithStats[];

	// ⚡ Operaciones síncronas optimizadas
	addVideo: (video: VideoWithStats) => void;
	addVideos: (videos: VideoWithStats[]) => void;
	updateVideo: (id: string, data: Partial<VideoWithStats>) => void;
	deleteVideo: (id: string) => void;

	// 📊 Estado de carga y errores
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;

	// 🌐 Acciones asíncronas
	fetchVideo: (id: string) => Promise<VideoWithStats | undefined>;
	fetchVideos: (folderIds?: string[]) => Promise<VideoWithStats[]>;
	createVideo: (data: VideoCreateInput) => Promise<VideoWithStats | undefined>;
	removeVideo: (id: string) => Promise<boolean>;
}

// --- Implementación del Slice ---

export const createVideoCoreSlice: StateCreator<VideoStore, [], [], VideoCoreSlice> = (set, get) => ({
	...initialCoreState,

	// --- Getters Optimizados ---
	getVideo: (id) => get().videos[id],

	getVideos: () => Object.values(get().videos),

	getVideosByFolder: (folderId) => {
		const videoIds = get().folderVideos[folderId] || [];
		const videos = get().videos;
		return videoIds.map((id) => videos[id]).filter(Boolean);
	},

	// --- Selectores Avanzados ---
	selectVideos: (options = {}) => {
		const videos = Object.values(get().videos);
		let filtered = videos;

		// Aplicar filtros si se proporcionan
		if (options.filters) {
			const { filters } = options;

			filtered = videos.filter((video) => {
				// Filtro de búsqueda
				if (filters.search) {
					const searchLower = filters.search.toLowerCase();
					const matchesName = video.name.toLowerCase().includes(searchLower);
					const matchesDescription = video.description?.toLowerCase().includes(searchLower);
					if (!matchesName && !matchesDescription) return false;
				}

				// Filtro de favoritos
				if (filters.isFavorite !== undefined && video.isFavorite !== filters.isFavorite) {
					return false;
				}

				// Filtro de público/privado
				if (filters.isPublic !== undefined && video.isPublic !== filters.isPublic) {
					return false;
				}

				// Filtros de duración
				if (filters.minDuration && video.duration < filters.minDuration) return false;
				if (filters.maxDuration && video.duration > filters.maxDuration) return false;

				// Filtros de tamaño
				if (filters.minSize && video.size < filters.minSize) return false;
				if (filters.maxSize && video.size > filters.maxSize) return false;

				// Filtros de resolución
				if (filters.minWidth && (!video.width || video.width < filters.minWidth)) return false;
				if (filters.maxWidth && (!video.width || video.width > filters.maxWidth)) return false;
				if (filters.minHeight && (!video.height || video.height < filters.minHeight)) return false;
				if (filters.maxHeight && (!video.height || video.height > filters.maxHeight)) return false;

				// Filtros técnicos
				if (filters.hasMetadata !== undefined) {
					const hasMetadata = !!video.metadata;
					if (hasMetadata !== filters.hasMetadata) return false;
				}

				if (filters.hasThumbnail !== undefined) {
					const hasThumbnail = !!video.thumbnail;
					if (hasThumbnail !== filters.hasThumbnail) return false;
				}

				return true;
			});
		}

		// Aplicar ordenación
		if (options.sortBy) {
			const { sortBy, sortDirection = 'asc' } = options;
			filtered.sort((a, b) => {
				const aVal = a[sortBy];
				const bVal = b[sortBy];

				if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
				if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
				return 0;
			});
		}

		return filtered;
	},

	// --- Operaciones Síncronas ---
	addVideo: (video) => {
		set((state) => {
			const newVideos = { ...state.videos, [video.id]: video };

			// Actualizar índice por folder
			const folderVideos = { ...state.folderVideos };
			const folderId = video.folderId;
			if (!folderVideos[folderId]) {
				folderVideos[folderId] = [];
			}
			if (!folderVideos[folderId].includes(video.id)) {
				folderVideos[folderId] = [...folderVideos[folderId], video.id];
			}

			return {
				videos: newVideos,
				folderVideos,
				lastUpdated: new Date(),
			};
		});
	},

	addVideos: (videos) => {
		set((state) => {
			// Convertir array a Record optimizado
			const newVideos: Record<string, VideoWithStats> = { ...state.videos };
			const folderVideos = { ...state.folderVideos };

			videos.forEach((video: typeof videos[0]) => {
				newVideos[video.id] = video;

				// Actualizar índice por folder
				const folderId = video.folderId;
				if (!folderVideos[folderId]) {
					folderVideos[folderId] = [];
				}
				if (!folderVideos[folderId].includes(video.id)) {
					folderVideos[folderId] = [...folderVideos[folderId], video.id];
				}
			});

			return {
				videos: newVideos,
				folderVideos,
				lastUpdated: new Date(),
			};
		});
	},

	updateVideo: (id, data) => {
		set((state) => {
			const existingVideo = state.videos[id];
			if (!existingVideo) return state;

			const updatedVideo = { ...existingVideo, ...data };

			return {
				videos: {
					...state.videos,
					[id]: updatedVideo,
				},
				lastUpdated: new Date(),
			};
		});
	},

	deleteVideo: (id) => {
		set((state) => {
			const video = state.videos[id];
			if (!video) return state;

			// Eliminar del Record principal
			const { [id]: _, ...remainingVideos } = state.videos;

			// Eliminar del índice de folder
			const folderVideos = { ...state.folderVideos };
			const folderId = video.folderId;
			if (folderVideos[folderId]) {
				folderVideos[folderId] = folderVideos[folderId].filter((videoId) => videoId !== id);
			}

			return {
				videos: remainingVideos,
				folderVideos,
				lastUpdated: new Date(),
			};
		});
	},

	// --- Estado de carga y errores ---
	setLoading: (isLoading) => set({ isLoading }),
	setError: (error) => set({ error }),

	// --- Acciones Asíncronas ---
	fetchVideo: async (id) => {
		get().setLoading(true);
		try {
			const video = await getVideoFromApi(id);
			if (video) {
				get().addVideo(video);
			}
			return video;
		} catch (e) {
			videoLogger.error('Failed to fetch video', { error: e });
			const errorMessage = e instanceof Error ? e.message : 'Failed to fetch video';
			get().setError(errorMessage);
			return undefined;
		} finally {
			get().setLoading(false);
		}
	},

	fetchVideos: async (folderIds) => {
		get().setLoading(true);
		try {
			const videos = await findVideosInApi({ folderIds });
			if (videos && videos.length > 0) {
				get().addVideos(videos);
			}
			return videos || [];
		} catch (e) {
			videoLogger.error('Failed to fetch videos', { error: e });
			const errorMessage = e instanceof Error ? e.message : 'Failed to fetch videos';
			get().setError(errorMessage);
			return [];
		} finally {
			get().setLoading(false);
		}
	},

	createVideo: async (data) => {
		get().setLoading(true);
		try {
			const video = await createVideoInApi(data);
			if (video) {
				get().addVideo(video);
				toastService.success('Video creado');
			}
			return video;
		} catch (e) {
			videoLogger.error('Failed to create video', { error: e });
			const errorMessage = e instanceof Error ? e.message : 'Error creating video';
			toastService.error(errorMessage);
			get().setError(errorMessage);
			return undefined;
		} finally {
			get().setLoading(false);
		}
	},

	removeVideo: async (id) => {
		get().setLoading(true);
		try {
			await deleteVideoFromApi(id);
			get().deleteVideo(id);
			toastService.success('Video eliminado');
			return true;
		} catch (e) {
			videoLogger.error('Failed to delete video', { error: e });
			const errorMessage = e instanceof Error ? e.message : 'Error deleting video';
			toastService.error(errorMessage);
			get().setError(errorMessage);
			return false;
		} finally {
			get().setLoading(false);
		}
	},
});

/**
 * @file Slice principal para operaciones CRUD del store de videos
 * @module store/entities/video/slices/core
 */

import type { StateCreator } from 'zustand';
import {
	createVideo as createServerVideo,
	deleteVideo as deleteServerVideo,
	findVideos,
	getVideo as getServerVideo,
} from '@/app/actions/videos/video.actions';
import {
	getVideoVisualConfig,
	updateVideoVisualConfig as updateVideoVisualConfigAction,
} from '@/app/actions/videos/video-visual-config.actions';
import { mapVideoVisualConfigCompleteUpdateToPrisma } from '../../../../transformers/video/mappers';
import {
	transformVideo,
	transformVideos,
	transformVideosWithStats,
	transformVideoWithStats,
} from '../../../../transformers/video/serializers';
import type {
	CreateVideoData,
	UpdateVideoData,
	Video,
	VideoBase,
	VideoComplete,
	VideoFilters,
	VideoVisualConfig,
} from '../../../../types/entities/video';
import type { VideoState } from '../types';

// Slice para operaciones CRUD básicas
export interface VideoCoreSlice {
	// Getters básicos
	getVideo: (id: string) => Video | undefined;
	getVideos: () => Video[];
	getVideosByFolder: (folderId: string) => Video[];

	// Selectores avanzados
	selectVideos: (options?: {
		withStats?: boolean;
		filters?: VideoFilters;
		sortBy?: keyof VideoComplete;
		sortDirection?: 'asc' | 'desc';
	}) => Video[];
	selectVideosByFolder: (
		folderId: string,
		options?: {
			withStats?: boolean;
			filters?: VideoFilters;
			sortBy?: keyof VideoComplete;
			sortDirection?: 'asc' | 'desc';
		}
	) => Video[];
	selectVideoById: (id: string, options?: { withStats?: boolean }) => Video | undefined;

	// Operaciones
	addVideo: (video: VideoBase) => void;
	addVideos: (videos: VideoBase[]) => void;
	updateVideo: (id: string, data: UpdateVideoData) => void;
	deleteVideo: (id: string) => void;

	// Estado de carga
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;

	// Acciones asíncronas
	fetchVideo: (id: string) => Promise<Video | undefined>;
	fetchVideos: (folderIds?: string[]) => Promise<Video[]>;
	createVideo: (data: CreateVideoData) => Promise<Video | undefined>;
	removeVideo: (id: string) => Promise<boolean>;

	// Visual Config
	updateVideoVisualConfig: (
		videoId: string,
		config: Partial<VideoVisualConfig>
	) => Promise<VideoVisualConfig | undefined>;
	fetchVideoVisualConfig: (videoId: string) => Promise<VideoVisualConfig | undefined>;
}

// Creador del slice
export const createVideoCoreSlice: StateCreator<VideoState, [], [], VideoCoreSlice> = (set, get) => ({
	// Getters básicos
	getVideo: (id: string) => {
		return get().core.videos[id];
	},

	getVideos: () => {
		return Object.values(get().core.videos);
	},

	getVideosByFolder: (folderId: string) => {
		return Object.values(get().core.videos).filter((video) => video.folderId === folderId);
	},

	// Selectores avanzados
	selectVideos: (options = {}) => {
		const { withStats = false, filters = {}, sortBy = 'updatedAt', sortDirection = 'desc' } = options;
		let videos = Object.values(get().core.videos);

		// Aplicar filtros
		if (filters) {
			videos = applyVideoFilters(videos, filters);
		}

		// Ordenar
		videos = videos.sort((a, b) => {
			const valueA = a[sortBy as keyof Video];
			const valueB = b[sortBy as keyof Video];

			if (typeof valueA === 'string' && typeof valueB === 'string') {
				return sortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
			}

			// Para fechas y números
			return sortDirection === 'asc' ? (valueA < valueB ? -1 : 1) : valueA > valueB ? -1 : 1;
		});

		// Aplicar estadísticas si se requiere
		if (withStats) {
			return transformVideosWithStats(videos, { safe: true, defaultValue: [] });
		}

		return videos;
	},

	selectVideosByFolder: (folderId, options = {}) => {
		const { withStats = false, filters = {}, sortBy = 'updatedAt', sortDirection = 'desc' } = options;

		// Filtrar por carpeta
		const folderFilters = { ...filters, folderId };
		return get().selectVideos({ withStats, filters: folderFilters, sortBy, sortDirection });
	},

	selectVideoById: (id, options = {}) => {
		const { withStats = false } = options;
		const video = get().core.videos[id];

		if (!video) return undefined;

		if (withStats) {
			return transformVideoWithStats(video, { safe: true, defaultValue: undefined });
		}

		return video;
	},

	// Operaciones síncronas
	addVideo: (video: VideoBase) => {
		try {
			const extendedVideo = transformVideo(video, { safe: true });
			if (!extendedVideo) return;

			set((state) => ({
				core: {
					...state.core,
					videos: {
						...state.core.videos,
						[video.id]: extendedVideo,
					},
					lastUpdated: Date.now(),
				},
			}));
		} catch (error) {
			console.error('Error al añadir video al store:', error);
		}
	},

	addVideos: (videos: VideoBase[]) => {
		try {
			const extendedVideos = transformVideos(videos, { safe: true });
			if (!extendedVideos.length) return;

			const videosMap = extendedVideos.reduce(
				(acc, video) => {
					if (video?.id) {
						acc[video.id] = video;
					}
					return acc;
				},
				{} as Record<string, Video>
			);

			set((state) => ({
				core: {
					...state.core,
					videos: {
						...state.core.videos,
						...videosMap,
					},
					lastUpdated: Date.now(),
				},
			}));
		} catch (error) {
			console.error('Error al añadir múltiples videos al store:', error);
		}
	},

	updateVideo: (id: string, data: UpdateVideoData) => {
		set((state) => {
			const video = state.core.videos[id];
			if (!video) return state;

			return {
				core: {
					...state.core,
					videos: {
						...state.core.videos,
						[id]: {
							...video,
							...data,
						},
					},
					lastUpdated: Date.now(),
				},
			};
		});
	},

	deleteVideo: (id: string) => {
		set((state) => {
			const newVideos = { ...state.core.videos };
			delete newVideos[id];

			return {
				core: {
					...state.core,
					videos: newVideos,
					lastUpdated: Date.now(),
				},
			};
		});
	},

	// Estado de carga
	setLoading: (isLoading: boolean) => {
		set((state) => ({
			core: {
				...state.core,
				isLoading,
			},
		}));
	},

	setError: (error: string | null) => {
		set((state) => ({
			core: {
				...state.core,
				error,
			},
		}));
	},

	// Operaciones asíncronas (simuladas, se implementarán con llamadas reales a la API)
	fetchVideo: async (id: string) => {
		const { setLoading, setError, addVideo } = get();
		try {
			setLoading(true);
			const video = await getServerVideo(id);
			if (video) {
				addVideo(video);
			}
			return get().core.videos[id];
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Error desconocido');
			return undefined;
		} finally {
			setLoading(false);
		}
	},

	fetchVideos: async (folderIds?: string[]) => {
		const { setLoading, setError, addVideos } = get();
		try {
			setLoading(true);
			const filters = folderIds && folderIds.length > 0 ? { folderId: folderIds[0] } : {};
			const result = await findVideos(filters);
			addVideos(result.data);
			return Object.values(get().core.videos);
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Error desconocido');
			return [];
		} finally {
			setLoading(false);
		}
	},

	createVideo: async (data: CreateVideoData) => {
		const { setLoading, setError, addVideo } = get();
		try {
			setLoading(true);
			const createdVideo = await createServerVideo(data);
			addVideo(createdVideo);
			return get().core.videos[createdVideo.id];
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Error desconocido');
			return undefined;
		} finally {
			setLoading(false);
		}
	},

	removeVideo: async (id: string) => {
		const { setLoading, setError, deleteVideo } = get();
		try {
			setLoading(true);
			await deleteServerVideo(id);
			deleteVideo(id);
			return true;
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Error desconocido');
			return false;
		} finally {
			setLoading(false);
		}
	},

	updateVideoVisualConfig: async (videoId: string, config: Partial<VideoVisualConfig>) => {
		try {
			const prismaData = mapVideoVisualConfigCompleteUpdateToPrisma(config);
			const updated = await updateVideoVisualConfigAction(videoId, prismaData);
			return updated;
		} catch (error) {
			console.error('Error al actualizar configuración visual:', error);
			return undefined;
		}
	},

	fetchVideoVisualConfig: async (videoId: string) => {
		try {
			const result = await getVideoVisualConfig(videoId);
			return result;
		} catch (error) {
			console.error('Error al obtener configuración visual:', error);
			return undefined;
		}
	},
});

/**
 * 🔍 Aplica filtros a un array de videos
 * @param videos Array de videos a filtrar
 * @param filters Filtros a aplicar
 * @returns Videos filtrados
 */
function applyVideoFilters(videos: Video[], filters: VideoFilters): Video[] {
	let filtered = [...videos];

	// Filtro por búsqueda
	if (filters.search) {
		const searchTerm = filters.search.toLowerCase();
		filtered = filtered.filter(
			(video) =>
				video.name.toLowerCase().includes(searchTerm) || video.description?.toLowerCase().includes(searchTerm) || false
		);
	}

	// Filtro por carpeta
	if (filters.folderId) {
		filtered = filtered.filter((video) => video.folderId === filters.folderId);
	}

	// Filtro por favoritos
	if (filters.isFavorite !== undefined) {
		filtered = filtered.filter((video) => video.isFavorite === filters.isFavorite);
	}

	// Filtro por visibilidad
	if (filters.isPublic !== undefined) {
		filtered = filtered.filter((video) => video.isPublic === filters.isPublic);
	}

	// Filtro por duración
	if (filters.duration) {
		if (filters.duration.min !== undefined) {
			filtered = filtered.filter((video) => video.duration >= filters.duration?.min || 0);
		}
		if (filters.duration.max !== undefined) {
			filtered = filtered.filter((video) => video.duration <= (filters.duration?.max || Number.POSITIVE_INFINITY));
		}
	}

	// Filtro por resolución
	if (filters.resolution) {
		if (filters.resolution.min !== undefined && filters.resolution.min > 0) {
			filtered = filtered.filter((video) => video.height !== null && video.height >= (filters.resolution?.min || 0));
		}
		if (filters.resolution.max !== undefined) {
			filtered = filtered.filter(
				(video) => video.height !== null && video.height <= (filters.resolution?.max || Number.POSITIVE_INFINITY)
			);
		}
	}

	// Filtro por etiquetas
	if (filters.tags && filters.tags.length > 0) {
		filtered = filtered.filter((video) => {
			if (!video.tags) return false;
			return filters.tags?.some((tagId) => video.tags?.some((tag) => tag.id === tagId)) || false;
		});
	}

	// Filtro por rango de fechas
	if (filters.dateRange) {
		if (filters.dateRange.start) {
			const startDate = new Date(filters.dateRange.start);
			filtered = filtered.filter((video) => new Date(video.createdAt) >= startDate);
		}
		if (filters.dateRange.end) {
			const endDate = new Date(filters.dateRange.end);
			filtered = filtered.filter((video) => new Date(video.createdAt) <= endDate);
		}
	}

	return filtered;
}

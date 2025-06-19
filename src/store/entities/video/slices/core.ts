/**
 * @file Slice principal para operaciones CRUD del store de videos
 * @module store/entities/video/slices/core
 */

import {
    getVideoVisualConfig,
    updateVideoVisualConfig as updateVideoVisualConfigAction,
} from '@/app/actions/videos/video-visual-config.actions';
import {
    createVideo as createServerVideo,
    deleteVideo as deleteServerVideo,
    findVideos,
    getVideo as getServerVideo,
} from '@/app/actions/videos/video.actions';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast.service';
import { mapVideoVisualConfigCompleteUpdateToPrisma } from '@/transformers/video/mappers';
import {
    transformVideo,
    transformVideos,
} from '@/transformers/video/serializers';
import type {
    CreateVideoData,
    UpdateVideoData,
    Video,
    VideoBase,
    VideoFilters,
    VideoVisualConfig,
} from '@/types/entities/video';
import type { StateCreator } from 'zustand';
import type { VideoState } from '../types';

const videoLogger = clientLogger.withContext('VideoStore');

// --- Helper Functions ---

/**
 * Aplica filtros a una lista de videos.
 * @param videos - Array de videos a filtrar.
 * @param filters - Objeto de filtros a aplicar.
 * @returns Un nuevo array con los videos filtrados.
 */
function applyVideoFilters(
	videos: Video[],
	filters: Partial<VideoFilters>,
): Video[] {
	let filteredVideos = videos;
	if (filters.folderId) {
		filteredVideos = filteredVideos.filter(
			(v) => v.folderId === filters.folderId,
		);
	}
	if (filters.isFavorite !== undefined) {
		filteredVideos = filteredVideos.filter(
			(v) => v.isFavorite === filters.isFavorite,
		);
	}
	// Añadir más lógicas de filtro aquí
	return filteredVideos;
}

// --- Slice Interface ---

export interface VideoCoreSlice {
	// Getters
	getVideo: (id: string) => Video | undefined;
	getVideos: () => Video[];
	getVideosByFolder: (folderId: string) => Video[];

	// Selectores avanzados
	selectVideos: (options?: {
		filters?: Partial<VideoFilters>;
		sortBy?: keyof Video;
		sortDirection?: 'asc' | 'desc';
	}) => Video[];

	// Operaciones síncronas
	addVideo: (video: Video) => void;
	addVideos: (videos: Video[]) => void;
	updateVideo: (id: string, data: UpdateVideoData) => void;
	deleteVideo: (id: string) => void;

	// Estado de carga y errores
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
		config: Partial<VideoVisualConfig>,
	) => Promise<VideoVisualConfig | undefined>;
	fetchVideoVisualConfig: (
		videoId: string,
	) => Promise<VideoVisualConfig | undefined>;
}

// --- Slice Implementation ---

export const createVideoCoreSlice: StateCreator<
	VideoState & VideoCoreSlice,
	[],
	[],
	VideoCoreSlice
> = (set, get) => ({
	// --- Getters ---
	getVideo: (id) => get().core.videos[id],
	getVideos: () => Object.values(get().core.videos),
	getVideosByFolder: (folderId) =>
		Object.values(get().core.videos).filter(
			(video) => video.folderId === folderId,
		),

	// --- Selectores avanzados ---
	selectVideos: (options = {}) => {
		const {
			filters = {},
			sortBy = 'createdAt',
			sortDirection = 'desc',
		} = options;
		let videos = Object.values(get().core.videos);

		videos = applyVideoFilters(videos, filters);

		videos.sort((a, b) => {
			const valueA = a[sortBy];
			const valueB = b[sortBy];

			if (valueA === valueB) return 0;
			if (valueA === null || valueA === undefined) return 1;
			if (valueB === null || valueB === undefined) return -1;

			if (typeof valueA === 'string' && typeof valueB === 'string') {
				return sortDirection === 'asc'
					? valueA.localeCompare(valueB)
					: valueB.localeCompare(valueA);
			}

			const numA =
				valueA instanceof Date ? valueA.getTime() : (valueA as number);
			const numB =
				valueB instanceof Date ? valueB.getTime() : (valueB as number);

			return sortDirection === 'asc' ? numA - numB : numB - numA;
		});

		return videos;
	},

	// --- Operaciones síncronas ---
	addVideo: (video) => {
		set((state) => ({
			core: {
				...state.core,
				videos: {
					...state.core.videos,
					[video.id]: video,
				},
			},
		}));
	},

	addVideos: (videos) => {
		const videosMap = videos.reduce(
			(acc, video) => {
				acc[video.id] = video;
				return acc;
			},
			{} as Record<string, Video>,
		);
		set((state) => ({
			core: {
				...state.core,
				videos: {
					...state.core.videos,
					...videosMap,
				},
			},
		}));
	},

	updateVideo: (id, data) => {
		const existingVideo = get().getVideo(id);
		if (existingVideo) {
			get().addVideo({ ...existingVideo, ...data, updatedAt: new Date() });
		}
	},

	deleteVideo: (id) => {
		set((state) => {
			const { [id]: _, ...remaining } = state.core.videos;
			return {
				core: {
					...state.core,
					videos: remaining,
				},
			};
		});
	},

	// --- Estado de carga y errores ---
	setLoading: (isLoading) =>
		set((state) => ({ core: { ...state.core, isLoading } })),
	setError: (error) => set((state) => ({ core: { ...state.core, error } })),

	// --- Acciones Asíncronas ---
	fetchVideo: async (id) => {
		get().setLoading(true);
		try {
			const response = await getServerVideo(id);
			if (response.success && response.data) {
				const video = transformVideo(response.data as VideoBase);
				if (video) get().addVideo(video);
				return video;
			}
			get().setError(response.error ?? 'Error fetching video');
			return undefined;
		} catch (e) {
			videoLogger.error('Failed to fetch video', { error: e });
			get().setError('Failed to fetch video');
			return undefined;
		} finally {
			get().setLoading(false);
		}
	},

	fetchVideos: async (folderIds) => {
		get().setLoading(true);
		try {
			const response = await findVideos({ folderIds });
			if (response.success && response.data) {
				const videos = transformVideos(response.data as VideoBase[]);
				get().addVideos(videos);
				return videos;
			}
			get().setError(response.error ?? 'Error fetching videos');
			return [];
		} catch (e) {
			videoLogger.error('Failed to fetch videos', { error: e });
			get().setError('Failed to fetch videos');
			return [];
		} finally {
			get().setLoading(false);
		}
	},

	createVideo: async (data) => {
		get().setLoading(true);
		try {
			const response = await createServerVideo(data);
			if (response.success && response.data) {
				const video = transformVideo(response.data as VideoBase);
				if (video) {
					get().addVideo(video);
					toastService.success('Video creado');
				}
				return video;
			}
			toastService.error(response.error ?? 'Error creating video');
			get().setError(response.error ?? 'Error creating video');
			return undefined;
		} catch (e) {
			videoLogger.error('Failed to create video', { error: e });
			get().setError('Failed to create video');
			return undefined;
		} finally {
			get().setLoading(false);
		}
	},

	removeVideo: async (id) => {
		get().setLoading(true);
		try {
			const response = await deleteServerVideo(id);
			if (response.success) {
				get().deleteVideo(id);
				toastService.success('Video eliminado');
				return true;
			}
			toastService.error(response.error ?? 'Error deleting video');
			get().setError(response.error ?? 'Error deleting video');
			return false;
		} catch (e) {
			videoLogger.error('Failed to remove video', { error: e });
			get().setError('Failed to remove video');
			return false;
		} finally {
			get().setLoading(false);
		}
	},

	// --- Visual Config ---
	updateVideoVisualConfig: async (videoId, config) => {
		try {
			const prismaData = mapVideoVisualConfigCompleteUpdateToPrisma(config);
			const response = await updateVideoVisualConfigAction(
				videoId,
				prismaData,
			);

			if (response.success && response.data) {
				get().updateVideo(videoId, { visualConfig: response.data });
				toastService.success('Configuración visual actualizada');
				return response.data;
			}
			toastService.error(
				response.error ?? 'Error updating visual config',
			);
			return undefined;
		} catch (e) {
			videoLogger.error('Failed to update visual config', { error: e });
			toastService.error('Failed to update visual config');
			return undefined;
		}
	},

	fetchVideoVisualConfig: async (videoId) => {
		try {
			const response = await getVideoVisualConfig(videoId);
			if (response.success && response.data) {
				get().updateVideo(videoId, { visualConfig: response.data });
				return response.data;
			}
			return undefined;
		} catch (e) {
			videoLogger.error('Failed to fetch visual config', { error: e });
			return undefined;
		}
	},
});

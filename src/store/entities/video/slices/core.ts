/**
 * @file Slice principal para operaciones CRUD del store de videos
 * @module store/entities/video/slices/core
 */

import {
    createVideo as createServerVideo,
    deleteVideo as deleteServerVideo,
    findVideos,
    getVideo as getServerVideo,
} from '@/app/actions/videos/video.actions';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast.service';
import type {
    CreateVideoData,
    UpdateVideoData,
    VideoComplete,
    VideoFilters
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
function applyVideoFilters(videos: VideoComplete[], filters: Partial<VideoFilters>): VideoComplete[] {
	let filteredVideos = videos;
	if (filters.folders && filters.folders.length > 0) {
		filteredVideos = filteredVideos.filter((v) => filters.folders?.includes(v.folderId));
	}
	if (filters.isFavorite !== undefined) {
		filteredVideos = filteredVideos.filter((v) => v.isFavorite === filters.isFavorite);
	}
	// Añadir más lógicas de filtro aquí
	return filteredVideos;
}

// --- Slice Interface ---

export interface VideoCoreSlice {
	// Getters
	getVideo: (id: string) => VideoComplete | undefined;
	getVideos: () => VideoComplete[];
	getVideosByFolder: (folderId: string) => VideoComplete[];

	// Selectores avanzados
	selectVideos: (options?: {
		filters?: Partial<VideoFilters>;
		sortBy?: keyof VideoComplete;
		sortDirection?: 'asc' | 'desc';
	}) => VideoComplete[];

	// Operaciones síncronas
	addVideo: (video: VideoComplete) => void;
	addVideos: (videos: VideoComplete[]) => void;
	updateVideo: (id: string, data: UpdateVideoData) => void;
	deleteVideo: (id: string) => void;

	// Estado de carga y errores
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;

	// Acciones asíncronas
	fetchVideo: (id: string) => Promise<VideoComplete | undefined>;
	fetchVideos: (folderIds?: string[]) => Promise<VideoComplete[]>;
	createVideo: (data: CreateVideoData) => Promise<VideoComplete | undefined>;
	removeVideo: (id: string) => Promise<boolean>;
}

// --- Slice Implementation ---

export const createVideoCoreSlice: StateCreator<VideoState & VideoCoreSlice, [], [], VideoCoreSlice> = (set, get) => ({
	// --- Getters ---
	getVideo: (id) => get().core.videos[id],
	getVideos: () => Object.values(get().core.videos),
	getVideosByFolder: (folderId) => Object.values(get().core.videos).filter((video) => video.folderId === folderId),

	// --- Selectores avanzados ---
	selectVideos: (options = {}) => {
		const { filters = {}, sortBy = 'createdAt', sortDirection = 'desc' } = options;
		let videos = Object.values(get().core.videos);

		videos = applyVideoFilters(videos, filters);

		videos.sort((a, b) => {
			const valueA = a[sortBy];
			const valueB = b[sortBy];

			if (valueA === valueB) return 0;
			if (valueA === null || valueA === undefined) return 1;
			if (valueB === null || valueB === undefined) return -1;

			if (typeof valueA === 'string' && typeof valueB === 'string') {
				return sortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
			}

			const numA = valueA instanceof Date ? valueA.getTime() : (valueA as number);
			const numB = valueB instanceof Date ? valueB.getTime() : (valueB as number);

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
			{} as Record<string, VideoComplete>
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
	setLoading: (isLoading) => set((state) => ({ core: { ...state.core, isLoading } })),
	setError: (error) => set((state) => ({ core: { ...state.core, error } })),

	// --- Acciones Asíncronas ---
	fetchVideo: async (id) => {
		get().setLoading(true);
		try {
			const video = await getServerVideo(id);
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
			const videos = await findVideos({ folderIds });
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
			const video = await createServerVideo(data);
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
			await deleteServerVideo(id);
			get().deleteVideo(id);
			toastService.success('Video eliminado');
			return true;
		} catch (e) {
			videoLogger.error('Failed to remove video', { error: e });
			const errorMessage = e instanceof Error ? e.message : 'Error deleting video';
			toastService.error(errorMessage);
			get().setError(errorMessage);
			return false;
		} finally {
			get().setLoading(false);
		}
	},
});

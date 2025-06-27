/**
 * @file Tipos para el store de Video
 * @module store/entities/video/types
 * @description Tipos optimizados para el store Zustand de videos con patrón EntityWithStats
 * Última refactorización: 2025-01-27
 */

import type {
	VideoCreateInput,
	VideoPlayState,
	VideoSortCriteria,
	VideoUpdateInput,
	VideoViewMode,
	VideoWithStats,
} from '@/types/entities/video';

/**
 * 🎬 Estado principal del store de videos
 */
export interface VideoState {
	// 📊 Datos principales (Record optimizado)
	videos: Record<string, VideoWithStats>;
	isLoading: boolean;
	error: string | null;
	lastUpdated: number | null;

	// 🎮 UI y configuración
	ui: VideoUIState;
	filters: VideoFiltersState;
	player: VideoPlayerState;

	// 🔍 Selectores y getters optimizados
	getVideoById: (id: string) => VideoWithStats | undefined;
	getFilteredVideos: () => VideoWithStats[];
	getSortedVideos: () => VideoWithStats[];
	getVideosByFolder: (folderId: string) => VideoWithStats[];
}

/**
 * 🎮 Estado de UI del store
 */
export interface VideoUIState {
	selectedIds: string[];
	viewMode: VideoViewMode;
	isViewerOpen: boolean;
	currentVideoId: string | null;
	displayState: Record<string, VideoDisplayState>;
	draggedVideoId: string | null;
	dropTargetVideoId: string | null;
	highlightedId: string | null;
	expandedIds: string[];
}

/**
 * 🎭 Estado de visualización por video
 */
export interface VideoDisplayState {
	isExpanded: boolean;
	isVisible: boolean;
	isPlaying: boolean;
	currentTime: number;
}

/**
 * 🔍 Estado de filtros del store
 */
export interface VideoFiltersState {
	// Filtros básicos
	query: string;
	searchQuery: string; // Alias para compatibilidad

	// Filtros específicos de video
	sortBy: VideoSortCriteria;
	filterByFolder: string | null;
	filterByQuality: string | null;
	filterFavorites: boolean;
	filterPublic: boolean;
	filterWithAudio: boolean;
	filterWithSubtitles: boolean;

	// Filtros de contenido
	folders?: string[];
	tags?: string[];
	albums?: string[];
	collections?: string[];
	characters?: string[];

	// Filtros técnicos
	minDuration?: number;
	maxDuration?: number;
	minWidth?: number;
	maxWidth?: number;
	minHeight?: number;
	maxHeight?: number;
	minSize?: number;
	maxSize?: number;
	minQualityScore?: number;
	technicalGrade?: ('A' | 'B' | 'C' | 'D')[];

	// Rango de fechas
	dateRange: {
		from: Date | null;
		to: Date | null;
	};
}

/**
 * 🎵 Estado del reproductor de video
 */
export interface VideoPlayerState {
	// Estado de reproducción actual
	currentVideo: VideoWithStats | null;
	playState: VideoPlayState;

	// Cola de reproducción
	playlist: string[]; // IDs de videos
	currentIndex: number;
	isShuffled: boolean;
	repeatMode: 'none' | 'one' | 'all';

	// Configuración del reproductor
	autoplay: boolean;
	showControls: boolean;
	fullscreen: boolean;
	pictureInPicture: boolean;

	// Historial y favoritos
	recentlyPlayed: string[];
	bookmarks: Record<string, number>; // videoId -> timestamp
}

/**
 * 🔄 Acciones disponibles en el store
 */
export interface VideoActions {
	// 📥 Carga de datos
	loadVideos: () => Promise<void>;
	loadVideoById: (id: string) => Promise<VideoWithStats | undefined>;
	loadVideosByFolder: (folderId: string) => Promise<void>;

	// 📝 Gestión de videos
	createVideo: (video: VideoCreateInput) => Promise<void>;
	updateVideo: (id: string, video: VideoUpdateInput) => Promise<void>;
	deleteVideo: (id: string) => Promise<void>;

	// 🎮 Acciones UI
	selectVideo: (id: string | null) => void;
	selectMultipleVideos: (ids: string[]) => void;
	toggleSelection: (id: string) => void;
	clearSelection: () => void;

	// 🔍 Filtros
	updateFilters: (filters: Partial<VideoFiltersState>) => void;
	clearFilters: () => void;
	setSearchQuery: (query: string) => void;

	// 🎵 Reproductor
	playVideo: (id: string) => void;
	pauseVideo: () => void;
	stopVideo: () => void;
	seekTo: (time: number) => void;
	setVolume: (volume: number) => void;
	toggleMute: () => void;
	setPlaybackRate: (rate: number) => void;

	// 📋 Lista de reproducción
	addToPlaylist: (videoId: string) => void;
	removeFromPlaylist: (videoId: string) => void;
	clearPlaylist: () => void;
	shufflePlaylist: () => void;
	setRepeatMode: (mode: 'none' | 'one' | 'all') => void;
}

/**
 * 🏗️ Tipo completo del store
 */
export type VideoStore = VideoState & VideoActions;

/**
 * 🔄 Funciones auxiliares para Record optimizado
 */
export function videosToRecord(videos: VideoWithStats[]): Record<string, VideoWithStats> {
	return videos.reduce(
		(acc, video) => {
			acc[video.id] = video;
			return acc;
		},
		{} as Record<string, VideoWithStats>
	);
}

export function getVideoById(videos: Record<string, VideoWithStats>, id: string): VideoWithStats | undefined {
	return videos[id];
}

export function getAllVideos(videos: Record<string, VideoWithStats>): VideoWithStats[] {
	return Object.values(videos);
}

export function getVideosByFolder(videos: Record<string, VideoWithStats>, folderId: string): VideoWithStats[] {
	return Object.values(videos).filter((video) => video.folderId === folderId);
}

// 🟢 Documentación:
// - Usar VideoWithStats como tipo principal en todo el store
// - Record<string, VideoWithStats> para acceso O(1) optimizado
// - VideoPlayerState para gestión avanzada de reproducción

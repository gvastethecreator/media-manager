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
	error: string | null;
	filters: VideoFiltersState;
	getFilteredVideos: () => VideoWithStats[];
	getSortedVideos: () => VideoWithStats[];

	// 🔍 Selectores y getters optimizados
	getVideoById: (id: string) => VideoWithStats | undefined;
	getVideosByFolder: (folderId: string) => VideoWithStats[];
	isLoading: boolean;
	lastUpdated: number | null;
	player: VideoPlayerState;

	// 🎮 UI y configuración
	ui: VideoUIState;
	// 📊 Datos principales (Record optimizado)
	videos: Record<string, VideoWithStats>;
}

/**
 * 🎮 Estado de UI del store
 */
export interface VideoUIState {
	currentVideoId: string | null;
	displayState: Record<string, VideoDisplayState>;
	draggedVideoId: string | null;
	dropTargetVideoId: string | null;
	expandedIds: string[];
	highlightedId: string | null;
	isViewerOpen: boolean;
	selectedIds: string[];
	viewMode: VideoViewMode;
}

/**
 * 🎭 Estado de visualización por video
 */
export interface VideoDisplayState {
	currentTime: number;
	isExpanded: boolean;
	isPlaying: boolean;
	isVisible: boolean;
}

/**
 * 🔍 Estado de filtros del store
 */
export interface VideoFiltersState {
	albums?: string[];
	characters?: string[];
	collections?: string[];

	// Rango de fechas
	dateRange: {
		from: Date | null;
		to: Date | null;
	};
	filterByFolder: string | null;
	filterByQuality: string | null;
	filterFavorites: boolean;
	filterPublic: boolean;
	filterWithAudio: boolean;
	filterWithSubtitles: boolean;

	// Filtros de contenido
	folders?: string[];
	maxDuration?: number;
	maxHeight?: number;
	maxSize?: number;
	maxWidth?: number;

	// Filtros técnicos
	minDuration?: number;
	minHeight?: number;
	minQualityScore?: number;
	minSize?: number;
	minWidth?: number;
	// Filtros básicos
	query: string;
	searchQuery: string; // Alias para compatibilidad

	// Filtros específicos de video
	sortBy: VideoSortCriteria;
	tags?: string[];
	technicalGrade?: ('A' | 'B' | 'C' | 'D')[];
}

/**
 * 🎵 Estado del reproductor de video
 */
export interface VideoPlayerState {
	// Configuración del reproductor
	autoplay: boolean;
	bookmarks: Record<string, number>; // videoId -> timestamp
	currentIndex: number;
	// Estado de reproducción actual
	currentVideo: VideoWithStats | null;
	fullscreen: boolean;
	isShuffled: boolean;
	pictureInPicture: boolean;

	// Cola de reproducción
	playlist: string[]; // IDs de videos
	playState: VideoPlayState;

	// Historial y favoritos
	recentlyPlayed: string[];
	repeatMode: 'none' | 'one' | 'all';
	showControls: boolean;
}

/**
 * 🔄 Acciones disponibles en el store
 */
export interface VideoActions {
	// 📋 Lista de reproducción
	addToPlaylist: (videoId: string) => void;
	clearFilters: () => void;
	clearPlaylist: () => void;
	clearSelection: () => void;

	// 📝 Gestión de videos
	createVideo: (video: VideoCreateInput) => Promise<void>;
	deleteVideo: (id: string) => Promise<void>;
	loadVideoById: (id: string) => Promise<VideoWithStats | undefined>;
	// 📥 Carga de datos
	loadVideos: () => Promise<void>;
	loadVideosByFolder: (folderId: string) => Promise<void>;
	pauseVideo: () => void;

	// 🎵 Reproductor
	playVideo: (id: string) => void;
	removeFromPlaylist: (videoId: string) => void;
	seekTo: (time: number) => void;
	selectMultipleVideos: (ids: string[]) => void;

	// 🎮 Acciones UI
	selectVideo: (id: string | null) => void;
	setPlaybackRate: (rate: number) => void;
	setRepeatMode: (mode: 'none' | 'one' | 'all') => void;
	setSearchQuery: (query: string) => void;
	setVolume: (volume: number) => void;
	shufflePlaylist: () => void;
	stopVideo: () => void;
	toggleMute: () => void;
	toggleSelection: (id: string) => void;

	// 🔍 Filtros
	updateFilters: (filters: Partial<VideoFiltersState>) => void;
	updateVideo: (id: string, video: VideoUpdateInput) => Promise<void>;
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

import type { AudioBase, AudioStatistics, AudioWithStats } from './base';

// Re-export tipos base (sin AudioCreateInput y AudioUpdateInput para evitar duplicación)
export type { AudioBase, AudioStatistics, AudioWithStats } from './base';

export interface AudioFilters {
	search?: string;
	isFavorite?: boolean;
	format?: string[];
	genre?: string[];
	artist?: string[];
	year?: number[];
	minDuration?: number;
	maxDuration?: number;
	minSize?: number;
	maxSize?: number;
}

export interface AudioSortCriteria {
	field: keyof AudioWithStats;
	direction: 'asc' | 'desc';
}

export interface AudioPaginationOptions {
	page?: number;
	pageSize?: number;
}

export interface AudiosResponse {
	audios: AudioWithStats[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export interface AudioFormData {
	name: string;
	description?: string;
	emoji?: string;
	color?: string;
	isFavorite?: boolean;
	filePath: string;
	fileName: string;
	fileSize?: number;
	format?: string;
	duration?: number;
	bitrate?: number;
	sampleRate?: number;
	channels?: number;
	metadata?: Record<string, any>;
	album?: string;
	artist?: string;
	genre?: string;
	year?: number;
	track?: number;
	lyrics?: string;
}

export interface AudioUIInput {
	name: string;
	description?: string;
	emoji?: string;
	color?: string;
	isFavorite?: boolean;
	filePath: string;
	fileName: string;
	fileSize?: number;
	format?: string;
	duration?: number;
	bitrate?: number;
	sampleRate?: number;
	channels?: number;
	metadata?: Record<string, any>;
	album?: string;
	artist?: string;
	genre?: string;
	year?: number;
	track?: number;
	lyrics?: string;
}

export interface AudioComplete extends AudioWithStats {
	tags: string[];
	relations: {
		images: string[];
		videos: string[];
		notes: string[];
		characters: string[];
		places: string[];
		worldItems: string[];
		concepts: string[];
		prompts: string[];
		properties: string[];
		wildcards: string[];
		groups: string[];
		albums: string[];
		collections: string[];
	};
}

export type AudioSortOption =
	| 'name_asc'
	| 'name_desc'
	| 'createdAt_asc'
	| 'createdAt_desc'
	| 'updatedAt_asc'
	| 'updatedAt_desc'
	| 'fileSize_asc'
	| 'fileSize_desc'
	| 'duration_asc'
	| 'duration_desc'
	| 'bitrate_asc'
	| 'bitrate_desc'
	| 'sampleRate_asc'
	| 'sampleRate_desc'
	| 'album_asc'
	| 'album_desc'
	| 'artist_asc'
	| 'artist_desc'
	| 'genre_asc'
	| 'genre_desc'
	| 'year_asc'
	| 'year_desc'
	| 'track_asc'
	| 'track_desc';

export type AudioViewMode = 'grid' | 'list' | 'compact';

// Additional types for compatibility
export interface AudioSearchOptions {
	filters?: AudioFilters;
	sort?: AudioSortCriteria;
	pagination?: AudioPaginationOptions;
}

export interface AudioViewConfig {
	viewMode: AudioViewMode;
	sortBy: AudioSortOption;
	filters: AudioFilters;
}

export interface AudioUIProps {
	totalAudios: number;
	totalSize: number;
	totalDuration: number;
	formats: string[];
	genres: string[];
	artists: string[];
}

export interface AudioCounts {
	albums?: number;
	collections?: number;
	tags?: number;
	characters?: number;
	places?: number;
	worldItems?: number;
	concepts?: number;
	prompts?: number;
	notes?: number;
	wildcards?: number;
	properties?: number;
	groups?: number;
}

export interface AudioRelations {
	albums?: any[];
	collections?: any[];
	tags?: any[];
	characters?: any[];
	places?: any[];
	worldItems?: any[];
	concepts?: any[];
	prompts?: any[];
	notes?: any[];
	wildcards?: any[];
	properties?: any[];
	groups?: any[];
}

export interface AudioExtended extends AudioWithStats {
	relations?: AudioRelations;
}

export interface AudioExtendedComplete extends AudioWithStats {
	tags: string[];
	relations: AudioRelations;
}

export interface AudioWithRelations extends AudioWithStats {
	relations: AudioRelations;
}

// Alias for backward compatibility
export type AudioStats = AudioStatistics;

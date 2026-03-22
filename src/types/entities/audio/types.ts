import type { AudioStatistics, AudioWithStats } from './base';

// Re-export tipos base (sin AudioCreateInput y AudioUpdateInput para evitar duplicación)
export type { AudioBase, AudioStatistics, AudioWithStats } from './base';

export interface AudioFilters {
	artist?: string[];
	format?: string[];
	genre?: string[];
	isFavorite?: boolean;
	maxDuration?: number;
	maxSize?: number;
	minDuration?: number;
	minSize?: number;
	search?: string;
	year?: number[];
}

export interface AudioSortCriteria {
	direction: 'asc' | 'desc';
	field: keyof AudioWithStats;
}

export interface AudioPaginationOptions {
	page?: number;
	pageSize?: number;
}

export interface AudiosResponse {
	audios: AudioWithStats[];
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
}

export interface AudioFormData {
	album?: string;
	artist?: string;
	bitrate?: number;
	channels?: number;
	color?: string;
	description?: string;
	duration?: number;
	emoji?: string;
	fileName: string;
	filePath: string;
	fileSize?: number;
	format?: string;
	genre?: string;
	isFavorite?: boolean;
	lyrics?: string;
	metadata?: Record<string, any>;
	name: string;
	sampleRate?: number;
	track?: number;
	year?: number;
}

export interface AudioUIInput {
	album?: string;
	artist?: string;
	bitrate?: number;
	channels?: number;
	color?: string;
	description?: string;
	duration?: number;
	emoji?: string;
	fileName: string;
	filePath: string;
	fileSize?: number;
	format?: string;
	genre?: string;
	isFavorite?: boolean;
	lyrics?: string;
	metadata?: Record<string, any>;
	name: string;
	sampleRate?: number;
	track?: number;
	year?: number;
}

export interface AudioComplete extends AudioWithStats {
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
	tags: string[];
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
	pagination?: AudioPaginationOptions;
	sort?: AudioSortCriteria;
}

export interface AudioViewConfig {
	filters: AudioFilters;
	sortBy: AudioSortOption;
	viewMode: AudioViewMode;
}

export interface AudioUIProps {
	artists: string[];
	formats: string[];
	genres: string[];
	totalAudios: number;
	totalDuration: number;
	totalSize: number;
}

export interface AudioCounts {
	albums?: number;
	characters?: number;
	collections?: number;
	concepts?: number;
	groups?: number;
	notes?: number;
	places?: number;
	prompts?: number;
	properties?: number;
	tags?: number;
	wildcards?: number;
	worldItems?: number;
}

export interface AudioRelations {
	albums?: any[];
	characters?: any[];
	collections?: any[];
	concepts?: any[];
	groups?: any[];
	notes?: any[];
	places?: any[];
	prompts?: any[];
	properties?: any[];
	tags?: any[];
	wildcards?: any[];
	worldItems?: any[];
}

export interface AudioExtended extends AudioWithStats {
	relations?: AudioRelations;
}

export interface AudioExtendedComplete extends AudioWithStats {
	relations: AudioRelations;
	tags: string[];
}

export interface AudioWithRelations extends AudioWithStats {
	relations: AudioRelations;
}

// Alias for backward compatibility
export type AudioStats = AudioStatistics;

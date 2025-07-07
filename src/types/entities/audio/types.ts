import { EntityBase, EntityWithStats } from '@/types/entities/entity.types';

export interface AudioBase extends EntityBase {
	filePath: string;
	fileName: string;
	fileSize: number;
	format: string;
	duration: number;
	bitrate: number;
	sampleRate: number;
	channels: number;
	metadata: Record<string, any> | null;
	album: string | null;
	artist: string | null;
	genre: string | null;
	year: number | null;
	track: number | null;
	lyrics: string | null;
}

export interface AudioStatistics {
	duration: number;
	format: string;
	bitrate: number;
	volumePeaks: number[];
	sampleRate: number;
}

export interface AudioWithStats extends AudioBase, EntityWithStats {}

export type AudioCreateInput = Partial<AudioBase>;
export type AudioUpdateInput = Partial<AudioBase>;

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

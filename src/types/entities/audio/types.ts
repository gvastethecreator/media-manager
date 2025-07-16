import type { EntityBase, EntityWithStats } from '@/types/entities/entity.types';

export interface AudioBase extends EntityBase {
	name: string;
	path: string;
	size: number;
	hash: string;
	mimeType: string;
	extension: string;
	folderId: string;
	isFavorite: boolean;
	isArchived: boolean;
	duration: number | null;
	bitrate: number | null;
	sampleRate: number | null;
	channels: number | null;
	format: string | null;
	codec: string | null;
	title: string | null;
	artist: string | null;
	album: string | null;
	year: number | null;
	genre: string | null;
	track: number | null;
	disc: number | null;
	albumArtist: string | null;
	composer: string | null;
	comment: string | null;
	lyrics: string | null;
	bpm: number | null;
	key: string | null;
	mood: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface AudioStatistics {
	duration: number | null;
	bitrate: number | null;
	sampleRate: number | null;
	channels: number | null;
	format: string | null;
	codec: string | null;
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

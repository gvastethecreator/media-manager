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

export interface AudioCreateInput extends Partial<AudioBase> {}
export interface AudioUpdateInput extends Partial<AudioBase> {}

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

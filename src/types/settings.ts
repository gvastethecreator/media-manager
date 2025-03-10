import type { BaseEntity } from '@/types/store.types';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'es' | 'en';
export type ThumbnailQuality = 'low' | 'medium' | 'high';
export type SortMode = 'name' | 'date' | 'size' | 'type';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list' | 'masonry' | 'cards';
export type ThumbnailSize = 'sm' | 'md' | 'lg';

export interface Profile {
	id: string;
	name: string;
	emoji: string;
	color: string;
	theme: ThemeMode;
	language: Language;
	isActive: boolean;
}

export interface BaseEntityWithStats extends BaseEntity {
	_count?: {
		images: number;
	};
	totalSize?: number;
}

export interface Album extends BaseEntityWithStats {
	type?: string;
	properties?: string;
	requirements?: string;
	stats?: string;
}

export interface Collection extends Omit<BaseEntityWithStats, 'filters'> {
	sortBy: SortMode;
	sortDirection: SortDirection;
	filters: string[];
	count: number;
}

export interface Object extends BaseEntityWithStats {
	type: string;
	rarity: string;
	properties: string;
	requirements: string;
	origin: string;
	stats: string;
}

export interface Place extends BaseEntityWithStats {
	type: string;
	climate: string;
	population: number;
	government: string;
	history: string;
	stats: string;
}

export interface Tag {
	id: string;
	name: string;
	color: string;
	count: number;
}

export interface Folder {
	id: string;
	name: string;
	path: string;
	isIndexed: boolean;
	lastIndexed: string | null;
	totalFiles: number;
	totalSize: number;
}

export interface ViewSettings {
	defaultView: ViewMode;
	showHiddenFiles: boolean;
	sortBy: SortMode;
	sortDirection: SortDirection;
	thumbnailSize: ThumbnailSize;
}

export interface ThumbnailSettings {
	quality: ThumbnailQuality;
	generateOnUpload: boolean;
	maxSize: number;
	cacheSize: number;
	cachePath: string;
}

export interface SystemSettings {
	theme: ThemeMode;
	language: Language;
	autoStart: boolean;
	minimizeToTray: boolean;
	checkUpdates: boolean;
	telemetry: boolean;
	// Métricas del sistema
	cpuUsage: number;
	memoryUsage: number;
	cacheSize: number;
}

export interface ShortcutSettings {
	[key: string]: string;
}

export interface AppSettings {
	profiles: Profile[];
	activeProfile: string | null;
	collections: Collection[];
	tags: Tag[];
	folders: Folder[];

	view: ViewSettings;
	thumbnails: ThumbnailSettings;
	system: SystemSettings;
	shortcuts: ShortcutSettings;

	version: string;
	lastUpdate: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
	profiles: [],
	activeProfile: null,
	collections: [],
	tags: [],
	folders: [],

	view: {
		defaultView: 'grid',
		showHiddenFiles: false,
		sortBy: 'name',
		sortDirection: 'asc',
		thumbnailSize: 'md',
	},

	thumbnails: {
		quality: 'medium',
		generateOnUpload: true,
		maxSize: 500,
		cacheSize: 1000,
		cachePath: './cache/thumbnails',
	},

	system: {
		theme: 'system',
		language: 'es',
		autoStart: false,
		minimizeToTray: true,
		checkUpdates: true,
		telemetry: false,
		cpuUsage: 0,
		memoryUsage: 0,
		cacheSize: 0,
	},

	shortcuts: {},

	version: '1.0.0',
	lastUpdate: new Date().toISOString(),
};

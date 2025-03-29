import type { FileItem } from '@/types/file-item';
import type { Nullable } from '@/types/utils';
import type { Group, Image, Video } from '@prisma/client';

export interface GroupBase extends Group {}

export interface GroupWithStats extends GroupBase {
	_count: {
		images: number;
		videos: number;
		albums: number;
		collections: number;
		tags: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
	};
	totalEntities: number;
	lastUpdated: Date;
}

export interface GroupWithRelations extends GroupBase {
	images: Image[];
	videos: Video[];
}

export interface GroupWithFiles extends GroupBase {
	files: FileItem[];
}

export interface GroupFilters {
	query?: string;
	categories?: string[];
	isFavorite?: boolean;
	withImages?: boolean;
	withVideos?: boolean;
}

export interface CreateGroupData {
	name: string;
	description?: Nullable<string>;
	emoji?: string;
	color?: string;
	category?: Nullable<string>;
	shortcut?: Nullable<string>;
	isFavorite?: boolean;
	sortBy?: string;
	filters?: string;
}

export interface UpdateGroupData extends Partial<CreateGroupData> {}
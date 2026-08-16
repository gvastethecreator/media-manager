import type { PublicVideoCreateInput, PublicVideoUpdateInput } from '@/lib/api/client/video.client';
import type { VideoWithStats } from '@/types/entities/video';
import { createEntityHooks } from './hook-factory';

export interface VideoFilters {
	[key: string]: unknown;
	limit?: number;
	offset?: number;
	search?: string;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'duration' | 'width' | 'height';
	sortOrder?: 'asc' | 'desc';
	folderId?: string;
	isFavorite?: boolean;
}

const hooks = createEntityHooks<VideoWithStats, PublicVideoCreateInput, PublicVideoUpdateInput, VideoFilters>({
	entityName: 'videos',
	baseEndpoint: '/videos',
	updateMethod: 'patch',
	listStaleTime: 60_000,
	detailStaleTime: 60_000,
});

export const videoKeys = hooks.keys;
export const useVideos = hooks.useList;
export const useVideo = hooks.useDetail;
export const useCreateVideo = hooks.useCreate;
export const useUpdateVideo = hooks.useUpdate;
export const useDeleteVideo = hooks.useDelete;

export type VideosResponse = Awaited<ReturnType<typeof hooks.useList>>['data'];

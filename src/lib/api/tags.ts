import { useQuery } from '@tanstack/react-query';
import type { ImageWithStats } from '@/types/entities/image';
import type { TagWithStats } from '@/types/entities/tag';
import { createEntityHooks } from './hook-factory';
import type { EntityListResult } from './hook-factory';
import { apiClient } from './client';

export interface TagFilters {
	[key: string]: unknown;
	category?: string;
	isFavorite?: boolean;
	limit?: number;
	offset?: number;
	search?: string;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'totalImages' | 'totalVideos';
	sortOrder?: 'asc' | 'desc';
}

export interface TagCreateInput {
	category?: string | null;
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	isFavorite?: boolean;
	name: string;
	totalImages?: number;
	totalVideos?: number;
}

export interface TagUpdateInput {
	category?: string | null;
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	isFavorite?: boolean;
	name?: string;
	totalImages?: number;
	totalVideos?: number;
}

const hooks = createEntityHooks<TagWithStats, TagCreateInput, TagUpdateInput, TagFilters>({
	entityName: 'tags',
	baseEndpoint: '/tags',
	listStaleTime: 60_000,
	detailStaleTime: 60_000,
});

export const tagKeys = {
	...hooks.keys,
	images: (id: string) => [...hooks.keys.detail(id), 'images'] as const,
};

export const useTags = hooks.useList;
export const useTag = hooks.useDetail;
export const useCreateTag = hooks.useCreate;
export const useUpdateTag = hooks.useUpdate;
export const useDeleteTag = hooks.useDelete;

export type TagsResponse = EntityListResult<TagWithStats>;

export function useTagImages(id: string) {
	return useQuery<ImageWithStats[], Error>({
		queryKey: tagKeys.images(id),
		queryFn: () => apiClient.get<ImageWithStats[]>(`/tags/${id}/images`),
		enabled: !!id,
		staleTime: 1000 * 30,
	});
}

export function useTagThumbnails(tagId: string, limit = 6) {
	return useQuery<Array<{ id: string; name?: string | null; thumbnailUrl: string }>, Error>({
		queryKey: [...tagKeys.detail(tagId), 'thumbnails', limit],
		queryFn: () =>
			apiClient.get<Array<{ id: string; name?: string | null; thumbnailUrl: string }>>(
				`/tags/${tagId}/thumbnails?limit=${limit}`
			),
		enabled: !!tagId,
	});
}

export function useTagStats(tagId: string) {
	return useQuery<
		{
			images: number;
			videos: number;
			albums: number;
			collections: number;
			characters: number;
			places: number;
			worldItems: number;
			concepts: number;
			prompts: number;
			notes: number;
			wildcards: number;
			properties: number;
			groups: number;
			totalAssociations: number;
		},
		Error
	>({
		queryKey: [...tagKeys.detail(tagId), 'stats'],
		queryFn: () =>
			apiClient.get<{
				images: number;
				videos: number;
				albums: number;
				collections: number;
				characters: number;
				places: number;
				worldItems: number;
				concepts: number;
				prompts: number;
				notes: number;
				wildcards: number;
				properties: number;
				groups: number;
				totalAssociations: number;
			}>(`/tags/${tagId}/stats`),
		enabled: !!tagId,
	});
}

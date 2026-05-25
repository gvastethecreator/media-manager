import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FavoriteEntityType } from '@/types/entities/favorite';
import type { ImageWithStats } from '@/types/entities/image/base';
import type { ImageCreateInput, ImageUpdateInput } from '@/types/entities/image/types';
import { createEntityHooks } from './hook-factory';
import type { EntityListResult } from './hook-factory';
import { favoriteKeys } from './favorites';
import { apiClient } from './client';

export interface ImageFilters {
	[key: string]: unknown;
	albums?: string[];
	characters?: string[];
	folderId?: string;
	isFavorite?: boolean;
	limit?: number;
	maxHeight?: number;
	maxSize?: number;
	maxWidth?: number;
	minHeight?: number;
	minSize?: number;
	minWidth?: number;
	offset?: number;
	search?: string;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'width' | 'height';
	sortOrder?: 'asc' | 'desc';
	tags?: string[];
}

const hooks = createEntityHooks<ImageWithStats, ImageCreateInput, ImageUpdateInput, ImageFilters>({
	entityName: 'images',
	baseEndpoint: '/images',
	listStaleTime: 30_000,
	detailStaleTime: 60_000,
	arrayFilterKeys: ['albums', 'characters', 'tags'],
});

export const imageKeys = hooks.keys;
export const useImages = hooks.useList;
export const useImage = hooks.useDetail;
export const useCreateImage = hooks.useCreate;
export const useUpdateImage = hooks.useUpdate;
export const useDeleteImage = hooks.useDelete;

export type ImagesResponse = EntityListResult<ImageWithStats>;

export function useToggleFavorite() {
	const queryClient = useQueryClient();

	return useMutation<{ id?: string; isFavorite: boolean }, Error, { id: string }>({
		mutationFn: ({ id }) =>
			apiClient.post<{ id?: string; isFavorite: boolean }>('/favorites/toggle', {
				entityId: id,
				entityType: FavoriteEntityType.IMAGE,
			}),
		onSuccess: (result, { id }) => {
			queryClient.invalidateQueries({ queryKey: imageKeys.lists() });
			queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
			queryClient.setQueryData<ImageWithStats | undefined>(imageKeys.detail(id), (current) =>
				current ? { ...current, isFavorite: result.isFavorite } : current
			);
		},
	});
}

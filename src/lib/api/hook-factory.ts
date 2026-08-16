/**
 * @file Shared TanStack Query Hook Factory
 * @module lib/api/hook-factory
 * @description Elimina duplicación de patrones CRUD en 30+ archivos de hooks.
 * Cada entidad declara su config en 5-10 líneas en vez de 50-130 líneas de boilerplate.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { invalidateFavoriteQueries } from './favorite-cache';

export interface HookFactoryConfig<TEntity, TCreateInput, TUpdateInput, TFilters extends Record<string, unknown>> {
	/** Nombre de la entidad para query keys (ej: 'images', 'videos') */
	entityName: string;
	/** Endpoint base (ej: '/images', '/videos') */
	baseEndpoint: string;
	/** Método HTTP expuesto por el router para actualizar. Default: PUT. */
	updateMethod?: 'patch' | 'put';
	/** staleTime para queries de lista (ms). Default: 30_000 */
	listStaleTime?: number;
	/** staleTime para queries de detalle (ms). Default: 60_000 */
	detailStaleTime?: number;
	/** Claves de filtros que son arrays (se expanden con params.append) */
	arrayFilterKeys?: (keyof TFilters)[];
	/** Keys de queries relacionadas a invalidar en mutaciones */
	relatedQueryKeys?: (() => readonly unknown[])[];
}

export interface EntityListResult<TEntity> {
	data: TEntity[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

export interface EntityHooks<TEntity, TCreateInput, TUpdateInput, TFilters extends Record<string, unknown>> {
	keys: {
		all: readonly [string];
		lists: () => readonly [...(readonly [string]), 'list'];
		list: (
			filters: TFilters
		) => readonly [
			...ReturnType<EntityHooks<TEntity, TCreateInput, TUpdateInput, TFilters>['keys']['lists']>,
			TFilters,
		];
		details: () => readonly [...(readonly [string]), 'detail'];
		detail: (
			id: string
		) => readonly [
			...ReturnType<EntityHooks<TEntity, TCreateInput, TUpdateInput, TFilters>['keys']['details']>,
			string,
		];
	};
	useList: (filters?: TFilters) => ReturnType<typeof useQuery<EntityListResult<TEntity>, Error>>;
	useDetail: (id: string | undefined) => ReturnType<typeof useQuery<TEntity, Error>>;
	useCreate: () => ReturnType<typeof useMutation<TEntity, Error, TCreateInput>>;
	useUpdate: () => ReturnType<typeof useMutation<TEntity, Error, { id: string; data: TUpdateInput }>>;
	useDelete: () => ReturnType<typeof useMutation<void, Error, string>>;
}

export function createEntityHooks<
	TEntity extends { id: string },
	TCreateInput,
	TUpdateInput,
	TFilters extends Record<string, unknown>,
>(
	config: HookFactoryConfig<TEntity, TCreateInput, TUpdateInput, TFilters>
): EntityHooks<TEntity, TCreateInput, TUpdateInput, TFilters> {
	const { entityName, baseEndpoint, arrayFilterKeys = [], relatedQueryKeys = [], updateMethod = 'put' } = config;
	const listStaleTime = config.listStaleTime ?? 30_000;
	const detailStaleTime = config.detailStaleTime ?? 60_000;

	const keys = {
		all: [entityName] as const,
		lists: () => [...keys.all, 'list'] as const,
		list: (filters: TFilters) => [...keys.lists(), filters] as const,
		details: () => [...keys.all, 'detail'] as const,
		detail: (id: string) => [...keys.details(), id] as const,
	};

	function buildQueryParams(filters: TFilters): string {
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(filters)) {
			if (value === undefined || value === null) continue;
			if (Array.isArray(value) && (arrayFilterKeys as string[]).includes(key)) {
				for (const v of value) {
					params.append(key, String(v));
				}
			} else {
				params.append(key, String(value));
			}
		}
		return params.toString();
	}

	function useList(filters: TFilters = {} as TFilters) {
		return useQuery<EntityListResult<TEntity>, Error>({
			queryKey: keys.list(filters),
			queryFn: () => {
				const qs = buildQueryParams(filters);
				return apiClient.get<EntityListResult<TEntity>>(`${baseEndpoint}${qs ? `?${qs}` : ''}`);
			},
			staleTime: listStaleTime,
		});
	}

	function useDetail(id: string | undefined) {
		return useQuery<TEntity, Error>({
			queryKey: keys.detail(id ?? ''),
			queryFn: () => apiClient.get<TEntity>(`${baseEndpoint}/${id}`),
			enabled: !!id,
			staleTime: detailStaleTime,
		});
	}

	const queryClient = useQueryClient;

	function useCreate() {
		return useMutation<TEntity, Error, TCreateInput>({
			mutationFn: (data) => apiClient.post<TEntity>(baseEndpoint, data),
			onSuccess: (newEntity) => {
				queryClient().invalidateQueries({ queryKey: keys.lists() });
				void invalidateFavoriteQueries(queryClient());
				queryClient().setQueryData(keys.detail(newEntity.id), newEntity);
				for (const relatedKey of relatedQueryKeys) {
					queryClient().invalidateQueries({ queryKey: relatedKey() });
				}
			},
		});
	}

	function useUpdate() {
		return useMutation<TEntity, Error, { id: string; data: TUpdateInput }>({
			mutationFn: ({ id, data }) => apiClient[updateMethod]<TEntity>(`${baseEndpoint}/${id}`, data),
			onSuccess: (updated) => {
				queryClient().invalidateQueries({ queryKey: keys.lists() });
				void invalidateFavoriteQueries(queryClient());
				queryClient().setQueryData(keys.detail(updated.id), updated);
				for (const relatedKey of relatedQueryKeys) {
					queryClient().invalidateQueries({ queryKey: relatedKey() });
				}
			},
		});
	}

	function useDelete() {
		return useMutation<void, Error, string>({
			mutationFn: (id) => apiClient.delete<void>(`${baseEndpoint}/${id}`),
			onSuccess: (_data, id) => {
				queryClient().invalidateQueries({ queryKey: keys.lists() });
				void invalidateFavoriteQueries(queryClient());
				queryClient().removeQueries({ queryKey: keys.detail(id) });
				for (const relatedKey of relatedQueryKeys) {
					queryClient().invalidateQueries({ queryKey: relatedKey() });
				}
			},
		});
	}

	return { keys, useList, useDetail, useCreate, useUpdate, useDelete };
}

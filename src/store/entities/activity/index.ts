/**
 * @file Store principal para la entidad Activity (Actividades)
 * @module store/entities/activity
 * @description Implementación del store de Zustand para la gestión de actividades del sistema
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
// 🔄 Migración: consumo de API en lugar de servicios directos
import {
	createActivityInApi,
	deleteActivityFromApi,
	getActivitiesFromApi,
	getActivityFromApi,
} from '@/lib/api/client/activity.client';
// Migración: se eliminaron servicios directos para evitar dependencias del lado cliente
import { clientLogger } from '@/lib/logger/client-logger';

import { extendActivities, extendActivity } from '@/transformers/activity';
import type { ActivityBase, ActivityFilters, ActivityListResponse } from '@/types/entities/activity';
import { ActivityComplete, ActivitySortCriteria } from '@/types/entities/activity';

// Logger para el store
const storeLogger = clientLogger.withContext('ActivityStore');

/**
 * Estado completo del store de Activity (estructura plana)
 */
export interface ActivityState {
	// Datos principales
	activities: Record<string, ActivityComplete>;
	dateRange: {
		from: Date | null;
		to: Date | null;
	};
	detailActivityId: string | null;
	error: string | null;
	expandedIds: string[];
	filterByImageId: string | null;
	groupByDate: boolean;
	highlightedId: string | null;
	isDetailModalOpen: boolean;
	isLoading: boolean;
	lastUpdated: number | null;
	onlyAlerts: boolean;
	searchQuery: string;
	selectedCategories: string[];

	// Estado UI
	selectedIds: string[];

	// Estado de filtros
	sortBy: ActivitySortCriteria;
}

/**
 * Store completo de actividades con todas las operaciones
 */
export interface ActivityStore extends ActivityState {
	addActivities: (activities: ActivityBase[]) => void;

	// Operaciones
	addActivity: (activity: ActivityBase) => void;
	clearActivities: () => void;
	clearFilters: () => void;
	clearSelection: () => void;
	closeDetailModal: () => void;
	collapseActivity: (id: string) => void;
	createActivity: (data: {
		type: string;
		description?: string;
		entityType?: string;
		entityId?: string;
		metadata?: Record<string, any>;
	}) => Promise<ActivityComplete | undefined>;
	deleteActivity: (id: string) => void;
	expandActivity: (id: string) => void;
	fetchActivities: (filters?: ActivityFilters) => Promise<ActivityListResponse | undefined>;

	// Acciones asíncronas
	fetchActivity: (id: string) => Promise<ActivityComplete | undefined>;
	getActivities: () => ActivityComplete[];
	getActivitiesByImageId: (imageId: string) => ActivityComplete[];
	// Getters
	getActivity: (id: string) => ActivityComplete | undefined;
	openDetailModal: (id: string) => void;
	removeActivity: (id: string) => Promise<boolean>;

	// UI Actions
	selectActivity: (id: string) => void;
	selectMultipleActivities: (ids: string[]) => void;
	setDateRange: (from: Date | null, to: Date | null) => void;
	setError: (error: string | null) => void;
	setFilterByImageId: (imageId: string | null) => void;
	setHighlightedActivity: (id: string | null) => void;

	// Estado de carga
	setLoading: (isLoading: boolean) => void;
	setSearchQuery: (query: string) => void;
	setSelectedCategories: (categories: string[]) => void;

	// Filter Actions
	setSortBy: (sortBy: ActivitySortCriteria) => void;
	toggleExpandActivity: (id: string) => void;
	toggleGroupByDate: () => void;
	toggleOnlyAlerts: () => void;
	toggleSelectActivity: (id: string) => void;
	unselectActivity: (id: string) => void;
}

// Estado inicial para el store
const initialState: ActivityState = {
	// Datos principales
	activities: {},
	isLoading: false,
	error: null,
	lastUpdated: null,

	// Estado UI
	selectedIds: [],
	expandedIds: [],
	highlightedId: null,
	detailActivityId: null,
	isDetailModalOpen: false,
	groupByDate: true,

	// Estado de filtros
	sortBy: ActivitySortCriteria.DATE_DESC,
	searchQuery: '',
	selectedCategories: [],
	onlyAlerts: false,
	dateRange: {
		from: null,
		to: null,
	},
	filterByImageId: null,
};

/**
 * Store de actividades con estructura plana
 */
export const useActivityStore = create<ActivityStore>()(
	devtools(
		persist(
			(set, get) => {
				storeLogger.info('🏗️ Inicializando ActivityStore (estructura plana)');

				return {
					...initialState,

					// Getters
					getActivity: (id: string) => {
						return get().activities[id];
					},

					getActivities: () => {
						return Object.values(get().activities);
					},

					getActivitiesByImageId: (imageId: string) => {
						return Object.values(get().activities).filter(
							(activity) => activity.entityType === 'image' && activity.entityId === imageId
						);
					},

					// Operaciones síncronas
					addActivity: (activity: ActivityBase) => {
						const extendedActivity = extendActivity(activity);
						set((state) => ({
							activities: {
								...state.activities,
								[activity.id]: extendedActivity,
							},
							lastUpdated: Date.now(),
						}));
					},

					addActivities: (activities: ActivityBase[]) => {
						const extendedActivities = extendActivities(activities);
						const activitiesMap = extendedActivities.reduce(
							(acc, activity) => {
								acc[activity.id] = activity;
								return acc;
							},
							{} as Record<string, ActivityComplete>
						);

						set((state) => ({
							activities: {
								...state.activities,
								...activitiesMap,
							},
							lastUpdated: Date.now(),
						}));
					},

					deleteActivity: (id: string) => {
						set((state) => {
							const newActivities = { ...state.activities };
							delete newActivities[id];

							return {
								activities: newActivities,
								lastUpdated: Date.now(),
							};
						});
					},

					clearActivities: () => {
						set(() => ({
							activities: {},
							lastUpdated: Date.now(),
						}));
					},

					// Estado de carga
					setLoading: (isLoading: boolean) => {
						set(() => ({
							isLoading,
						}));
					},

					setError: (error: string | null) => {
						set(() => ({
							error,
						}));
					},

					// Operaciones asíncronas
					fetchActivity: async (id: string) => {
						try {
							set(() => ({
								isLoading: true,
								error: null,
							}));

							const activity = await getActivityFromApi(id);
							if (activity) {
								const extendedActivity = extendActivity(activity);
								set((state) => ({
									activities: {
										...state.activities,
										[activity.id]: extendedActivity,
									},
									lastUpdated: Date.now(),
								}));
							}
							return activity ? extendActivity(activity) : undefined;
						} catch (error) {
							set(() => ({
								error: error instanceof Error ? error.message : 'Error desconocido',
							}));
							return;
						} finally {
							set(() => ({
								isLoading: false,
							}));
						}
					},

					fetchActivities: async (filters?: ActivityFilters) => {
						try {
							set(() => ({
								isLoading: true,
								error: null,
							}));

							const result = await getActivitiesFromApi(filters ?? {});
							if (result) {
								const extendedActivities = extendActivities(result.activities);
								const activitiesMap = extendedActivities.reduce(
									(acc, activity) => {
										acc[activity.id] = activity;
										return acc;
									},
									{} as Record<string, ActivityComplete>
								);

								set((state) => ({
									activities: {
										...state.activities,
										...activitiesMap,
									},
									lastUpdated: Date.now(),
								}));
								return result;
							}
							return;
						} catch (error) {
							set(() => ({
								error: error instanceof Error ? error.message : 'Error desconocido',
							}));
							return;
						} finally {
							set(() => ({
								isLoading: false,
							}));
						}
					},

					createActivity: async (data: {
						type: string;
						description?: string;
						entityType?: string;
						entityId?: string;
						metadata?: Record<string, any>;
					}) => {
						try {
							set(() => ({
								isLoading: true,
								error: null,
							}));

							const createdActivity = await createActivityInApi({
								type: data.type,
								description: data.description ?? '',
								entityType: data.entityType ?? 'system',
								entityId: data.entityId ?? '',
								action: 'create',
								userId: 'system', // TODO: Get from auth
							});
							const extendedActivity = extendActivity(createdActivity);

							set((state) => ({
								activities: {
									...state.activities,
									[createdActivity.id]: extendedActivity,
								},
								lastUpdated: Date.now(),
							}));

							return extendedActivity;
						} catch (error) {
							set(() => ({
								error: error instanceof Error ? error.message : 'Error desconocido',
							}));
							return;
						} finally {
							set(() => ({
								isLoading: false,
							}));
						}
					},

					removeActivity: async (id: string) => {
						try {
							set(() => ({
								isLoading: true,
								error: null,
							}));

							await deleteActivityFromApi(id);
							set((state) => {
								const newActivities = { ...state.activities };
								delete newActivities[id];

								return {
									activities: newActivities,
									lastUpdated: Date.now(),
								};
							});

							return true;
						} catch (error) {
							set(() => ({
								error: error instanceof Error ? error.message : 'Error desconocido',
							}));
							return false;
						} finally {
							set(() => ({
								isLoading: false,
							}));
						}
					},

					// UI Actions
					selectActivity: (id: string) => {
						set((state) => ({
							selectedIds: [...state.selectedIds, id],
						}));
					},

					unselectActivity: (id: string) => {
						set((state) => ({
							selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
						}));
					},

					toggleSelectActivity: (id: string) => {
						set((state) => {
							const isSelected = state.selectedIds.includes(id);
							return {
								selectedIds: isSelected
									? state.selectedIds.filter((selectedId) => selectedId !== id)
									: [...state.selectedIds, id],
							};
						});
					},

					selectMultipleActivities: (ids: string[]) => {
						set(() => ({
							selectedIds: ids,
						}));
					},

					clearSelection: () => {
						set(() => ({
							selectedIds: [],
						}));
					},

					expandActivity: (id: string) => {
						set((state) => ({
							expandedIds: [...state.expandedIds, id],
						}));
					},

					collapseActivity: (id: string) => {
						set((state) => ({
							expandedIds: state.expandedIds.filter((expandedId) => expandedId !== id),
						}));
					},

					toggleExpandActivity: (id: string) => {
						set((state) => {
							const isExpanded = state.expandedIds.includes(id);
							return {
								expandedIds: isExpanded
									? state.expandedIds.filter((expandedId) => expandedId !== id)
									: [...state.expandedIds, id],
							};
						});
					},

					setHighlightedActivity: (id: string | null) => {
						set(() => ({
							highlightedId: id,
						}));
					},

					openDetailModal: (id: string) => {
						set(() => ({
							detailActivityId: id,
							isDetailModalOpen: true,
						}));
					},

					closeDetailModal: () => {
						set(() => ({
							isDetailModalOpen: false,
						}));
					},

					toggleGroupByDate: () => {
						set((state) => ({
							groupByDate: !state.groupByDate,
						}));
					},

					// Filter Actions
					setSortBy: (sortBy: ActivitySortCriteria) => {
						set(() => ({
							sortBy,
						}));
					},

					setSearchQuery: (query: string) => {
						set(() => ({
							searchQuery: query,
						}));
					},

					setSelectedCategories: (categories: string[]) => {
						set(() => ({
							selectedCategories: categories,
						}));
					},

					toggleOnlyAlerts: () => {
						set((state) => ({
							onlyAlerts: !state.onlyAlerts,
						}));
					},

					setDateRange: (from: Date | null, to: Date | null) => {
						set(() => ({
							dateRange: {
								from,
								to,
							},
						}));
					},

					setFilterByImageId: (imageId: string | null) => {
						set(() => ({
							filterByImageId: imageId,
						}));
					},

					clearFilters: () => {
						set(() => ({
							searchQuery: '',
							selectedCategories: [],
							onlyAlerts: false,
							dateRange: {
								from: null,
								to: null,
							},
							filterByImageId: null,
						}));
					},
				};
			},
			{
				name: 'activity-store',
				// Solo persistir configuraciones de usuario, no los datos de actividades
				partialize: (state) => ({
					groupByDate: state.groupByDate,
					sortBy: state.sortBy,
					onlyAlerts: state.onlyAlerts,
				}),
			}
		),
		{
			name: 'ActivityStore',
			enabled: process.env.NODE_ENV === 'development',
		}
	)
);

// Exportar selectores útiles
export * from './selectors';

// Exportar todo desde types para facilitar el uso
export * from './types';

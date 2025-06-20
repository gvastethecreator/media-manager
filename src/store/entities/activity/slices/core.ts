/**
 * @file Slice principal para operaciones CRUD del store de actividades
 * @module store/entities/activity/slices/core
 */

import {
	createActivity as createActivityAction,
	deleteActivity as deleteActivityAction,
	getActivityById,
	getFilteredActivities,
} from '@/app/actions/activity';
import { extendActivities, extendActivity } from '@/transformers/activity';
import type { ActivityBase, ActivityComplete, ActivityFilters, ActivityListResponse } from '@/types/entities/activity';
import type { StateCreator } from 'zustand';
import type { ActivityState } from '../types';

// Slice para operaciones CRUD básicas
export interface ActivityCoreSlice {
	// Getters
	getActivity: (id: string) => ActivityComplete | undefined;
	getActivities: () => ActivityComplete[];
	getActivitiesByImageId: (imageId: string) => ActivityComplete[];

	// Operaciones
	addActivity: (activity: ActivityBase) => void;
	addActivities: (activities: ActivityBase[]) => void;
	deleteActivity: (id: string) => void;
	clearActivities: () => void;

	// Estado de carga
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;

	// Acciones asíncronas
	fetchActivity: (id: string) => Promise<ActivityComplete | undefined>;
	fetchActivities: (filters?: ActivityFilters) => Promise<ActivityListResponse | undefined>;
	createActivity: (data: {
		type: string;
		description?: string;
		imageId?: string;
		metadata?: Record<string, any>;
	}) => Promise<ActivityComplete | undefined>;
	removeActivity: (id: string) => Promise<boolean>;
}

// Creador del slice
export const createActivityCoreSlice: StateCreator<ActivityState & ActivityCoreSlice, [], [], ActivityCoreSlice> = (
	set,
	get
) => ({
	// Getters
	getActivity: (id: string) => {
		return get().core.activities[id];
	},

	getActivities: () => {
		return Object.values(get().core.activities);
	},

	getActivitiesByImageId: (imageId: string) => {
		return Object.values(get().core.activities).filter((activity) => activity.imageId === imageId);
	},

	// Operaciones síncronas
	addActivity: (activity: ActivityBase) => {
		const extendedActivity = extendActivity(activity);
		set((state) => ({
			core: {
				...state.core,
				activities: {
					...state.core.activities,
					[activity.id]: extendedActivity,
				},
				lastUpdated: Date.now(),
			},
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
			core: {
				...state.core,
				activities: {
					...state.core.activities,
					...activitiesMap,
				},
				lastUpdated: Date.now(),
			},
		}));
	},

	deleteActivity: (id: string) => {
		set((state) => {
			const newActivities = { ...state.core.activities };
			delete newActivities[id];

			return {
				core: {
					...state.core,
					activities: newActivities,
					lastUpdated: Date.now(),
				},
			};
		});
	},

	clearActivities: () => {
		set((state) => ({
			core: {
				...state.core,
				activities: {},
				lastUpdated: Date.now(),
			},
		}));
	},

	// Estado de carga
	setLoading: (isLoading: boolean) => {
		set((state) => ({
			core: {
				...state.core,
				isLoading,
			},
		}));
	},

	setError: (error: string | null) => {
		set((state) => ({
			core: {
				...state.core,
				error,
			},
		}));
	},

	// Operaciones asíncronas
	fetchActivity: async (id: string) => {
		const state = get();
		try {
			state.setLoading(true);
			const activity = await getActivityById(id);
			if (activity) {
				state.addActivity(activity);
			}
			return activity ? extendActivity(activity) : undefined;
		} catch (error) {
			state.setError(error instanceof Error ? error.message : 'Error desconocido');
			return undefined;
		} finally {
			state.setLoading(false);
		}
	},

	fetchActivities: async (filters?: ActivityFilters) => {
		const state = get();
		try {
			state.setLoading(true);

			const result = await getFilteredActivities(filters ?? {});
			if (result) {
				state.addActivities(result.activities);
				return result;
			}
			return undefined;
		} catch (error) {
			state.setError(error instanceof Error ? error.message : 'Error desconocido');
			return undefined;
		} finally {
			state.setLoading(false);
		}
	},

	createActivity: async (data: {
		type: string;
		description?: string;
		imageId?: string;
		metadata?: Record<string, any>;
	}) => {
		const state = get();
		try {
			state.setLoading(true);
			// Llamamos a la acción del servidor con los parámetros esperados
			const createdActivity = await createActivityAction(data.type, data.metadata ?? {}, data.imageId);
			state.addActivity(createdActivity);
			return extendActivity(createdActivity);
		} catch (error) {
			state.setError(error instanceof Error ? error.message : 'Error desconocido');
			return undefined;
		} finally {
			state.setLoading(false);
		}
	},

	removeActivity: async (id: string) => {
		const state = get();
		try {
			state.setLoading(true);
			const result = await deleteActivityAction(id);
			if (result) {
				state.deleteActivity(id);
			}
			return result;
		} catch (error) {
			state.setError(error instanceof Error ? error.message : 'Error desconocido');
			return false;
		} finally {
			state.setLoading(false);
		}
	},
});

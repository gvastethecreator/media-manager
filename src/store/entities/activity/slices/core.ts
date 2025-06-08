/**
 * @file Slice principal para operaciones CRUD del store de actividades
 * @module store/entities/activity/slices/core
 */

import type { StateCreator } from 'zustand';
import { extendActivities, extendActivity } from '../../../../transformers/activity';
import type {
        Activity,
        ActivityBase,
        ActivityFilters,
        ActivityListResponse,
        CreateActivityData,
} from '../../../../types/entities/activity';
import {
        createActivity as createActivityAction,
        deleteActivity as deleteActivityAction,
        getActivityById,
        getFilteredActivities,
} from '@/app/actions/activity';
import type { ActivityState } from '../types';

// Slice para operaciones CRUD básicas
export interface ActivityCoreSlice {
	// Getters
	getActivity: (id: string) => Activity | undefined;
	getActivities: () => Activity[];
	getActivitiesByImageId: (imageId: string) => Activity[];

	// Operaciones
	addActivity: (activity: ActivityBase) => void;
	addActivities: (activities: ActivityBase[]) => void;
	deleteActivity: (id: string) => void;
	clearActivities: () => void;

	// Estado de carga
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;

	// Acciones asíncronas
	fetchActivity: (id: string) => Promise<Activity | undefined>;
	fetchActivities: (filters?: ActivityFilters) => Promise<ActivityListResponse | undefined>;
	createActivity: (data: CreateActivityData) => Promise<Activity | undefined>;
	removeActivity: (id: string) => Promise<boolean>;
}

// Creador del slice
export const createActivityCoreSlice: StateCreator<ActivityState, [], [], ActivityCoreSlice> = (set, get) => ({
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
			{} as Record<string, Activity>
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
                const { setLoading, setError, addActivity } = get();
                try {
                        setLoading(true);
                        const activity = await getActivityById(id);
                        if (activity) {
                                addActivity(activity);
                        }
                        return activity ?? undefined;
                } catch (error) {
                        setError(error instanceof Error ? error.message : 'Error desconocido');
                        return undefined;
                } finally {
                        setLoading(false);
                }
        },

        fetchActivities: async (filters?: ActivityFilters) => {
                const { setLoading, setError, addActivities } = get();
                try {
                        setLoading(true);

                        const result = await getFilteredActivities(filters ?? {});
                        if (result) {
                                addActivities(result.activities);
                                return result;
                        }
                        return undefined;
                } catch (error) {
                        setError(error instanceof Error ? error.message : 'Error desconocido');
                        return undefined;
                } finally {
                        setLoading(false);
                }
        },

        createActivity: async (data: CreateActivityData) => {
                const { setLoading, setError, addActivity } = get();
                try {
                        setLoading(true);
                        const createdActivity = await createActivityAction(data.type, data.metadata ?? {}, data.imageId);
                        addActivity(createdActivity);
                        return createdActivity;
                } catch (error) {
                        setError(error instanceof Error ? error.message : 'Error desconocido');
                        return undefined;
                } finally {
                        setLoading(false);
                }
        },

        removeActivity: async (id: string) => {
                const { setLoading, setError, deleteActivity } = get();
                try {
                        setLoading(true);
                        const result = await deleteActivityAction(id);
                        if (result) {
                                deleteActivity(id);
                        }
                        return result;
                } catch (error) {
                        setError(error instanceof Error ? error.message : 'Error desconocido');
                        return false;
                } finally {
                        setLoading(false);
                }
        },
});

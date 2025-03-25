/**
 * @file Slice principal para operaciones CRUD del store de actividades
 * @module store/entities/activity/slices/core
 */

import { StateCreator } from 'zustand';
import {
    extendActivities,
    extendActivity,
    mapCreateActivityDataToPrisma
} from '../../../../transformers/activity';
import {
    type Activity,
    type ActivityBase,
    type ActivityFilters,
    type ActivityListResponse,
    type CreateActivityData
} from '../../../../types/entities/activity';
import { ActivityState } from '../types';

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
export const createActivityCoreSlice: StateCreator<
  ActivityState,
  [],
  [],
  ActivityCoreSlice
> = (set, get) => ({
  // Getters
  getActivity: (id: string) => {
    return get().core.activities[id];
  },

  getActivities: () => {
    return Object.values(get().core.activities);
  },

  getActivitiesByImageId: (imageId: string) => {
    return Object.values(get().core.activities).filter(
      (activity) => activity.imageId === imageId
    );
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
      const response = await fetch(`/api/activity/${id}`);
      if (!response.ok) throw new Error('Error al cargar la actividad');

      const activityData = await response.json();
      addActivity(activityData);
      return get().core.activities[id];
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

      // Construir URL con parámetros de filtro
      let url = '/api/activity';
      if (filters) {
        const params = new URLSearchParams();
        if (filters.types && filters.types.length > 0) {
          params.append('types', filters.types.join(','));
        }
        if (filters.startDate) {
          params.append('startDate', new Date(filters.startDate).toISOString());
        }
        if (filters.endDate) {
          params.append('endDate', new Date(filters.endDate).toISOString());
        }
        if (filters.imageId) {
          params.append('imageId', filters.imageId);
        }
        if (filters.searchQuery) {
          params.append('query', filters.searchQuery);
        }
        if (filters.limit) {
          params.append('limit', filters.limit.toString());
        }
        if (filters.offset) {
          params.append('offset', filters.offset.toString());
        }

        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar las actividades');

      const data = await response.json();
      addActivities(data.activities);

      return {
        activities: Object.values(get().core.activities),
        totalCount: data.totalCount,
        hasMore: data.hasMore,
      };
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
      const prismaData = mapCreateActivityDataToPrisma(data);

      const response = await fetch('/api/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prismaData),
      });

      if (!response.ok) throw new Error('Error al crear la actividad');

      const createdActivity = await response.json();
      addActivity(createdActivity);
      return get().core.activities[createdActivity.id];
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

      const response = await fetch(`/api/activity/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar la actividad');

      deleteActivity(id);
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  },
});
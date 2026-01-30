import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Tipos para la API
interface CreateActivityData {
	type: string;
	entityType: string;
	entityId: string;
	action: string;
	userId: string;
	description: string;
	metadata?: Record<string, any>;
	ipAddress?: string;
	userAgent?: string;
	sessionId?: string;
}

interface GetActivitiesParams {
	page?: number;
	limit?: number;
	type?: string;
	imageId?: string;
	albumId?: string;
	folderId?: string;
	characterId?: string;
	collectionId?: string;
}

interface ActivityStatsParams {
	days?: number;
	type?: string;
}

interface Activity {
	id: string;
	type: string;
	entityType: string;
	entityId: string;
	action: string;
	userId: string;
	description: string;
	metadata?: Record<string, any>;
	ipAddress?: string;
	userAgent?: string;
	sessionId?: string;
	createdAt: string;
	updatedAt: string;
}

interface ActivitiesResponse {
	data: Activity[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		pages: number;
	};
	timestamp: string;
}

interface ActivityResponse {
	data: Activity;
	message: string;
	timestamp: string;
}

interface ActivityStats {
	totalActivities: number;
	activitiesByType: Record<string, number>;
	activitiesByDay: Array<{
		date: string;
		count: number;
	}>;
	mostActiveEntities: Array<{
		entityId: string;
		entityType: string;
		count: number;
	}>;
}

interface ActivityStatsResponse {
	data: ActivityStats;
	timestamp: string;
}

// API functions
const activityApi = {
	async createActivity(data: CreateActivityData): Promise<Activity> {
		const response = await fetch('/api/activity', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`Error ${response.status}: ${response.statusText}`);
		}

		const result: ActivityResponse = await response.json();
		return result.data;
	},

	async getActivities(params: GetActivitiesParams = {}): Promise<ActivitiesResponse> {
		const searchParams = new URLSearchParams();

		if (params.page) {
			searchParams.set('page', params.page.toString());
		}
		if (params.limit) {
			searchParams.set('limit', params.limit.toString());
		}
		if (params.type) {
			searchParams.set('type', params.type);
		}
		if (params.imageId) {
			searchParams.set('imageId', params.imageId);
		}
		if (params.albumId) {
			searchParams.set('albumId', params.albumId);
		}
		if (params.folderId) {
			searchParams.set('folderId', params.folderId);
		}
		if (params.characterId) {
			searchParams.set('characterId', params.characterId);
		}
		if (params.collectionId) {
			searchParams.set('collectionId', params.collectionId);
		}

		const response = await fetch(`/api/activity?${searchParams.toString()}`);

		if (!response.ok) {
			throw new Error(`Error ${response.status}: ${response.statusText}`);
		}

		return response.json();
	},

	async getActivityStats(params: ActivityStatsParams = {}): Promise<ActivityStats> {
		const searchParams = new URLSearchParams();

		if (params.days) {
			searchParams.set('days', params.days.toString());
		}
		if (params.type) {
			searchParams.set('type', params.type);
		}

		const response = await fetch(`/api/activity/stats?${searchParams.toString()}`);

		if (!response.ok) {
			throw new Error(`Error ${response.status}: ${response.statusText}`);
		}

		const result: ActivityStatsResponse = await response.json();
		return result.data;
	},

	async deleteActivity(id: string): Promise<void> {
		const response = await fetch(`/api/activity/${id}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error(`Error ${response.status}: ${response.statusText}`);
		}
	},
};

// React Query hooks
export function useActivities(params: GetActivitiesParams = {}) {
	return useQuery({
		queryKey: ['activities', 'list', params],
		queryFn: () => activityApi.getActivities(params),
		staleTime: 1 * 60 * 1000, // 1 minuto
		gcTime: 5 * 60 * 1000, // 5 minutos
	});
}

export function useActivityStats(params: ActivityStatsParams = {}) {
	return useQuery({
		queryKey: ['activities', 'stats', params],
		queryFn: () => activityApi.getActivityStats(params),
		staleTime: 5 * 60 * 1000, // 5 minutos
		gcTime: 10 * 60 * 1000, // 10 minutos
	});
}

export function useCreateActivity() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: activityApi.createActivity,
		onSuccess: () => {
			// Invalidar las consultas de activities para refrescar la lista
			queryClient.invalidateQueries({ queryKey: ['activities'] });
		},
	});
}

export function useDeleteActivity() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: activityApi.deleteActivity,
		onSuccess: () => {
			// Invalidar las consultas de activities para refrescar la lista
			queryClient.invalidateQueries({ queryKey: ['activities'] });
		},
	});
}

// Hook de conveniencia para registrar actividades de vista
export function useLogActivity() {
	return useCreateActivity();
}

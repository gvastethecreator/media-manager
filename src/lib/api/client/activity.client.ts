/**
 * Cliente de API para actividades.
 * Permite crear, obtener, listar y eliminar actividades
 * consumiendo los endpoints de `/api/activity`.
 * Se añade para reemplazar el uso directo de servicios
 * en stores y hooks del lado cliente.
 * ✅ Migrado a consumo de API - julio 2025
 */
import type {
    Activity,
    ActivityListResponse,
    ActivityFilters,
    CreateActivityData,
} from '@/types/entities/activity';

const API_BASE_PATH = '/api/activity';

export async function getActivityFromApi(id: string): Promise<Activity> {
    const response = await fetch(`${API_BASE_PATH}/${id}`);
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`Actividad con ID ${id} no encontrada`);
        }
        throw new Error(`Error al obtener actividad: ${response.status}`);
    }
    const result = await response.json();
    return result.data ?? result;
}

export async function getActivitiesFromApi(
    filters: ActivityFilters = {},
): Promise<ActivityListResponse> {
    const params = new URLSearchParams();
    if (filters.types) params.append('type', filters.types.join(','));
    if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters.imageId) params.append('imageId', filters.imageId);
    if (filters.searchQuery) params.append('searchQuery', filters.searchQuery);
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));

    const query = params.toString();
    const response = await fetch(query ? `${API_BASE_PATH}?${query}` : API_BASE_PATH);
    if (!response.ok) throw new Error('Error al obtener actividades');
    const result = await response.json();
    // El endpoint devuelve datos y paginación; adaptamos a la estructura del store
    return {
        activities: result.data ?? [],
        totalCount: result.pagination?.total ?? 0,
        hasMore: result.pagination?.hasMore ?? false,
    } as ActivityListResponse;
}

export async function createActivityInApi(
    data: CreateActivityData,
): Promise<Activity> {
    const response = await fetch(API_BASE_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear actividad');
    const result = await response.json();
    return result.data ?? result;
}

export async function deleteActivityFromApi(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Error al eliminar actividad');
}

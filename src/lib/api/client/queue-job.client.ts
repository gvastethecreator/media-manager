/**
 * Cliente de API para trabajos en cola.
 */
import type {
    CreateQueueJobInput,
    QueueJobExtended,
    QueueJobFilters,
    QueueJobPaginationOptions,
    QueueStats,
    UpdateQueueJobInput,
} from '@/types/entities/queue-job';

const API_BASE_PATH = '/api/queue';

export async function getQueueJobsFromApi(filters: QueueJobFilters = {}, pagination: QueueJobPaginationOptions = {}): Promise<{ items: QueueJobExtended[]; total: number; page: number; limit: number; totalPages: number; }> {
    const params = new URLSearchParams();
    if (Object.keys(filters).length) params.append('filters', JSON.stringify(filters));
    if (Object.keys(pagination).length) params.append('pagination', JSON.stringify(pagination));
    const response = await fetch(`${API_BASE_PATH}?${params.toString()}`);
    if (!response.ok) throw new Error('Error al obtener trabajos');
    return response.json();
}

export async function getQueueStatsFromApi(): Promise<QueueStats> {
    const response = await fetch(`${API_BASE_PATH}/stats`);
    if (!response.ok) throw new Error('Error al obtener estadísticas de cola');
    return response.json();
}

export async function createQueueJobInApi(input: CreateQueueJobInput): Promise<QueueJobExtended> {
    const response = await fetch(API_BASE_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error('Error al crear trabajo');
    return response.json();
}

export async function updateQueueJobInApi(id: string, input: UpdateQueueJobInput): Promise<QueueJobExtended> {
    const response = await fetch(`${API_BASE_PATH}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error('Error al actualizar trabajo');
    return response.json();
}

export async function deleteQueueJobFromApi(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Error al eliminar trabajo');
}

export async function retryQueueJobInApi(id: string): Promise<QueueJobExtended> {
    const response = await fetch(`${API_BASE_PATH}/${id}/retry`, { method: 'POST' });
    if (!response.ok) throw new Error('Error al reintentar trabajo');
    return response.json();
}

export async function cancelQueueJobInApi(id: string): Promise<QueueJobExtended> {
    const response = await fetch(`${API_BASE_PATH}/${id}/cancel`, { method: 'POST' });
    if (!response.ok) throw new Error('Error al cancelar trabajo');
    return response.json();
}

export function matchesFilters(job: QueueJobExtended, filters: QueueJobFilters = {}): boolean {
    if (Object.keys(filters).length === 0) return true;
    if (filters.queue && job.queue !== filters.queue) return false;
    if (filters.status && job.status !== filters.status) return false;
    if (filters.priority !== undefined && job.priority !== filters.priority) return false;
    if (filters.createdAfter && new Date(job.createdAt) < new Date(filters.createdAfter)) return false;
    if (filters.createdBefore && new Date(job.createdAt) > new Date(filters.createdBefore)) return false;
    return true;
}

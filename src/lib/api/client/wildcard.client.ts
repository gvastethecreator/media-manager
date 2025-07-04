/**
 * Cliente de API para wildcards.
 */
import type { WildcardCreateInput, WildcardUpdateInput, WildcardWithStats } from '@/types/entities/wildcard';

const API_BASE_PATH = '/api/wildcards';

export async function getWildcardFromApi(id: string): Promise<WildcardWithStats | null> {
    const response = await fetch(`${API_BASE_PATH}/${id}`);
    if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Error al obtener wildcard');
    }
    return response.json();
}

export async function getWildcardsFromApi(): Promise<WildcardWithStats[]> {
    const response = await fetch(API_BASE_PATH);
    if (!response.ok) throw new Error('Error al obtener wildcards');
    return response.json();
}

export async function createWildcardInApi(data: WildcardCreateInput): Promise<WildcardWithStats> {
    const response = await fetch(API_BASE_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear wildcard');
    return response.json();
}

export async function updateWildcardInApi(id: string, data: WildcardUpdateInput): Promise<WildcardWithStats> {
    const response = await fetch(`${API_BASE_PATH}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar wildcard');
    return response.json();
}

export async function deleteWildcardFromApi(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Error al eliminar wildcard');
}

export async function moveWildcardInApi(id: string, newParentId: string | null): Promise<void> {
    const response = await fetch(`${API_BASE_PATH}/${id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: newParentId }),
    });
    if (!response.ok) throw new Error('Error al mover wildcard');
}

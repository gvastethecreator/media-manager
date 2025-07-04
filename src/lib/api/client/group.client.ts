/**
 * Cliente de API para grupos.
 */
import type {
    GroupCreateInput,
    GroupUpdateInput,
    GroupWithStats,
} from '@/types/entities/group';

const API_BASE_PATH = '/api/groups';

export async function getGroupsFromApi(): Promise<GroupWithStats[]> {
    const response = await fetch(API_BASE_PATH);
    if (!response.ok) throw new Error('Error al obtener grupos');
    return response.json();
}

export async function createGroupInApi(data: GroupCreateInput): Promise<GroupWithStats> {
    const response = await fetch(API_BASE_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear grupo');
    return response.json();
}

export async function updateGroupInApi(id: string, data: GroupUpdateInput): Promise<GroupWithStats> {
    const response = await fetch(`${API_BASE_PATH}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar grupo');
    return response.json();
}

export async function deleteGroupFromApi(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Error al eliminar grupo');
}

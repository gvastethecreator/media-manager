/**
 * Cliente de API para world items.
 */
import type { CreateWorldItemData, UpdateWorldItemData, WorldItem } from '@/types/entities/world-item';

const API_BASE_PATH = '/api/world-items';

export async function getWorldItemsFromApi(): Promise<WorldItem[]> {
    const response = await fetch(API_BASE_PATH);
    if (!response.ok) throw new Error('Error al obtener world items');
    return response.json();
}

export async function createWorldItemInApi(data: CreateWorldItemData): Promise<WorldItem> {
    const response = await fetch(API_BASE_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear world item');
    return response.json();
}

export async function updateWorldItemInApi(id: string, data: UpdateWorldItemData): Promise<WorldItem> {
    const response = await fetch(`${API_BASE_PATH}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar world item');
    return response.json();
}

export async function deleteWorldItemFromApi(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Error al eliminar world item');
}

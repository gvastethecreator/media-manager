/**
 * Cliente de API para colecciones.
 */
import type {
    CollectionCreateInput,
    CollectionUpdateInput,
    CollectionWithStats,
} from '@/types/entities/collection';

const API_BASE_PATH = '/api/collections';

export async function getCollectionsFromApi(): Promise<CollectionWithStats[]> {
    const response = await fetch(API_BASE_PATH);
    if (!response.ok) throw new Error('Error al obtener colecciones');
    return response.json();
}

export async function getCollectionFromApi(id: string): Promise<CollectionWithStats> {
    const response = await fetch(`${API_BASE_PATH}/${id}`);
    if (!response.ok) throw new Error('Error al obtener la colección');
    return response.json();
}

export async function createCollectionInApi(data: CollectionCreateInput): Promise<CollectionWithStats> {
    const response = await fetch(API_BASE_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear colección');
    return response.json();
}

export async function updateCollectionInApi(id: string, data: CollectionUpdateInput): Promise<CollectionWithStats> {
    const response = await fetch(`${API_BASE_PATH}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar colección');
    return response.json();
}

export async function deleteCollectionFromApi(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Error al eliminar colección');
}

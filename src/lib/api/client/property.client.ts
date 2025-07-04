/**
 * Cliente de API para propiedades.
 */
import type {
    PropertyCreateInput,
    PropertyUpdateInput,
    PropertyWithStats,
} from '@/types/entities/property';

const API_BASE_PATH = '/api/properties';

export async function getPropertiesFromApi(): Promise<PropertyWithStats[]> {
    const response = await fetch(API_BASE_PATH);
    if (!response.ok) throw new Error('Error al obtener propiedades');
    return response.json();
}

export async function createPropertyInApi(
    data: PropertyCreateInput,
): Promise<PropertyWithStats> {
    const response = await fetch(API_BASE_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear propiedad');
    return response.json();
}

export async function updatePropertyInApi(
    id: string,
    data: PropertyUpdateInput,
): Promise<PropertyWithStats> {
    const response = await fetch(`${API_BASE_PATH}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar propiedad');
    return response.json();
}

export async function deletePropertyFromApi(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Error al eliminar propiedad');
}

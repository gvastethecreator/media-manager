/**
 * Cliente de API para archivos 3D.
 */
import type {
    File3DCreateInput,
    File3DUpdateInput,
    File3DWithStats,
} from '@/types/entities/file3d';

const API_BASE_PATH = '/api/file3d';

export async function getFile3DsFromApi(): Promise<File3DWithStats[]> {
    const response = await fetch(API_BASE_PATH);
    if (!response.ok) throw new Error('Error al obtener archivos 3D');
    return response.json();
}

export async function createFile3DInApi(data: File3DCreateInput): Promise<File3DWithStats> {
    const response = await fetch(API_BASE_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear archivo 3D');
    return response.json();
}

export async function updateFile3DInApi(id: string, data: File3DUpdateInput): Promise<File3DWithStats> {
    const response = await fetch(`${API_BASE_PATH}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar archivo 3D');
    return response.json();
}

export async function deleteFile3DFromApi(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Error al eliminar archivo 3D');
}

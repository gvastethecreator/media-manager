/**
 * Cliente de API para archivos JSON.
 * Reemplaza llamadas directas a servicios del servidor.
 */
import type { JsonFileCreateInput, JsonFileUpdateInput, JsonFileWithStats } from '@/types/entities/json-file';

const API_BASE_PATH = '/api/json-files';

export async function getJsonFilesFromApi(): Promise<JsonFileWithStats[]> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) {
		throw new Error('Error al obtener archivos JSON');
	}
	const payload = await response.json();
	if (Array.isArray(payload)) {
		return payload as JsonFileWithStats[];
	}
	return (payload?.data as JsonFileWithStats[]) || [];
}

export async function createJsonFileInApi(data: JsonFileCreateInput): Promise<JsonFileWithStats> {
	const response = await fetch(API_BASE_PATH, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Error al crear archivo JSON');
	}
	return response.json();
}

export async function updateJsonFileInApi(id: string, data: JsonFileUpdateInput): Promise<JsonFileWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Error al actualizar archivo JSON');
	}
	return response.json();
}

export async function deleteJsonFileFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error('Error al eliminar archivo JSON');
	}
}

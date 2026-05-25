/**
 * @deprecated Usa `fetch` directo en vez de `ApiClient` (src/lib/api/client.ts).
 * Migrar a `apiClient.get/post/put/delete` para timeout, logging, y headers consistentes.
 * Ver #1 deepening opportunity en architecture review.
 */

/**
 * Cliente de API para grupos.
 */
import type { GroupCreateInput, GroupUpdateInput, GroupWithStats } from '@/types/entities/group';
import { unwrapArrayResponse } from './pagination';

const API_BASE_PATH = '/api/groups';

export async function getGroupsFromApi(): Promise<GroupWithStats[]> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) {
		throw new Error('Error al obtener grupos');
	}
	const result = await response.json();
	return unwrapArrayResponse<GroupWithStats>(result);
}

export async function createGroupInApi(data: GroupCreateInput): Promise<GroupWithStats> {
	const response = await fetch(API_BASE_PATH, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Error al crear grupo');
	}
	return response.json();
}

export async function updateGroupInApi(id: string, data: GroupUpdateInput): Promise<GroupWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Error al actualizar grupo');
	}
	return response.json();
}

export async function deleteGroupFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error('Error al eliminar grupo');
	}
}

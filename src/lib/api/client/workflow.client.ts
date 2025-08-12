/**
 * Cliente de API para workflows.
 */
import type { WorkflowCreateInput, WorkflowUpdateInput, WorkflowWithStats } from '@/types/entities/workflow';

const API_BASE_PATH = '/api/workflows';

export async function getWorkflowsFromApi(): Promise<WorkflowWithStats[]> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) {
		throw new Error('Error al obtener workflows');
	}
	return response.json();
}

export async function createWorkflowInApi(data: WorkflowCreateInput): Promise<WorkflowWithStats> {
	const response = await fetch(API_BASE_PATH, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Error al crear workflow');
	}
	return response.json();
}

export async function updateWorkflowInApi(id: string, data: WorkflowUpdateInput): Promise<WorkflowWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Error al actualizar workflow');
	}
	return response.json();
}

export async function deleteWorkflowFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error('Error al eliminar workflow');
	}
}

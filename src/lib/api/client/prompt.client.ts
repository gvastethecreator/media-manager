import type { PromptCreateInput, PromptsResponse, PromptUpdateInput } from '@/lib/api/prompts';
import type { PromptWithStats } from '@/types/entities/prompt';
import apiClient from '../client';

const API_BASE = '/prompts';

export const getPrompts = async (filters?: any): Promise<PromptWithStats[]> => {
	const params = new URLSearchParams(filters).toString();
	const response = await apiClient.get<PromptsResponse>(`${API_BASE}?${params}`);
	return response.data;
};

export const createPrompt = async (data: PromptCreateInput): Promise<PromptWithStats> => {
	return apiClient.post<PromptWithStats>(API_BASE, data);
};

export const updatePrompt = async (id: string, data: PromptUpdateInput): Promise<PromptWithStats> => {
	return apiClient.put<PromptWithStats>(`${API_BASE}/${id}`, data);
};

export const deletePromptFromApi = async (id: string): Promise<void> => {
	return apiClient.delete<void>(`${API_BASE}/${id}`);
};

// Funciones de relaciones
export const linkEntityToPrompt = async (promptId: string, entityId: string, entityType: string): Promise<void> => {
	return apiClient.post<void>(`${API_BASE}/${promptId}/link`, { entityId, entityType });
};

export const unlinkEntityFromPrompt = async (
	promptId: string,
	entityId: string,
	_entityType: string
): Promise<void> => {
	return apiClient.delete<void>(`${API_BASE}/${promptId}/unlink/${entityId}`);
};

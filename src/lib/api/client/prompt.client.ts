import type { PromptCreateInput, PromptsResponse, PromptUpdateInput, PromptWithStats } from '@/lib/api/prompts';
import apiClient from '../client';

const API_BASE = '/prompts';

export const getPromptsFromApi = async (filters?: any): Promise<PromptWithStats[]> => {
	const params = new URLSearchParams(filters).toString();
	const response = await apiClient.get<PromptsResponse>(`${API_BASE}?${params}`);
	return response.data;
};

export const createPromptInApi = async (data: PromptCreateInput): Promise<PromptWithStats> => {
	return apiClient.post<PromptWithStats>(API_BASE, data);
};

export const updatePromptInApi = async (id: string, data: PromptUpdateInput): Promise<PromptWithStats> => {
	return apiClient.put<PromptWithStats>(`${API_BASE}/${id}`, data);
};

export const deletePromptFromApi = async (id: string): Promise<void> => {
	return apiClient.delete<void>(`${API_BASE}/${id}`);
};

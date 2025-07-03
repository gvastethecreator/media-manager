import type { FolderCreateInput, FolderFilters, FoldersResponse, FolderUpdateInput } from '@/lib/api/folders';
import type { FolderWithStats } from '@/types/entities/folder';
import apiClient from '../client';

export const findFolders = async (filters: FolderFilters): Promise<FoldersResponse> => {
	const response = await apiClient.get('/folders', { params: filters });
	return response.data;
};

export const getAllFolders = async (): Promise<FolderWithStats[]> => {
	const response = await apiClient.get('/folders/tree');
	return response.data;
};

export const getFolder = async (id: string): Promise<FolderWithStats> => {
	const response = await apiClient.get(`/folders/${id}`);
	return response.data;
};

export const createFolder = async (data: FolderCreateInput): Promise<FolderWithStats> => {
	const response = await apiClient.post('/folders', data);
	return response.data;
};

export const updateFolder = async (id: string, data: FolderUpdateInput): Promise<FolderWithStats> => {
	const response = await apiClient.put(`/folders/${id}`, data);
	return response.data;
};

export const deleteFolder = async (id: string): Promise<void> => {
	await apiClient.delete(`/folders/${id}`);
};

export const moveFolder = async (folderId: string, newParentId: string | null): Promise<FolderWithStats> => {
	const response = await apiClient.post(`/folders/${folderId}/move`, { newParentId });
	return response.data;
};

export const toggleFolderFavorite = async (id: string): Promise<FolderWithStats> => {
	const response = await apiClient.post(`/folders/${id}/toggle-favorite`);
	return response.data;
};

export const reindexFolder = async (id: string): Promise<FolderWithStats> => {
	const response = await apiClient.post(`/folders/${id}/reindex`);
	return response.data;
};

export const reindexAllFolders = async (): Promise<{ processed: number; errors: string[] }> => {
	const response = await apiClient.post('/folders/reindex-all');
	return response.data;
};

export const getRecentFolderImages = async (folderId: string, limit: number): Promise<string[]> => {
	const response = await apiClient.get(`/folders/${folderId}/recent-images`, { params: { limit } });
	return response.data;
};

export const getFolderStats = async (
	folderId: string
): Promise<{
	totalImages: number;
	totalVideos: number;
	totalSize: number;
	lastActivity: Date | null;
}> => {
	const response = await apiClient.get(`/folders/${folderId}/stats`);
	return response.data;
};

export const getRootFolderId = async (): Promise<string> => {
	const response = await apiClient.get('/folders/root-id');
	return response.data.id;
};

export const getFolderPath = async (folderId: string): Promise<string> => {
	const response = await apiClient.get(`/folders/${folderId}/path`);
	return response.data.path;
};

export const getFolderName = async (folderId: string): Promise<string> => {
	const response = await apiClient.get(`/folders/${folderId}/name`);
	return response.data.name;
};

export const getFolderIdByPath = async (folderPath: string): Promise<string> => {
	const response = await apiClient.get('/folders/by-path', { params: { path: folderPath } });
	return response.data.id;
};

export const getParentFolderId = async (folderId: string): Promise<string | null> => {
	const response = await apiClient.get(`/folders/${folderId}/parent-id`);
	return response.data.parentFolderId;
};

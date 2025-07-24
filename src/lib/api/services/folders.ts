import type { FolderCreateInput, FolderFilters, FoldersResponse, FolderUpdateInput } from '@/lib/api/folders';
import type { FolderWithStats } from '@/types/entities/folder';
import { apiClient } from '../client';

export const findFolders = async (_filters: FolderFilters): Promise<FoldersResponse> => {
	const response = await apiClient.get<FoldersResponse>('/folders');
	return response;
};

export const getAllFolders = async (): Promise<FolderWithStats[]> => {
	const response = await apiClient.get('/folders/tree');
	return response;
};

export const getFolder = async (id: string): Promise<FolderWithStats> => {
	const response = await apiClient.get(`/folders/${id}`);
	return response;
};

export const createFolder = async (data: FolderCreateInput): Promise<FolderWithStats> => {
	const response = await apiClient.post('/folders', data);
	return response;
};

export const updateFolder = async (id: string, data: FolderUpdateInput): Promise<FolderWithStats> => {
	const response = await apiClient.put(`/folders/${id}`, data);
	return response;
};

export const deleteFolder = async (id: string): Promise<void> => {
	await apiClient.delete(`/folders/${id}`);
};

export const moveFolder = async (folderId: string, newParentId: string | null): Promise<FolderWithStats> => {
	const response = await apiClient.post(`/folders/${folderId}/move`, { newParentId });
	return response;
};

export const toggleFolderFavorite = async (id: string): Promise<FolderWithStats> => {
	const response = await apiClient.post(`/folders/${id}/toggle-favorite`);
	return response;
};

export const reindexFolder = async (id: string): Promise<FolderWithStats> => {
	const response = await apiClient.post(`/folders/${id}/reindex`);
	return response;
};

export const reindexAllFolders = async (): Promise<{ processed: number; errors: string[] }> => {
	const response = await apiClient.post('/folders/reindex-all');
	return response;
};

export const getRecentFolderImages = async (folderId: string, limit: number): Promise<string[]> => {
	const response = await apiClient.get(`/folders/${folderId}/recent-images?limit=${limit}`);
	return response;
};

export const getFolderStats = async (
	folderId: string
): Promise<{
	totalImages: number;
	totalVideos: number;
	totalAudio: number;
	totalDocuments: number;
	totalOthers: number;
	totalSize: number;
	lastActivity: Date | null;
	recentImages?: Array<{
		id: string;
		name: string;
		thumbnailUrl?: string;
	}>;
}> => {
	const response = await apiClient.get(`/folders/${folderId}/stats`);
	return response;
};

export const getRootFolderId = async (): Promise<string> => {
	const response = await apiClient.get('/folders/root-id');
	return response.id;
};

export const getFolderPath = async (folderId: string): Promise<string> => {
	const response = await apiClient.get(`/folders/${folderId}/path`);
	return response.path;
};

export const getFolderName = async (folderId: string): Promise<string> => {
	const response = await apiClient.get(`/folders/${folderId}/name`);
	return response.name;
};

export const getFolderIdByPath = async (folderPath: string): Promise<string> => {
	const response = await apiClient.get(`/folders/by-path?path=${encodeURIComponent(folderPath)}`);
	return response.id;
};

export const getParentFolderId = async (folderId: string): Promise<string | null> => {
	const response = await apiClient.get(`/folders/${folderId}/parent-id`);
	return response.parentFolderId;
};

/**
 * Valida si una carpeta ya existe en la ruta especificada
 * @param folderPath - Ruta de la carpeta a validar
 * @returns Promise<boolean> - true si la carpeta ya existe, false si no existe
 */
export const validateFolderExists = async (folderPath: string): Promise<boolean> => {
	try {
		// Hacer la petición directamente para evitar logs de error innecesarios
		const response = await fetch(
			`${process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : window.location.origin}/api/folders/by-path?path=${encodeURIComponent(folderPath)}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);

		// Si la respuesta es 200, la carpeta existe
		if (response.ok) {
			return true;
		}

		// Si es 404, la carpeta no existe (esto es esperado)
		if (response.status === 404) {
			return false;
		}

		// Para otros errores, lanzar excepción
		const errorText = await response.text();
		throw new Error(`Error validando carpeta: ${response.status} - ${errorText}`);
	} catch (error) {
		// Si es un error de red u otro tipo, asumir que la carpeta no existe
		if (error instanceof TypeError && error.message.includes('fetch')) {
			return false;
		}
		// Re-lanzar otros errores
		throw error;
	}
};

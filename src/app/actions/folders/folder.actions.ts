/**
 * @file Cliente de API para la entidad Folder
 * @module app/actions/folders/folder.actions
 * @description Funciones que llaman a las rutas API de carpetas
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type { FolderCreateInput, FolderUpdateInput, FolderWithStats } from '@/types/entities/folder';

const logger = clientLogger.withContext('FolderActions');
const API_BASE = '/api/folders';

/**
 * Crea una nueva carpeta.
 */
export async function createFolder(data: FolderCreateInput): Promise<FolderWithStats> {
	try {
		logger.info('📁 Creando carpeta via API', { name: data.name });
		const response = await fetch(API_BASE, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return await response.json();
	} catch (error) {
		logger.error('❌ Error en API createFolder', { error, data });
		throw error;
	}
}

/**
 * Actualiza una carpeta existente.
 */
export async function updateFolder(id: string, data: FolderUpdateInput): Promise<FolderWithStats> {
	try {
		logger.info(`🔄 Actualizando carpeta ${id} via API`);
		const response = await fetch(`${API_BASE}/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API updateFolder: ${id}`, { error, data });
		throw error;
	}
}

/**
 * Elimina una carpeta.
 */
export async function deleteFolder(id: string): Promise<void> {
	try {
		logger.warn(`🗑️ Eliminando carpeta ${id} via API`);
		const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
	} catch (error) {
		logger.error(`❌ Error en API deleteFolder: ${id}`, { error });
		throw error;
	}
}

/**
 * Obtiene una carpeta por su ID.
 */
export async function getFolder(id: string): Promise<FolderWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo carpeta ${id} via API`);
		const response = await fetch(`${API_BASE}/${id}`);
		if (!response.ok) {
			if (response.status === 404) return null;
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API getFolder: ${id}`, { error });
		throw error;
	}
}

/**
 * Obtiene todas las carpetas.
 */
export async function getAllFolders(): Promise<FolderWithStats[]> {
	try {
		logger.info('📂 Obteniendo todas las carpetas via API');
		const response = await fetch(API_BASE);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		const result = await response.json();
		return result.data || [];
	} catch (error) {
		logger.error('❌ Error en API getAllFolders', { error });
		throw error;
	}
}

/**
 * Busca carpetas con filtros avanzados.
 */
export async function findFolders(options: {
	search?: string;
	parentId?: string | null;
	isFavorite?: boolean;
	skip?: number;
	take?: number;
	orderBy?: 'name' | 'date' | 'size' | 'organization';
	order?: 'asc' | 'desc';
}): Promise<{ folders: FolderWithStats[]; total: number }> {
	try {
		logger.info('🔍 Buscando carpetas via API', { options });
		const searchParams = new URLSearchParams();
		for (const [key, value] of Object.entries(options)) {
			if (value !== undefined && value !== null) {
				searchParams.append(key, String(value));
			}
		}
		const url = searchParams.toString() ? `${API_BASE}?${searchParams}` : API_BASE;
		const response = await fetch(url);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return await response.json();
	} catch (error) {
		logger.error('❌ Error en API findFolders', { error, options });
		throw error;
	}
}

/**
 * Mueve una carpeta a un nuevo padre.
 */
export async function moveFolder(folderId: string, newParentId: string | null): Promise<FolderWithStats> {
	try {
		logger.info(`📁 Moviendo carpeta ${folderId} a padre ${newParentId} via API`);
		const response = await fetch(`${API_BASE}/${folderId}/move`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ newParentId }),
		});
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API moveFolder: ${folderId}`, { error, newParentId });
		throw error;
	}
}

/**
 * Alterna el estado de favorito de una carpeta.
 */
export async function toggleFolderFavorite(id: string): Promise<FolderWithStats> {
	try {
		logger.info(`⭐ Alternando favorito de carpeta ${id} via API`);
		const response = await fetch(`${API_BASE}/${id}/toggle-favorite`, { method: 'POST' });
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API toggleFolderFavorite: ${id}`, { error });
		throw error;
	}
}

/**
 * Reindexa una carpeta específica.
 */
export async function reindexFolder(folderId: string): Promise<FolderWithStats> {
	try {
		logger.info(`🔄 Reindexando carpeta ${folderId} via API`);
		const response = await fetch(`${API_BASE}/${folderId}/reindex`, { method: 'POST' });
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API reindexFolder: ${folderId}`, { error });
		throw error;
	}
}

/**
 * Reindexa todas las carpetas.
 */
export async function reindexAllFolders(): Promise<{ processed: number; errors: string[] }> {
	try {
		logger.info('🔄 Reindexando todas las carpetas via API');
		const response = await fetch(`${API_BASE}/reindex-all`, { method: 'POST' });
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return await response.json();
	} catch (error) {
		logger.error('❌ Error en API reindexAllFolders', { error });
		throw error;
	}
}

/**
 * Obtiene imágenes recientes de una carpeta.
 */
export async function getRecentFolderImages(folderId: string, limit: number = 4): Promise<string[]> {
	try {
		logger.info(`🖼️ Obteniendo imágenes recientes de carpeta ${folderId} via API`);
		const response = await fetch(`${API_BASE}/${folderId}/recent-images?limit=${limit}`);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API getRecentFolderImages: ${folderId}`, { error });
		throw error;
	}
}

/**
 * Obtiene estadísticas de una carpeta.
 */
export async function getFolderStats(folderId: string): Promise<{
	totalImages: number;
	totalVideos: number;
	totalSize: number;
	lastActivity: Date | null;
}> {
	try {
		logger.info(`📊 Obteniendo estadísticas de carpeta ${folderId} via API`);
		const response = await fetch(`${API_BASE}/${folderId}/stats`);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API getFolderStats: ${folderId}`, { error });
		throw error;
	}
}

/**
 * Obtiene el ID de la carpeta raíz.
 */
export async function getRootFolderId(): Promise<string> {
	try {
		logger.info('🌳 Obteniendo ID de carpeta raíz via API');
		const response = await fetch(`${API_BASE}/root`);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		const result = await response.json();
		return result.id;
	} catch (error) {
		logger.error('❌ Error en API getRootFolderId', { error });
		throw error;
	}
}

/**
 * Obtiene la ruta de una carpeta por su ID.
 */
export async function getFolderPath(folderId: string): Promise<string> {
	try {
		logger.info(`🗺️ Obteniendo ruta de carpeta ${folderId} via API`);
		const response = await fetch(`${API_BASE}/${folderId}/path`);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		const result = await response.json();
		return result.path;
	} catch (error) {
		logger.error(`❌ Error en API getFolderPath: ${folderId}`, { error });
		throw error;
	}
}

/**
 * Obtiene el nombre de una carpeta por su ID.
 */
export async function getFolderName(folderId: string): Promise<string> {
	try {
		logger.info(`🏷️ Obteniendo nombre de carpeta ${folderId} via API`);
		const response = await fetch(`${API_BASE}/${folderId}/name`);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		const result = await response.json();
		return result.name;
	} catch (error) {
		logger.error(`❌ Error en API getFolderName: ${folderId}`, { error });
		throw error;
	}
}

/**
 * Obtiene el ID de una carpeta por su ruta.
 */
export async function getFolderIdByPath(folderPath: string): Promise<string> {
	try {
		logger.info(`🆔 Obteniendo ID de carpeta por ruta ${folderPath} via API`);
		const response = await fetch(`${API_BASE}/by-path?path=${encodeURIComponent(folderPath)}`);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		const result = await response.json();
		return result.id;
	} catch (error) {
		logger.error(`❌ Error en API getFolderIdByPath: ${folderPath}`, { error });
		throw error;
	}
}

/**
 * Obtiene el ID de la carpeta padre.
 */
export async function getParentFolderId(folderId: string): Promise<string | null> {
	try {
		logger.info(`⬆️ Obteniendo ID de carpeta padre ${folderId} via API`);
		const response = await fetch(`${API_BASE}/${folderId}/parent-id`);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		const result = await response.json();
		return result.parentFolderId;
	} catch (error) {
		logger.error(`❌ Error en API getParentFolderId: ${folderId}`, { error });
		throw error;
	}
}

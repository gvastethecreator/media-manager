import type { FolderCreateInput, FolderFilters, FoldersResponse, FolderUpdateInput } from '@/lib/api/folders';
import type { FolderWithStats } from '@/types/entities/folder';
import { apiClient } from '../client';

// Helper: generar objeto stats mínimo (solo campos definidos en FolderStatistics)
const buildMinimalStats = (): FolderWithStats['stats'] => {
	const baseEntityStats = {
		imageCount: 0,
		videoCount: 0,
		albumCount: 0,
		collectionCount: 0,
		tagCount: 0,
		characterCount: 0,
		placeCount: 0,
		worldItemCount: 0,
		conceptCount: 0,
		promptCount: 0,
		noteCount: 0,
		wildcardCount: 0,
		propertyCount: 0,
		groupCount: 0,
		totalItems: 0,
		totalAssociations: 0,
		lastUpdated: new Date(),
		size: 0,
		mtime: new Date(),
		birthtime: new Date(),
		type: 'folder',
	};
	const folderSpecific = {
		hierarchyDepth: 0,
		totalDescendants: 0,
		directChildren: 0,
		contentDiversity: 0,
		organizationScore: 0,
		folderCount: 0,
		totalAudio: 0,
		totalOthers: 0,
		totalImages: 0,
		totalVideos: 0,
		totalDocuments: 0,
		totalFolders: 0,
		totalFiles: 0,
		documentCount: 0,
		totalRelations: 0,
		accessFrequency: 0,
		lastActivity: null,
		formattedSize: '0 B',
		totalSize: 0,
		averageFileSize: 0,
		largestFile: 0,
		hasConsistentNaming: false,
		hasDeepHierarchy: false,
		isWellOrganized: false,
		breadcrumbs: [],
		fullPath: '',
		relativePath: '',
		autoTags: [],
		qualityGrade: 'C' as const,
	};
	return { ...(baseEntityStats as any), ...folderSpecific } as FolderWithStats['stats'];
};

// Construye los campos base comunes (con fallbacks robustos)
const buildBaseFolder = (raw: any) => ({
	id: raw.id,
	name: raw.name || '',
	description: raw.description ?? null,
	path: raw.path || '',
	emoji: raw.emoji ?? null,
	color: raw.color ?? null,
	featuredImage: raw.featuredImage ?? null,
	isFavorite: Boolean(raw.isFavorite),
	// Si el backend no trae los agregados en top-level, tomar de stats cuando existan
	totalFiles: (raw.totalFiles ?? raw.stats?.totalFiles ?? raw._count?.images ?? 0) as number,
	totalSize: (raw.totalSize ?? raw.stats?.totalSize ?? 0) as number,
	autoReindex: raw.autoReindex ?? false,
	lastIndexed: raw.lastIndexed ?? null,
	parentId: raw.parentId ?? null,
	presetId: raw.presetId ?? null,
	createdAt: raw.createdAt || new Date().toISOString(),
	updatedAt: raw.updatedAt || new Date().toISOString(),
});

// Normaliza una carpeta cruda del backend (que puede no incluir stats) a FolderWithStats
const normalizeFolder = (raw: any): FolderWithStats => {
	if (!raw) {
		throw new Error('Folder no encontrada');
	}
	const base = buildBaseFolder(raw);
	const counts = raw._count || {
		images: raw.imagesCount ?? 0,
		videos: raw.videosCount ?? 0,
		children: raw.childrenCount ?? 0,
	};
	return {
		...base,
		entityType: 'folder',
		stats: raw.stats || buildMinimalStats(),
		type: 'folder',
		children: raw.children || [],
		recentImages: raw.recentImages || [],
		_count: counts,
	} as FolderWithStats;
};

export const findFolders = async (_filters: FolderFilters): Promise<FoldersResponse> => {
	const response = await apiClient.get<any>('/folders');
	// Backend actual retorna array simple; mantener compatibilidad si en el futuro retorna {data, pagination}
	let rawArray: any[] = [];
	if (Array.isArray(response)) {
		rawArray = response;
	} else if (response && Array.isArray(response.data)) {
		rawArray = response.data;
	}
	const normalized = rawArray.map(normalizeFolder);
	return {
		data: normalized,
		pagination: {
			total: normalized.length,
			limit: normalized.length,
			offset: 0,
			hasNext: false,
			hasPrev: false,
		},
	};
};

export const getAllFolders = async (): Promise<FolderWithStats[]> => {
	const response = await apiClient.get<FolderWithStats[]>('/folders/tree');
	return response;
};

export const getFolder = async (id: string): Promise<FolderWithStats> => {
	const response = await apiClient.get<any>(`/folders/${id}`);
	const raw = Array.isArray(response) ? response[0] : response;
	if (!raw) {
		throw new Error(`Folder with id "${id}" not found`);
	}
	return normalizeFolder(raw);
};

export const createFolder = async (data: FolderCreateInput): Promise<FolderWithStats> => {
	const response = await apiClient.post<FolderWithStats>('/folders', data);
	return response;
};

export const updateFolder = async (id: string, data: FolderUpdateInput): Promise<FolderWithStats> => {
	const response = await apiClient.put<FolderWithStats>(`/folders/${id}`, data);
	return response;
};

export const deleteFolder = async (id: string): Promise<void> => {
	await apiClient.delete(`/folders/${id}`);
};

export const moveFolder = async (folderId: string, newParentId: string | null): Promise<FolderWithStats> => {
	const response = await apiClient.post<FolderWithStats>(`/folders/${folderId}/move`, { newParentId });
	return response;
};

export const toggleFolderFavorite = async (id: string): Promise<FolderWithStats> => {
	const response = await apiClient.post<FolderWithStats>(`/folders/${id}/toggle-favorite`);
	return response;
};

export const reindexFolder = async (id: string): Promise<FolderWithStats> => {
	const response = await apiClient.post<FolderWithStats>(`/folders/${id}/reindex`);
	return response;
};

export const reindexAllFolders = async (): Promise<{ processed: number; errors: string[] }> => {
	const response = await apiClient.post<{ processed: number; errors: string[] }>('/folders/reindex-all');
	return response;
};

export const getRecentFolderImages = async (folderId: string, limit: number): Promise<string[]> => {
	const response = await apiClient.get<string[]>(`/folders/${folderId}/recent-images?limit=${limit}`);
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
	const response = await apiClient.get<{
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
	}>(`/folders/${folderId}/stats`);

	// Normalizar para asegurar thumbnailUrl presente aunque el backend envíe 'thumbnail'
	const normalized = {
		...response,
		recentImages: response.recentImages?.map((img: any) => ({
			id: img.id,
			name: img.name,
			// Preferir thumbnailUrl, fallback a thumbnail
			thumbnailUrl: img.thumbnailUrl ?? img.thumbnail ?? undefined,
		})),
	};
	return normalized;
};

export const getRootFolderId = async (): Promise<string> => {
	const response = await apiClient.get<{ id: string }>('/folders/root-id');
	return response.id;
};

export const getFolderPath = async (folderId: string): Promise<string> => {
	const response = await apiClient.get<{ path: string }>(`/folders/${folderId}/path`);
	return response.path;
};

export const getFolderName = async (folderId: string): Promise<string> => {
	const response = await apiClient.get<{ name: string }>(`/folders/${folderId}/name`);
	return response.name;
};

export const getFolderIdByPath = async (folderPath: string): Promise<string> => {
	const response = await apiClient.get<{ id: string }>(`/folders/by-path?path=${encodeURIComponent(folderPath)}`);
	return response.id;
};

export const getParentFolderId = async (folderId: string): Promise<string | null> => {
	const response = await apiClient.get<{ parentFolderId: string | null }>(`/folders/${folderId}/parent-id`);
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

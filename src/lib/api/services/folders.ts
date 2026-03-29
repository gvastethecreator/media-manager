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
	// Si el backend no trae los agregados en top-level, tomar de stats o _count.totalFiles cuando existan
	totalFiles: (raw.totalFiles ?? raw.stats?.totalFiles ?? raw._count?.totalFiles ?? raw._count?.images ?? 0) as number,
	totalSize: (raw.totalSize ?? raw.stats?.totalSize ?? 0) as number,
	lastIndexed: raw.lastIndexed ? new Date(raw.lastIndexed) : null,
	parentId: raw.parentId ?? null,
	presetId: raw.presetId ?? null,
	createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
	updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
});

// Normaliza una carpeta cruda del backend (que puede no incluir stats) a FolderWithStats
const normalizeFolder = (raw: any): FolderWithStats => {
	if (!raw) {
		throw new Error('Folder no encontrada');
	}
	const base = buildBaseFolder(raw);
	const counts = raw._count || {
		audios: raw.audiosCount ?? 0,
		children: raw.childrenCount ?? 0,
		documents: raw.documentsCount ?? 0,
		file3Ds: raw.file3DsCount ?? 0,
		images: raw.imagesCount ?? 0,
		jsonFiles: raw.jsonFilesCount ?? 0,
		totalFiles: raw.totalFiles ?? 0,
		videos: raw.videosCount ?? 0,
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

const getRecentFolderImagesFromFiles = async (
	folderId: string,
	limit: number
): Promise<
	Array<{
		id: string;
		name: string;
		thumbnailUrl: string;
	}>
> => {
	const response = await apiClient.get<{
		files?: Array<{
			id: string;
			name: string;
			thumbnailPath?: string;
			entityType?: string;
		}>;
	}>(
		`/folders/${encodeURIComponent(folderId)}/files?includeSubfolders=true&limit=${limit}&offset=0&sortBy=updatedAt&sortOrder=desc&fileTypes=image,video`
	);

	const files = Array.isArray(response?.files) ? response.files : [];

	return files
		.filter(
			(file): file is { id: string; name: string; thumbnailPath: string; entityType?: string } =>
				typeof file?.thumbnailPath === 'string' && file.thumbnailPath.length > 0
		)
		.map((file) => ({
			id: file.id,
			name: file.name,
			thumbnailUrl: file.thumbnailPath,
		}))
		.slice(0, limit);
};

export const findFolders = async (filters: FolderFilters): Promise<FoldersResponse> => {
	// Construir query parameters basado en los filtros
	const queryParams = new URLSearchParams();
	if (filters.parentId) {
		queryParams.append('parentId', filters.parentId);
	}
	if (filters.limit) {
		queryParams.append('limit', filters.limit.toString());
	}

	const queryString = queryParams.toString();
	const url = queryString ? `/folders?${queryString}` : '/folders';

	const response = await apiClient.get<any>(url);
	// Backend actual retorna array simple; mantener compatibilidad si en el futuro retorna {data, pagination}
	let rawArray: any[] = [];
	if (Array.isArray(response)) {
		rawArray = response;
	} else if (response && Array.isArray(response.data)) {
		rawArray = response.data;
	}
	const normalized = rawArray.map(normalizeFolder);
	const enriched = await Promise.all(
		normalized.map(async (folder) => {
			if (Array.isArray(folder.recentImages) && folder.recentImages.length > 0) {
				return folder;
			}

			try {
				const recentImages = await getRecentFolderImagesFromFiles(folder.id, 4);
				if (recentImages.length === 0) {
					return folder;
				}

				return {
					...folder,
					recentImages,
				};
			} catch {
				return folder;
			}
		})
	);
	return {
		data: enriched,
		pagination: {
			total: enriched.length,
			limit: enriched.length,
			offset: 0,
			hasNext: false,
			hasPrev: false,
		},
	};
};

export const getAllFolders = async (): Promise<FolderWithStats[]> => {
	const response = await apiClient.get<any>('/folders/tree');
	const rawArray = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
	return rawArray.map(normalizeFolder);
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

export const reindexFolder = async (
	id: string,
	options?: {
		useStructuredFlow?: boolean;
		skipThumbnails?: boolean;
		skipMetadata?: boolean;
	}
): Promise<FolderWithStats> => {
	const response = await apiClient.post<FolderWithStats>(`/folders/${id}/reindex`, options);
	return response;
};

export const reindexAllFolders = async (options?: {
	useStructuredFlow?: boolean;
	skipThumbnails?: boolean;
	skipMetadata?: boolean;
}): Promise<{ processed: number; errors: string[] }> => {
	const response = await apiClient.post<{ processed: number; errors: string[] }>('/folders/reindex-all', options);
	return response;
};

export const getRecentFolderImages = async (
	folderId: string,
	limit: number
): Promise<
	Array<{
		id: string;
		name: string;
		thumbnailUrl: string;
	}>
> => {
	return getRecentFolderImagesFromFiles(folderId, limit);
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
	const response = await apiClient.get<
		| {
				images?: number;
				videos?: number;
				audios?: number;
				documents?: number;
				jsonFiles?: number;
				file3Ds?: number;
				total?: number;
		  }
		| {
				totalImages: number;
				totalVideos: number;
				totalAudio: number;
				totalDocuments: number;
				totalOthers: number;
				totalSize: number;
				lastActivity: string | null;
				recentImages?: Array<{
					id: string;
					name: string;
					thumbnailUrl?: string;
				}>;
		  }
	>(`/folders/${folderId}/files/stats`);

	const legacy = response as {
		images?: number;
		videos?: number;
		audios?: number;
		documents?: number;
		jsonFiles?: number;
		file3Ds?: number;
		parseError?: boolean;
	};

	const normalized = {
		totalImages: (legacy.images ?? (response as any).totalImages ?? 0) as number,
		totalVideos: (legacy.videos ?? (response as any).totalVideos ?? 0) as number,
		totalAudio: (legacy.audios ?? (response as any).totalAudio ?? 0) as number,
		totalDocuments: (legacy.documents ?? (response as any).totalDocuments ?? 0) as number,
		totalOthers:
			((response as any).totalOthers as number | undefined) ?? (legacy.jsonFiles ?? 0) + (legacy.file3Ds ?? 0),
		totalSize: (response as any).totalSize ?? 0,
		lastActivity: (response as any).lastActivity ? new Date((response as any).lastActivity) : null,
		recentImages: (response as any).recentImages?.map((img: any) => ({
			id: img.id,
			name: img.name,
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

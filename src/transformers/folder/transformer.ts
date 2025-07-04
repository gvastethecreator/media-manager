/**
 * @file Transformador principal para la entidad Folder - Patrón EntityWithStats
 * @module transformers/folder/transformer
 * @description Contiene la lógica para transformar datos de Drizzle a tipos canónicos optimizados.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { formatFileSize } from '@/lib/utils/format.utils';
import { TransformerError } from '@/lib/utils/transformers/errors';
import type {
	FolderComplete,
	FolderExtended,
	FolderExtendedComplete,
	FolderStatistics,
	FolderWithStats,
} from '@/types/entities/folder';

const logger = serverLogger.withContext('FolderTransformer');

// Este archivo ya no necesita tipos de Prisma, ya que la migración a Drizzle está completa.
// Los tipos `FolderFromPrisma` y el payload `folderWithCountsPayload` se han eliminado.

/**
 * 🔄 Calcula estadísticas avanzadas para una carpeta
 */
function calculateFolderStatistics(folder: any, allFolders?: any[]): FolderStatistics {
	const { _count, path, name, totalFiles, totalSize, lastIndexed, parentId, children } = folder;

	// Calcular profundidad de jerarquía
	const hierarchyDepth = path.split('/').filter(Boolean).length;

	// Conteos básicos
	const imageCount = _count.images || 0;
	const videoCount = _count.videos || 0;
	const folderCount = _count.children || 0;
	const directChildren = folderCount;

	// Calcular total de items
	const totalItems = imageCount + videoCount + folderCount;

	// Calcular diversidad de contenido (0-100)
	const contentTypes = [imageCount > 0 ? 1 : 0, videoCount > 0 ? 1 : 0, folderCount > 0 ? 1 : 0].reduce(
		(sum, has) => sum + has,
		0
	);
	const contentDiversity = totalItems > 0 ? Math.min(100, (contentTypes / 3) * 100) : 0;

	// Calcular organization score (0-100)
	let organizationScore = 50; // Base score

	// Bonus por estructura
	if (hierarchyDepth <= 3 && hierarchyDepth >= 1) organizationScore += 20;
	if (folderCount > 0 && folderCount <= 10) organizationScore += 15;
	if (totalItems > 0 && totalItems <= 100) organizationScore += 10;

	// Bonus por naming consistency
	const hasConsistentNaming = name.length > 2 && !name.includes('untitled');
	if (hasConsistentNaming) organizationScore += 15;

	// Penalty por desorganización
	if (totalItems > 200) organizationScore -= 20;
	if (hierarchyDepth > 5) organizationScore -= 15;

	organizationScore = Math.max(0, Math.min(100, organizationScore));

	// Calcular métricas de tamaño
	const formattedSize = formatFileSize(totalSize || 0);
	const averageFileSize = totalFiles > 0 ? (totalSize || 0) / totalFiles : 0;
	const largestFile = totalSize || 0; // Simplificado por ahora

	// Análisis de jerarquía
	const hasDeepHierarchy = hierarchyDepth > 3;
	const isWellOrganized = organizationScore >= 70;

	// Generar breadcrumbs
	const pathParts = path.split('/').filter(Boolean);
	const breadcrumbs = pathParts.map((part, index) => ({
		id: `breadcrumb-${index}`,
		name: part,
		path: '/' + pathParts.slice(0, index + 1).join('/'),
	}));

	// Auto-tagging basado en características
	const autoTags: string[] = [];

	// Tags de jerarquía
	if (hierarchyDepth === 1) autoTags.push('root');
	if (hierarchyDepth > 4) autoTags.push('deep');
	if (folderCount === 0) autoTags.push('leaf');

	// Tags de contenido
	if (imageCount > videoCount && imageCount > 0) autoTags.push('images');
	if (videoCount > imageCount && videoCount > 0) autoTags.push('videos');
	if (imageCount > 0 && videoCount > 0) autoTags.push('multimedia');
	if (totalItems === 0) autoTags.push('empty');
	if (totalItems > 50) autoTags.push('large');
	if (totalItems > 200) autoTags.push('massive');

	// Tags de organización
	if (organizationScore >= 85) autoTags.push('well-organized');
	if (organizationScore >= 70) autoTags.push('organized');
	if (organizationScore < 50) autoTags.push('needs-organization');
	if (hasConsistentNaming) autoTags.push('consistent-naming');

	// Tags de tamaño
	if (totalSize && totalSize > 1024 * 1024 * 1024) autoTags.push('large-files'); // >1GB
	if (totalSize && totalSize > 10 * 1024 * 1024 * 1024) autoTags.push('huge-files'); // >10GB

	// Determinar grade de calidad
	let qualityGrade: 'A' | 'B' | 'C' | 'D';
	if (organizationScore >= 85) qualityGrade = 'A';
	else if (organizationScore >= 70) qualityGrade = 'B';
	else if (organizationScore >= 50) qualityGrade = 'C';
	else qualityGrade = 'D';

	// Calcular total de descendientes (simplificado)
	const totalDescendants = children?.length || 0;

	// Métricas de actividad
	const lastActivity = lastIndexed || folder.updatedAt;
	const accessFrequency = totalItems > 0 ? Math.min(100, totalItems / 10) : 0;

	// Total de relaciones
	const totalRelations = imageCount + videoCount + folderCount;

	return {
		// Métricas de jerarquía
		hierarchyDepth,
		totalDescendants,
		directChildren,

		// Métricas de contenido
		contentDiversity,
		organizationScore,
		totalItems,

		// Métricas de uso
		accessFrequency,
		lastActivity,

		// Distribución de contenido
		imageCount,
		videoCount,
		noteCount: 0,
		documentCount: 0,
		folderCount,

		// Métricas de tamaño
		formattedSize,
		averageFileSize,
		largestFile,

		// Análisis de nombres y organización
		hasConsistentNaming,
		hasDeepHierarchy,
		isWellOrganized,

		// Breadcrumbs y navegación
		breadcrumbs,
		fullPath: path,
		relativePath: path.startsWith('/') ? path.slice(1) : path,

		// Auto-tags generados
		autoTags,

		// Calidad general
		qualityGrade,

		// Relaciones
		totalRelations,
	};
}

/**
 * 🔄 Transforma un objeto Folder de Drizzle a FolderWithStats (FUNCIÓN PRINCIPAL)
 */
export function fromDrizzleFolderWithCounts(folderFromDrizzle: any | null, allFolders?: any[]): FolderWithStats | null {
	if (!folderFromDrizzle) return null;

	try {
		const { _count, children, parent, ...baseData } = folderFromDrizzle;

		const totalFiles = baseData.totalFiles > 0 ? baseData.totalFiles : _count.images || 0;
		const totalSize = baseData.totalSize > 0 ? baseData.totalSize : (_count.images || 0) * 2 * 1024 * 1024;

		const correctedFolderData = {
			...folderFromDrizzle,
			totalFiles,
			totalSize,
		};
		const statistics = calculateFolderStatistics(correctedFolderData, allFolders);

		return {
			...baseData,
			totalFiles,
			totalSize,
			statistics,
			_count: {
				children: _count.children || 0,
				images: _count.images || 0,
				videos: _count.videos || 0,
			},
		};
	} catch (error) {
		logger.error('Error transformando folder desde Drizzle:', {
			error,
			folderId: folderFromDrizzle.id,
		});
		throw new TransformerError(`Error al transformar la carpeta: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de carpetas de Drizzle a FolderWithStats[]
 */
export function fromDrizzleFoldersWithCounts(drizzleFolders: any[]): FolderWithStats[] {
	return drizzleFolders
		.map((folder) => fromDrizzleFolderWithCounts(folder, drizzleFolders))
		.filter((folder): folder is FolderWithStats => folder !== null);
}

/**
 * 🔄 Convierte un array de FolderWithStats a Record optimizado
 */
export function foldersToRecord(folders: FolderWithStats[]): Record<string, FolderWithStats> {
	return folders.reduce(
		(acc, folder) => {
			acc[folder.id] = folder;
			return acc;
		},
		{} as Record<string, FolderWithStats>
	);
}

/**
 * 🔍 Obtiene una carpeta por ID desde un Record (O(1))
 */
export function getFolderById(folders: Record<string, FolderWithStats>, id: string): FolderWithStats | undefined {
	return folders[id];
}

/**
 * 🔄 Convierte un Record de carpetas a array
 */
export function getAllFolders(folders: Record<string, FolderWithStats>): FolderWithStats[] {
	return Object.values(folders);
}

/**
 * 🌳 Construye un árbol jerárquico de carpetas
 */
export function buildFolderTree(folders: FolderWithStats[]): FolderWithStats[] {
	const folderMap = new Map<string, FolderWithStats & { children: FolderWithStats[] }>();

	// Crear mapa de carpetas con array de hijos
	folders.forEach((folder) => {
		folderMap.set(folder.id, { ...folder, children: [] });
	});

	const rootFolders: FolderWithStats[] = [];

	// Construir jerarquía
	folders.forEach((folder) => {
		if (folder.parentId && folderMap.has(folder.parentId)) {
			const parent = folderMap.get(folder.parentId)!;
			const child = folderMap.get(folder.id)!;
			parent.children.push(child);
		} else {
			// Carpeta raíz
			rootFolders.push(folderMap.get(folder.id)!);
		}
	});

	return rootFolders;
}

// --- FUNCIONES LEGACY PARA COMPATIBILIDAD ---

/**
 * 🔄 Transforma un objeto Folder de Drizzle a FolderComplete (LEGACY)
 */
export function fromDrizzleFolder(folderFromDrizzle: any | null): FolderComplete | null {
	if (!folderFromDrizzle) return null;

	try {
		const { _count, ...baseData } = folderFromDrizzle;

		return {
			...baseData,
			parent: baseData.parent ?? null,
			children: baseData.children ?? [],
			images: [],
			videos: [],
			_count: {
				children: _count?.children ?? 0,
				images: _count?.images ?? 0,
				videos: _count?.videos ?? 0,
			},
		};
	} catch (error) {
		logger.error('Error transformando folder desde Drizzle (legacy):', {
			error,
			folderId: folderFromDrizzle.id,
		});
		throw new TransformerError(`Error al transformar la carpeta: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de carpetas de Drizzle a FolderComplete[] (LEGACY)
 */
export function fromDrizzleFolders(drizzleFolders: any[]): FolderComplete[] {
	return drizzleFolders.map(fromDrizzleFolder).filter((folder): folder is FolderComplete => folder !== null);
}

/**
 * 🔄 Transforma FolderComplete a FolderExtended (LEGACY)
 */
export function transformFolderToExtended(folder: FolderComplete, level = 0): FolderExtended {
	const extendedFolder: FolderExtended = {
		...folder,
		isSelected: false,
		isOpen: false,
		isLoading: false,
		hasError: false,
		isDragging: false,
		isDropTarget: false,
		level,
	};

	if (folder.children && folder.children.length > 0) {
		(extendedFolder as FolderExtendedComplete).children = folder.children.map(
			(child) => transformFolderToExtended(child as FolderComplete, level + 1) as FolderExtendedComplete
		);
	}

	return extendedFolder;
}

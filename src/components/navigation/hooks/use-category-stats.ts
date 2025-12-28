import { useCallback, useMemo } from 'react';
import { useNavigationData, useNavigationStats } from '@/lib/api/navigation';
import type { CategoryChild, NavigationCategory } from '../types';

// Tipo que representa cualquier posible item de navegación
type NavItem = {
	id: string;
	name?: string;
	title?: string;
	emoji?: string;
	color?: string;
	path?: string;
	description?: string;
	totalFiles?: number;
	totalSize?: number;
	imageCount?: number;
	itemCount?: number; // Conteo total de elementos
	parentId?: string | null; // Para jerarquía de carpetas
	_count?: {
		images?: number;
		videos?: number;
		folders?: number;
		collections?: number;
		tags?: number;
	};
};

/**
 * Hook que proporciona funciones para calcular estadísticas de categorías
 * Migrado para usar API calls en lugar de datos mock
 */
export function useCategoryStats() {
	const { data: navigationData, isLoading: isLoadingNavigation, error: navError } = useNavigationData();
	const { data: statsData, isLoading: isLoadingStats, error: statsError } = useNavigationStats();

	if (navError) console.error('[useCategoryStats] Nav Error:', navError);
	if (statsError) console.error('[useCategoryStats] Stats Error:', statsError);

	const categoryDataMap = useMemo(() => {
		if (!navigationData) {
			return {};
		}

		return {
			folders: navigationData.folders || [],
			collections: navigationData.collections || [],
			tags: navigationData.tags || [],
			albums: navigationData.albums || [],
			characters: navigationData.characters || [],
			places: navigationData.places || [],
			worldItems: navigationData.worldItems || [],
			concepts: navigationData.concepts || [],
			prompts: navigationData.prompts || [],
			notes: navigationData.notes || [],
			groups: navigationData.groups || [],
			properties: navigationData.properties || [],
			wildcards: navigationData.wildcards || [],
			audios: navigationData.audios || [],
			documents: navigationData.documents || [],
			jsonFiles: navigationData.jsonFiles || [],
			file3ds: navigationData.file3ds || [],
			videos: navigationData.videos || [],
			workflows: navigationData.workflows || [],
		};
	}, [navigationData]);

	const getCategoryItemCount = useCallback(
		(categoryId: NavigationCategory): number => {
			const items = categoryDataMap[categoryId as keyof typeof categoryDataMap];
			return Array.isArray(items) ? items.length : 0;
		},
		[categoryDataMap]
	);

	const getImagesForCategory = useCallback(
		(categoryId: NavigationCategory): number => {
			const items = categoryDataMap[categoryId as keyof typeof categoryDataMap] as NavItem[] | undefined;
			if (!(items && Array.isArray(items))) {
				return 0;
			}

			return items.reduce((sum, item) => {
				const count = item._count?.images ?? item.imageCount ?? 0;
				return sum + (typeof count === 'number' ? count : 0);
			}, 0);
		},
		[categoryDataMap]
	);

	const getCategoryItems = useCallback(
		(categoryId: NavigationCategory): CategoryChild[] => {
			const items = categoryDataMap[categoryId as keyof typeof categoryDataMap] as NavItem[] | undefined;
			if (!(items && Array.isArray(items))) {
				return [];
			}

			return items.map(
				(item): CategoryChild => ({
					id: item.id || '',
					name: item.name || item.title || '',
					title: item.title,
					emoji: item.emoji,
					color: item.color,
					path: item.path,
					description: item.description,
					itemCount: item.itemCount || item.imageCount || (item._count?.images ?? 0) + (item._count?.videos ?? 0),
					totalFiles: item.totalFiles || 0,
					totalSize: item.totalSize || 0,
					parentId: item.parentId || null,
					_count: item._count
						? {
								images: item._count.images || 0,
								folders: item._count.folders,
								collections: item._count.collections,
								tags: item._count.tags,
							}
						: undefined,
				})
			);
		},
		[categoryDataMap]
	);

	// Totales derivados por si el backend no provee algunos contadores aún
	const derivedTotals = useMemo(() => {
		const totals = {
			totalImages: 0,
			totalVideos: 0,
			totalAudio: 0,
			totalDocuments: 0,
			totalJsonFiles: 0,
			totalFile3D: 0,
			totalWorkflows: 0,
		};
		const getLen = (k: keyof typeof categoryDataMap) => {
			const arr = categoryDataMap[k] as unknown[] | undefined;
			return Array.isArray(arr) ? arr.length : 0;
		};
		totals.totalImages = getLen('folders') > -1 ? 0 : 0; // images no viene en navigationData
		totals.totalVideos = getLen('videos');
		totals.totalAudio = getLen('audios');
		totals.totalDocuments = getLen('documents');
		totals.totalJsonFiles = getLen('jsonFiles');
		totals.totalFile3D = getLen('file3ds');
		totals.totalWorkflows = getLen('workflows');
		return totals;
	}, [categoryDataMap]);

	const stats = useMemo(
		() => ({
			totalImages: statsData?.totalImages || navigationData?.stats?.totalImages || 0,
			totalFolders: statsData?.totalFolders || navigationData?.stats?.totalFolders || 0,
			totalCollections: statsData?.totalCollections || navigationData?.stats?.totalCollections || 0,
			totalTags: statsData?.totalTags || navigationData?.stats?.totalTags || 0,
			totalAlbums: statsData?.totalAlbums || navigationData?.stats?.totalAlbums || 0,
			totalCharacters: statsData?.totalCharacters || navigationData?.stats?.totalCharacters || 0,
			totalPlaces: statsData?.totalPlaces || navigationData?.stats?.totalPlaces || 0,
			totalWorldItems: statsData?.totalWorldItems || navigationData?.stats?.totalWorldItems || 0,
			totalFavorites: statsData?.totalFavorites || navigationData?.stats?.totalFavorites || 0,
			totalActivities: statsData?.totalActivities || navigationData?.stats?.totalActivities || 0,
			totalSize: statsData?.totalSize || navigationData?.stats?.totalSize || 0,
			totalViews: statsData?.totalViews || navigationData?.stats?.totalViews || 0,
			totalDownloads: statsData?.totalDownloads || navigationData?.stats?.totalDownloads || 0,
			// Adicionales con fallback a derivados
			totalVideos: statsData?.totalVideos ?? navigationData?.stats?.totalVideos ?? derivedTotals.totalVideos,
			totalAudio: statsData?.totalAudio ?? navigationData?.stats?.totalAudio ?? derivedTotals.totalAudio,
			totalDocuments:
				statsData?.totalDocuments ?? navigationData?.stats?.totalDocuments ?? derivedTotals.totalDocuments,
			totalJsonFiles:
				statsData?.totalJsonFiles ?? navigationData?.stats?.totalJsonFiles ?? derivedTotals.totalJsonFiles,
			totalFile3D: statsData?.totalFile3D ?? navigationData?.stats?.totalFile3D ?? derivedTotals.totalFile3D,
			totalWorkflows:
				statsData?.totalWorkflows ?? navigationData?.stats?.totalWorkflows ?? derivedTotals.totalWorkflows,
		}),
		[statsData, navigationData, derivedTotals]
	);

	return {
		stats,
		getCategoryItemCount,
		getImagesForCategory,
		getCategoryItems,
		isLoading: isLoadingNavigation || isLoadingStats,
		isLoadingNavigation,
		isLoadingStats,
		navigationData,
		statsData,
	};
}

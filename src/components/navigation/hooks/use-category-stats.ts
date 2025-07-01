import type { NavigationData } from '@/components/navigation/actions/navigation.actions';
import { useCallback, useMemo } from 'react';
import type { CategoryChild, NavigationCategory } from '../types';

type AnyNavItem = NonNullable<NavigationData[keyof Omit<NavigationData, 'stats'>]>[number];

// Tipo que representa cualquier posible item de navegación
type NavItem = AnyNavItem & {
	title?: string;
};

/**
 * Hook que proporciona funciones para calcular estadísticas de categorías
 * @param initialData Datos iniciales de navegación
 */
export function useCategoryStats(initialData: NavigationData) {
	const data = initialData || {};

	const categoryDataMap = useMemo(
		() => ({
			folders: data.folders || [],
			collections: data.collections || [],
			tags: data.tags || [],
			albums: data.albums || [],
			characters: data.characters || [],
			places: data.places || [],
			worldItems: data.worldItems || [],
			concepts: data.concepts || [],
			prompts: data.prompts || [],
			notes: data.notes || [],
			groups: data.groups || [],
			properties: data.properties || [],
			wildcards: data.wildcards || [],
			audios: data.audios || [],
			documents: data.documents || [],
			jsonFiles: data.jsonFiles || [],
			file3ds: data.file3ds || [],
			workflows: data.workflows || [],
		}),
		[data]
	);

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
			if (!items || !Array.isArray(items)) return 0;

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
			if (!items || !Array.isArray(items)) return [];

			return items.map(
				(item): CategoryChild => ({
					id: item.id || '',
					name: item.name || item.title || '',
					title: item.title,
					emoji: 'emoji' in item ? item.emoji : undefined,
					color: 'color' in item ? item.color : undefined,
					path: 'path' in item ? item.path : undefined,
					description: 'description' in item ? item.description : undefined,
					totalFiles: 'totalFiles' in item ? item.totalFiles : 0,
					totalSize: 'totalSize' in item ? item.totalSize : 0,
					_count:
						'_count' in item && typeof item._count === 'object' && item._count !== null
							? {
									images: 'images' in item._count ? item._count.images : 0,
									folders: 'folders' in item._count ? item._count.folders : undefined,
									collections: 'collections' in item._count ? item._count.collections : undefined,
									tags: 'tags' in item._count ? item._count.tags : undefined,
								}
							: undefined,
				})
			);
		},
		[categoryDataMap]
	);

	const stats = useMemo(
		() => ({
			totalImages: data.stats?.totalImages || 0,
		}),
		[data.stats]
	);

	return { stats, getCategoryItemCount, getImagesForCategory, getCategoryItems };
}

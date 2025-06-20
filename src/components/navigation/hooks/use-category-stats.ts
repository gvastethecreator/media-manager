import type { NavigationData } from '@/components/navigation/actions/navigation.actions';
import { useCallback } from 'react';
import type { CategoryChild, NavigationCategory } from '../types';

/**
 * Hook que proporciona funciones para calcular estadísticas de categorías
 * @param initialData Datos iniciales de navegación
 */
export function useCategoryStats(initialData: NavigationData) {
	const {
		stats = {
			totalImages: 0,
			totalFolders: 0,
			totalCollections: 0,
			totalTags: 0,
			totalAlbums: 0,
			totalCharacters: 0,
			totalPlaces: 0,
			totalObjects: 0,
			totalGroups: 0,
			totalProperties: 0,
			totalWildcards: 0,
			totalViews: 0,
			totalDownloads: 0,
			totalFavorites: 0,
			totalActivities: 0,
			totalSize: 0,
			// Nuevas entidades
			totalAudios: 0,
			totalDocuments: 0,
			totalJsonFiles: 0,
			totalFile3Ds: 0,
			totalWorkflows: 0,
			popularImages: [],
			topTags: [],
			recentActivity: [],
		},
		folders = [],
		collections = [],
		tags = [],
		albums = [],
		characters = [],
		places = [],
		worldItems = [],
		concepts = [],
		prompts = [],
		notes = [],
		groups = [],
		properties = [],
		wildcards = [],
		// Nuevas entidades
		audios = [],
		documents = [],
		jsonFiles = [],
		file3ds = [],
		workflows = [],
	} = initialData || {};

	/**
	 * 🗂️ Función auxiliar para obtener array de items de manera segura
	 * @param items Array de items, resultado de búsqueda o cualquier estructura de datos
	 * @returns Array de items normalizado
	 */
	const getSafeItemsArray = useCallback((items: any): any[] => {
		// 📝 Si ya es un array, devolverlo
		if (Array.isArray(items)) {
			return items;
		}
		// 🔍 Si es un resultado de búsqueda con propiedad `items` (CharacterSearchResult, ConceptSearchResult, etc.)
		if (items && typeof items === 'object') {
			if (Array.isArray(items.items)) {
				return items.items;
			}
			if (Array.isArray(items.data)) {
				return items.data;
			}
		}
		return [];
	}, []);

	/**
	 * 🔢 Función auxiliar para obtener la longitud de arrays de manera segura
	 * @param items Array de items, resultado de búsqueda o cualquier estructura de datos
	 * @returns Número de items
	 */
	const getSafeArrayLength = useCallback((items: any): number => {
		// 📝 Si es un array, devolver su longitud
		if (Array.isArray(items)) {
			return items.length;
		}
		// 🔍 Si es un resultado de búsqueda con propiedades específicas
		if (items && typeof items === 'object') {
			// Para CharacterSearchResult, ConceptSearchResult, etc.
			if (Array.isArray(items.items)) {
				return items.items.length;
			}
			// Para otros tipos de resultados de búsqueda
			if (Array.isArray(items.data)) {
				return items.data.length;
			}
			// Si tiene un total directo
			if (typeof items.total === 'number') {
				return items.total;
			}
		}
		return 0;
	}, []);

	/**
	 * 🔢 Función auxiliar para calcular el total de imágenes de manera segura
	 * @param items Array de items o resultado de búsqueda
	 * @returns Número total de imágenes
	 */
	const calculateTotalImages = useCallback(
		(items: any): number => {
			const itemsArray = getSafeItemsArray(items);

			return itemsArray.reduce((sum: number, item: any) => {
				// 🛡️ Manejo seguro de diferentes estructuras de _count
				if (item?._count?.images) {
					return sum + item._count.images;
				}
				// 📊 Alternativa para items con imageCount directo
				if (typeof item?.imageCount === 'number') {
					return sum + item.imageCount;
				}
				return sum;
			}, 0);
		},
		[getSafeItemsArray]
	);

	/**
	 * 🗂️ Función auxiliar para mapear items de navegación a CategoryChild de manera segura
	 * @param items Array de items del tipo de navegación
	 * @returns Array de CategoryChild mapeados de manera segura
	 */
	const mapToCategoryChildren = useCallback(
		(items: any): CategoryChild[] => {
			const itemsArray = getSafeItemsArray(items);

			return itemsArray.map(
				(item): CategoryChild => ({
					id: item.id || '',
					name: item.name || item.title || '', // 📝 Soporte para notas que usan 'title'
					title: item.title,
					emoji: item.emoji,
					color: item.color,
					path: item.path,
					description: item.description,
					totalFiles: item.totalFiles || 0,
					totalSize: item.totalSize || 0,
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
		[getSafeItemsArray]
	);

	// 🔢 Función auxiliar para obtener la cantidad de ítems para cada categoría
	const getCategoryItemCount = useCallback(
		(categoryId: NavigationCategory): number => {
			switch (categoryId) {
				case 'collections':
					return stats?.totalCollections || getSafeArrayLength(collections) || 0;
				case 'folders':
					return stats?.totalFolders || getSafeArrayLength(folders) || 0;
				case 'tags':
					return stats?.totalTags || getSafeArrayLength(tags) || 0;
				case 'albums':
					return stats?.totalAlbums || getSafeArrayLength(albums) || 0;
				case 'characters':
					return stats?.totalCharacters || getSafeArrayLength(characters) || 0;
				case 'places':
					return stats?.totalPlaces || getSafeArrayLength(places) || 0;
				case 'world-items':
					return stats?.totalObjects || getSafeArrayLength(worldItems) || 0;
				case 'concepts':
					return getSafeArrayLength(concepts) || 0;
				case 'prompts':
					return getSafeArrayLength(prompts) || 0;
				case 'notes':
					return getSafeArrayLength(notes) || 0;
				case 'groups':
					return stats?.totalGroups || getSafeArrayLength(groups) || 0;
				case 'properties':
					return stats?.totalProperties || getSafeArrayLength(properties) || 0;
				case 'wildcards':
					return stats?.totalWildcards || getSafeArrayLength(wildcards) || 0;
				// Nuevas entidades
				case 'audios':
					return stats?.totalAudios || getSafeArrayLength(audios) || 0;
				case 'documents':
					return stats?.totalDocuments || getSafeArrayLength(documents) || 0;
				case 'json-files':
					return stats?.totalJsonFiles || getSafeArrayLength(jsonFiles) || 0;
				case 'file-3d':
					return stats?.totalFile3Ds || getSafeArrayLength(file3ds) || 0;
				case 'workflows':
					return stats?.totalWorkflows || getSafeArrayLength(workflows) || 0;
				default:
					return 0;
			}
		},
		[
			getSafeArrayLength,
			albums,
			characters,
			collections,
			concepts,
			folders,
			notes,
			places,
			prompts,
			stats,
			tags,
			worldItems,
			groups,
			properties,
			wildcards,
			// Nuevas entidades
			audios,
			documents,
			jsonFiles,
			file3ds,
			workflows,
		]
	);

	// 📊 Calcula y devuelve el número de imágenes para una categoría
	const getImagesForCategory = useCallback(
		(categoryId: NavigationCategory): number => {
			switch (categoryId) {
				case 'collections':
					return calculateTotalImages(collections);
				case 'folders':
					return calculateTotalImages(folders);
				case 'tags':
					return calculateTotalImages(tags);
				case 'albums':
					return calculateTotalImages(albums);
				case 'characters':
					return calculateTotalImages(characters);
				case 'places':
					return calculateTotalImages(places);
				case 'world-items':
					return calculateTotalImages(worldItems);
				case 'concepts':
					return calculateTotalImages(concepts);
				case 'prompts':
					return calculateTotalImages(prompts);
				case 'notes':
					return calculateTotalImages(notes);
				case 'groups':
					return calculateTotalImages(groups);
				case 'properties':
					return calculateTotalImages(properties);
				case 'wildcards':
					return calculateTotalImages(wildcards);
				// Nuevas entidades
				case 'audios':
					return calculateTotalImages(audios);
				case 'documents':
					return calculateTotalImages(documents);
				case 'json-files':
					return calculateTotalImages(jsonFiles);
				case 'file-3d':
					return calculateTotalImages(file3ds);
				case 'workflows':
					return calculateTotalImages(workflows);
				default:
					return 0;
			}
		},
		[
			calculateTotalImages,
			albums,
			characters,
			collections,
			concepts,
			folders,
			notes,
			places,
			prompts,
			tags,
			worldItems,
			groups,
			properties,
			wildcards,
			// Nuevas entidades
			audios,
			documents,
			jsonFiles,
			file3ds,
			workflows,
		]
	);

	// 🏷️ Función para obtener los elementos hijos de cada categoría con mapeo seguro de tipos
	const getCategoryItems = useCallback(
		(categoryId: NavigationCategory): CategoryChild[] => {
			switch (categoryId) {
				case 'collections':
					return mapToCategoryChildren(collections);
				case 'folders':
					return mapToCategoryChildren(folders.slice(0, 500));
				case 'tags':
					return mapToCategoryChildren(tags);
				case 'albums':
					return mapToCategoryChildren(albums);
				case 'characters':
					return mapToCategoryChildren(characters);
				case 'places':
					return mapToCategoryChildren(places);
				case 'world-items':
					return mapToCategoryChildren(worldItems);
				case 'concepts':
					return mapToCategoryChildren(concepts);
				case 'prompts':
					return mapToCategoryChildren(prompts);
				case 'notes':
					return mapToCategoryChildren(notes);
				case 'groups':
					return mapToCategoryChildren(groups);
				case 'properties':
					return mapToCategoryChildren(properties);
				case 'wildcards':
					return mapToCategoryChildren(wildcards);
				// Nuevas entidades
				case 'audios':
					return mapToCategoryChildren(audios);
				case 'documents':
					return mapToCategoryChildren(documents);
				case 'json-files':
					return mapToCategoryChildren(jsonFiles);
				case 'file-3d':
					return mapToCategoryChildren(file3ds);
				case 'workflows':
					return mapToCategoryChildren(workflows);
				default:
					return [];
			}
		},
		[
			mapToCategoryChildren,
			albums,
			characters,
			collections,
			concepts,
			folders,
			notes,
			places,
			prompts,
			tags,
			worldItems,
			groups,
			properties,
			wildcards,
			// Nuevas entidades
			audios,
			documents,
			jsonFiles,
			file3ds,
			workflows,
		]
	);

	return {
		getCategoryItemCount,
		getImagesForCategory,
		getCategoryItems,
		stats,
	};
}

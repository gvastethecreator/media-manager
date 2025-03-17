import type { NavigationData } from '@/components/navigation/actions/navigation.actions';
import type { ViewType } from '@/types/file-item';
import { useCallback } from 'react';
import type { CategoryChild } from '../types';

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
			totalViews: 0,
			totalDownloads: 0,
			totalFavorites: 0,
			totalActivities: 0,
			totalSize: 0,
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
	} = initialData || {};

	// Función auxiliar para obtener la cantidad de ítems para cada categoría
	const getCategoryItemCount = useCallback(
		(categoryId: ViewType): number => {
			switch (categoryId) {
				case 'collections':
					return stats?.totalCollections || collections.length || 0;
				case 'folders':
					return stats?.totalFolders || folders.length || 0;
				case 'tags':
					return stats?.totalTags || tags.length || 0;
				case 'albums':
					return stats?.totalAlbums || albums.length || 0;
				case 'characters':
					return stats?.totalCharacters || characters.length || 0;
				case 'places':
					return stats?.totalPlaces || places.length || 0;
				case 'world-items':
					return stats?.totalObjects || worldItems.length || 0;
				case 'concepts':
					return concepts.length || 0;
				case 'prompts':
					return prompts.length || 0;
				case 'notes':
					return notes.length || 0;
				default:
					return 0;
			}
		},
		[albums, characters, collections, concepts, folders, notes, places, prompts, stats, tags, worldItems]
	);

	// Calcula y devuelve el número de imágenes para una categoría
	const getImagesForCategory = useCallback(
		(categoryId: ViewType): number => {
			switch (categoryId) {
				case 'collections':
					return collections.reduce(
						(sum: number, collection: { _count?: { images: number } }) => sum + (collection._count?.images || 0),
						0
					);
				case 'folders':
					return folders.reduce(
						(sum: number, folder: { _count?: { images: number } }) => sum + (folder._count?.images || 0),
						0
					);
				case 'tags':
					return tags.reduce((sum: number, tag: { _count?: { images: number } }) => sum + (tag._count?.images || 0), 0);
				case 'albums':
					return albums.reduce(
						(sum: number, album: { _count?: { images: number } }) => sum + (album._count?.images || 0),
						0
					);
				case 'characters':
					return characters.reduce(
						(sum: number, character: { _count?: { images: number } }) => sum + (character._count?.images || 0),
						0
					);
				case 'places':
					return places.reduce(
						(sum: number, place: { _count?: { images: number } }) => sum + (place._count?.images || 0),
						0
					);
				case 'world-items':
					return worldItems.reduce(
						(sum: number, worldItem: { _count?: { images: number } }) => sum + (worldItem._count?.images || 0),
						0
					);
				case 'concepts':
					return concepts.reduce(
						(sum: number, concept: { _count?: { images: number } }) => sum + (concept._count?.images || 0),
						0
					);
				case 'prompts':
					return prompts.reduce(
						(sum: number, prompt: { _count?: { images: number } }) => sum + (prompt._count?.images || 0),
						0
					);
				case 'notes':
					return notes.reduce(
						(sum: number, note: { _count?: { images: number } }) => sum + (note._count?.images || 0),
						0
					);
				default:
					return 0;
			}
		},
		[albums, characters, collections, concepts, folders, notes, places, prompts, tags, worldItems]
	);

	// Función para obtener los elementos hijos de cada categoría con corrección de tipos
	const getCategoryItems = useCallback(
		(categoryId: ViewType) => {
			switch (categoryId) {
				case 'collections':
					return collections as unknown as CategoryChild[];
				case 'folders':
					return folders as unknown as CategoryChild[];
				case 'tags':
					return tags as unknown as CategoryChild[];
				case 'albums':
					return albums as unknown as CategoryChild[];
				case 'characters':
					return characters as unknown as CategoryChild[];
				case 'places':
					return places as unknown as CategoryChild[];
				case 'world-items':
					return worldItems as unknown as CategoryChild[];
				case 'concepts':
					return concepts as unknown as CategoryChild[];
				case 'prompts':
					return prompts as unknown as CategoryChild[];
				case 'notes':
					return notes as unknown as CategoryChild[];
				default:
					return [] as CategoryChild[];
			}
		},
		[albums, characters, collections, concepts, folders, notes, places, prompts, tags, worldItems]
	);

	return {
		getCategoryItemCount,
		getImagesForCategory,
		getCategoryItems,
		stats,
	};
}

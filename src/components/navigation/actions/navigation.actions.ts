'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { revalidatePath } from 'next/cache';
import { getAlbums } from '@/app/actions/albums/album.actions';
import { getCharacters } from '@/app/actions/characters/character.actions';
import { getCollections } from '@/app/actions/collections/collection.actions';
import { getConcepts } from '@/app/actions/concepts/concept.actions';
import { getFolders } from '@/app/actions/folders/';
import { getNotes } from '@/app/actions/notes/note.actions';
import { getPlaces } from '@/app/actions/places/place.actions';
import { getPrompts } from '@/app/actions/prompts/prompt.actions';
import { getSystemStats } from '@/app/actions/stats/stats.actions';
import { getTags } from '@/app/actions/tags/tag.actions';
import { getWorldItems } from '@/app/actions/world-items/world-item.actions';

const navLogger = serverLogger.withContext('NavActions');

type SystemStats = {
	totalImages: number;
	totalFolders: number;
	totalCollections: number;
	totalTags: number;
	totalAlbums: number;
	totalCharacters: number;
	totalPlaces: number;
	totalObjects: number;
	totalFavorites: number;
	totalActivities: number;
	totalSize: number;
	totalViews: number;
	totalDownloads: number;
	topTags: Array<{
		id: string;
		name: string;
		color: string;
		count: number;
	}>;
	recentActivity: Array<{
		id: string;
		type: string;
		description: string;
		createdAt: Date;
		image: {
			id: string;
			name: string;
			thumbnail: Uint8Array | null;
		} | null;
	}>;
};

const REVALIDATE_PATHS = [
	'/',
	'/settings',
	'/albums',
	'/collections',
	'/tags',
	'/folders',
	'/characters',
	'/places',
	'/world-items',
] as const;

export async function revalidateNavigation() {
	try {
		navLogger.info('🔄 Iniciando revalidación de rutas de navegación');

		await Promise.all(
			REVALIDATE_PATHS.map(async (path) => {
				revalidatePath(path);
			})
		);

		navLogger.info('✅ Rutas de navegación revalidadas exitosamente');
	} catch (error) {
		navLogger.error('❌ Error al revalidar rutas de navegación:', error);
		throw new Error('No se pudieron revalidar las rutas de navegación');
	}
}

export interface NavigationData {
	folders: Awaited<ReturnType<typeof getFolders>>;
	collections: Awaited<ReturnType<typeof getCollections>>;
	tags: Awaited<ReturnType<typeof getTags>>;
	albums: Awaited<ReturnType<typeof getAlbums>>;
	characters: Awaited<ReturnType<typeof getCharacters>>;
	places: Awaited<ReturnType<typeof getPlaces>>;
	worldItems: Awaited<ReturnType<typeof getWorldItems>>;
	concepts: Awaited<ReturnType<typeof getConcepts>>;
	prompts: Awaited<ReturnType<typeof getPrompts>>;
	notes: Awaited<ReturnType<typeof getNotes>>;
	stats: SystemStats;
}

export async function getNavigationData(): Promise<NavigationData> {
	try {
		navLogger.info('🧭 Obteniendo datos de navegación');

		const [folders, collections, tags, albums, characters, places, worldItems, concepts, prompts, notes, stats] =
			await Promise.allSettled([
				getFolders(),
				getCollections(),
				getTags(),
				getAlbums(),
				getCharacters(),
				getPlaces(),
				getWorldItems(),
				getConcepts(),
				getPrompts(),
				getNotes(),
				getSystemStats(),
			]);

		navLogger.info('✅ Datos de navegación obtenidos exitosamente');

		const defaultStats: SystemStats = {
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
			topTags: [],
			recentActivity: [],
		};

		return {
			folders: folders.status === 'fulfilled' ? folders.value : [],
			collections: collections.status === 'fulfilled' ? collections.value : [],
			tags: tags.status === 'fulfilled' ? tags.value : [],
			albums: albums.status === 'fulfilled' ? albums.value : [],
			characters: characters.status === 'fulfilled' ? characters.value : [],
			places: places.status === 'fulfilled' ? places.value : [],
			worldItems: worldItems.status === 'fulfilled' ? worldItems.value : [],
			concepts: concepts.status === 'fulfilled' ? concepts.value : [],
			prompts: prompts.status === 'fulfilled' ? prompts.value : [],
			notes: notes.status === 'fulfilled' ? notes.value : [],
			stats:
				stats.status === 'fulfilled' && stats.value
					? {
							totalImages: stats.value.totalImages,
							totalFolders: stats.value.totalFolders,
							totalCollections: stats.value.totalCollections,
							totalTags: stats.value.totalTags,
							totalAlbums: stats.value.totalAlbums,
							totalCharacters: stats.value.totalCharacters,
							totalPlaces: stats.value.totalPlaces,
							totalObjects: stats.value.totalWorldItems,
							totalFavorites: stats.value.totalFavorites,
							totalActivities: stats.value.totalActivities,
							totalSize: stats.value.totalSize,
							totalViews: stats.value.totalViews,
							totalDownloads: stats.value.totalDownloads,
							topTags: stats.value.topTags,
							recentActivity: stats.value.recentActivity,
						}
					: defaultStats,
		};
	} catch (error) {
		navLogger.error('❌ Error obteniendo datos de navegación:', error);
		throw new Error('No se pudieron obtener los datos de navegación');
	}
}

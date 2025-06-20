'use server';

import { getAlbums } from '@/app/actions/albums/album.actions';
import { getAudios } from '@/app/actions/audio/audio.actions';
import { searchCharacters } from '@/app/actions/characters/character.actions';
import { getCollections } from '@/app/actions/collections/collection.actions';
import { getConcepts } from '@/app/actions/concepts/concept.actions';
import { getDocuments } from '@/app/actions/document/document.actions';
import { getFile3Ds } from '@/app/actions/file3d/file-3d.actions';
import { getFolders } from '@/app/actions/folders/';
import { getGroups } from '@/app/actions/groups/group.actions';
import { getJsonFiles } from '@/app/actions/json-file/json-file.actions';
import { getNotes } from '@/app/actions/notes/note.actions';
import { getPlaces } from '@/app/actions/places/place.actions';
import { getPrompts } from '@/app/actions/prompts/prompt.actions';
import { getProperties } from '@/app/actions/properties/property.actions';
import { getSystemStats } from '@/app/actions/stats/stats.actions';
import { getTagsAction } from '@/app/actions/tags';
import { getWildcards } from '@/app/actions/wildcards/wildcard.actions';
import { getWorkflows } from '@/app/actions/workflow/workflow.actions';
import { getWorldItems } from '@/app/actions/world-items/world-item.actions';
import { serverLogger } from '@/lib/logger/server-logger';
import { revalidatePath } from 'next/cache';

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
	totalGroups: number;
	totalProperties: number;
	totalWildcards: number;
	totalFavorites: number;
	totalActivities: number;
	totalSize: number;
	totalViews: number;
	totalDownloads: number;
	// Nuevas entidades
	totalAudios: number;
	totalDocuments: number;
	totalJsonFiles: number;
	totalFile3Ds: number;
	totalWorkflows: number;
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
	'/groups',
	'/properties',
	'/wildcards',
	'/audio',
	'/documents',
	'/json-files',
	'/file-3d',
	'/workflows',
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
	tags: Awaited<ReturnType<typeof getTagsAction>>;
	albums: Awaited<ReturnType<typeof getAlbums>>;
	characters: Awaited<ReturnType<typeof searchCharacters>>;
	places: Awaited<ReturnType<typeof getPlaces>>;
	worldItems: Awaited<ReturnType<typeof getWorldItems>>;
	concepts: Awaited<ReturnType<typeof getConcepts>>;
	prompts: Awaited<ReturnType<typeof getPrompts>>;
	notes: Awaited<ReturnType<typeof getNotes>>;
	groups: Awaited<ReturnType<typeof getGroups>>;
	properties: Awaited<ReturnType<typeof getProperties>>;
	wildcards: Awaited<ReturnType<typeof getWildcards>>;
	// Nuevas entidades
	audios: Awaited<ReturnType<typeof getAudios>>;
	documents: Awaited<ReturnType<typeof getDocuments>>;
	jsonFiles: Awaited<ReturnType<typeof getJsonFiles>>;
	file3ds: Awaited<ReturnType<typeof getFile3Ds>>;
	workflows: Awaited<ReturnType<typeof getWorkflows>>;
	stats: SystemStats;
}

export async function getNavigationData(): Promise<NavigationData> {
	try {
		navLogger.info('🧭 Obteniendo datos de navegación');

		const [
			folders,
			collections,
			tags,
			albums,
			characters,
			places,
			worldItems,
			concepts,
			prompts,
			notes,
			groups,
			properties,
			wildcards,
			audios,
			documents,
			jsonFiles,
			file3ds,
			workflows,
			stats,
		] = await Promise.allSettled([
			getFolders(),
			getCollections(),
			getTagsAction(),
			getAlbums(),
			searchCharacters({}),
			getPlaces(),
			getWorldItems(),
			getConcepts(),
			getPrompts(),
			getNotes(),
			getGroups(),
			getProperties(),
			getWildcards(),
			getAudios(),
			getDocuments(),
			getJsonFiles(),
			getFile3Ds(),
			getWorkflows(),
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
			totalGroups: 0,
			totalProperties: 0,
			totalWildcards: 0,
			totalViews: 0,
			totalDownloads: 0,
			// Nuevas entidades
			totalAudios: 0,
			totalDocuments: 0,
			totalJsonFiles: 0,
			totalFile3Ds: 0,
			totalWorkflows: 0,
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
			groups: groups.status === 'fulfilled' ? groups.value : [],
			properties: properties.status === 'fulfilled' ? properties.value : [],
			wildcards: wildcards.status === 'fulfilled' ? wildcards.value : [],
			// Nuevas entidades
			audios: audios.status === 'fulfilled' ? audios.value : [],
			documents: documents.status === 'fulfilled' ? documents.value : [],
			jsonFiles: jsonFiles.status === 'fulfilled' ? jsonFiles.value : [],
			file3ds: file3ds.status === 'fulfilled' ? file3ds.value : [],
			workflows: workflows.status === 'fulfilled' ? workflows.value : [],
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
							totalGroups: stats.value.totalGroups || 0,
							totalProperties: stats.value.totalProperties || 0,
							totalWildcards: stats.value.totalWildcards || 0,
							totalFavorites: stats.value.totalFavorites,
							totalActivities: stats.value.totalActivities,
							totalSize: stats.value.totalSize,
							totalViews: stats.value.totalViews,
							totalDownloads: stats.value.totalDownloads,
							// Nuevas entidades - usar longitud de arrays como fallback
							totalAudios: stats.value.totalAudios || (audios.status === 'fulfilled' ? audios.value.length : 0),
							totalDocuments:
								stats.value.totalDocuments || (documents.status === 'fulfilled' ? documents.value.length : 0),
							totalJsonFiles:
								stats.value.totalJsonFiles || (jsonFiles.status === 'fulfilled' ? jsonFiles.value.length : 0),
							totalFile3Ds: stats.value.totalFile3Ds || (file3ds.status === 'fulfilled' ? file3ds.value.length : 0),
							totalWorkflows:
								stats.value.totalWorkflows || (workflows.status === 'fulfilled' ? workflows.value.length : 0),
							topTags: stats.value.topTags,
							recentActivity: stats.value.recentActivity,
						}
					: defaultStats,
		};
	} catch (error) {
		navLogger.error('❌ Error al obtener datos de navegación:', error);
		throw new Error('No se pudieron obtener los datos de navegación');
	}
}

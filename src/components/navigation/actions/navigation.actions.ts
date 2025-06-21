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

type SystemStats = NonNullable<Awaited<ReturnType<typeof getSystemStats>>>;

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
		for (const path of REVALIDATE_PATHS) {
			revalidatePath(path);
		}
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
	audios: Awaited<ReturnType<typeof getAudios>>;
	documents: Awaited<ReturnType<typeof getDocuments>>;
	jsonFiles: Awaited<ReturnType<typeof getJsonFiles>>;
	file3ds: Awaited<ReturnType<typeof getFile3Ds>>;
	workflows: Awaited<ReturnType<typeof getWorkflows>>;
	stats: SystemStats;
}

function processSettledResult<T>(result: PromiseSettledResult<T>, defaultValue: T): T {
	return result.status === 'fulfilled' ? result.value : defaultValue;
}

export async function getNavigationData(): Promise<NavigationData> {
	try {
		navLogger.info('🧭 Obteniendo datos de navegación');

		const results = await Promise.allSettled([
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
			totalWorldItems: 0,
			totalGroups: 0,
			totalProperties: 0,
			totalWildcards: 0,
			totalFavorites: 0,
			totalActivities: 0,
			totalSize: 0,
			totalViews: 0,
			totalDownloads: 0,
			totalAudios: 0,
			totalDocuments: 0,
			totalJsonFiles: 0,
			totalFile3Ds: 0,
			totalWorkflows: 0,
			topTags: [],
			recentActivity: [],
		};

		return {
			folders: processSettledResult(results[0], []),
			collections: processSettledResult(results[1], []),
			tags: processSettledResult(results[2], []),
			albums: processSettledResult(results[3], []),
			characters: processSettledResult(results[4], []),
			places: processSettledResult(results[5], []),
			worldItems: processSettledResult(results[6], []),
			concepts: processSettledResult(results[7], []),
			prompts: processSettledResult(results[8], []),
			notes: processSettledResult(results[9], []),
			groups: processSettledResult(results[10], []),
			properties: processSettledResult(results[11], []),
			wildcards: processSettledResult(results[12], []),
			audios: processSettledResult(results[13], []),
			documents: processSettledResult(results[14], []),
			jsonFiles: processSettledResult(results[15], []),
			file3ds: processSettledResult(results[16], []),
			workflows: processSettledResult(results[17], []),
			stats: processSettledResult(results[18], defaultStats) as SystemStats,
		};
	} catch (error) {
		navLogger.error('❌ Error al obtener los datos de navegación:', error);
		throw new Error('No se pudieron obtener los datos de navegación.');
	}
}

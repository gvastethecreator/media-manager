'use server';

import { getSystemStats } from '@/app/actions/stats/stats.actions';
import { navLogger } from '@/lib/logger/server-logger';
import type { SystemStats } from '@/types/stats';

// Tipos simplificados para NavigationData
export interface NavigationData {
	folders: { data: any[]; total: number };
	collections: any[];
	tags: any[];
	albums: any[];
	characters: any[];
	places: any[];
	worldItems: any[];
	concepts: any[];
	prompts: any[];
	notes: any[];
	groups: any[];
	properties: any[];
	wildcards: any[];
	audios: any[];
	documents: any[];
	jsonFiles: any[];
	file3ds: any[];
	workflows: any[];
	stats: SystemStats;
}

export async function getNavigationData(): Promise<NavigationData> {
	try {
		navLogger.info('🧭 Obteniendo datos de navegación (versión simplificada)');

		// Solo intentamos obtener stats por ahora
		const statsResult = await getSystemStats().catch(() => null);

		const defaultStats: SystemStats = {
			totalImages: 0,
			totalFolders: 0,
			totalCollections: 0,
			totalTags: 0,
			totalAlbums: 0,
			totalCharacters: 0,
			totalPlaces: 0,
			totalWorldItems: 0,
			totalConcepts: 0,
			totalPrompts: 0,
			totalNotes: 0,
			totalWildcards: 0,
			totalAudios: 0,
			totalDocuments: 0,
			totalJsonFiles: 0,
			totalFile3ds: 0,
			totalWorkflows: 0,
		};

		navLogger.info('✅ Datos de navegación obtenidos exitosamente');

		return {
			folders: { data: [], total: 0 },
			collections: [],
			tags: [],
			albums: [],
			characters: [],
			places: [],
			worldItems: [],
			concepts: [],
			prompts: [],
			notes: [],
			groups: [],
			properties: [],
			wildcards: [],
			audios: [],
			documents: [],
			jsonFiles: [],
			file3ds: [],
			workflows: [],
			stats: statsResult || defaultStats,
		};
	} catch (error) {
		navLogger.error('❌ Error al obtener los datos de navegación:', error);
		throw new Error('No se pudieron obtener los datos de navegación.');
	}
}

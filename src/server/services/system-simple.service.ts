/**
 * @file Servicio simplificado para datos de navegación (temporal para migración Drizzle)
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { NavigationData } from '@/lib/api/navigation';

const navLogger = serverLogger.withContext('NavActions');

export async function getNavigationDataSimple(): Promise<NavigationData> {
	navLogger.info('🧭 Obteniendo datos de navegación (DATOS SIMPLIFICADOS)');

	return {
		folders: [],
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
		stats: {
			totalImages: 0,
			totalFolders: 0,
			totalCollections: 0,
			totalTags: 0,
			totalAlbums: 0,
			totalCharacters: 0,
			totalPlaces: 0,
			totalWorldItems: 0,
			totalFavorites: 0,
			totalActivities: 0,
			totalSize: 0,
			totalViews: 0,
			totalDownloads: 0,
			topTags: [],
			recentActivity: []
		} as any
	};
}

// Copiar funciones del sistema original
export {
	getSystemStats,
	getSystemVersion,
	getSystemSettings,
	updateSystemSettings,
	resetSystemSettings,
	getProfileSettings,
	updateProfileSettings,
	resetProfileSettings,
	createDefaultSettingsData,
	repairSystem,
	resetDatabase
} from '../services/system.service';

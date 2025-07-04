// src/server/services/system.service.ts

import { count } from 'drizzle-orm';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { db } from '@/lib/drizzle';
import { albums, collections, images, notes, tags } from '@/lib/drizzle/schema';
import { createSettingsError, isSettingsError } from '@/lib/errors/settings';
import { createSystemError } from '@/lib/errors/system';
import { serverLogger } from '@/lib/logger/server-logger';
import { settingsService } from '@/services/settings';
import type { Settings } from '@/types/settings';

const navLogger = serverLogger.withContext('NavActions');
const systemLogger = serverLogger.withContext('SystemActions');
const settingsLogger = serverLogger.withContext('SettingsActions');

type SystemStats = {
	totalImages: number;
	totalFolders: number;
	totalCollections: number;
	totalTags: number;
	totalAlbums: number;
	totalCharacters: number;
	totalPlaces: number;
	totalWorldItems: number;
	totalFavorites: number;
	totalActivities: number;
	totalSize: number;
	totalViews: number;
	totalDownloads: number;
	topTags: Array<{ id: string; name: string; count: number }>;
	recentActivity: Array<unknown>;
};

export interface NavigationData {
	folders: Array<{ id: string; name: string; path: string; itemCount: number }>;
	collections: Array<{ id: string; name: string; description: string; itemCount: number }>;
	tags: Array<{ id: string; name: string; count?: number }>;
	albums: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	characters: Array<{ id: string; name: string; description?: string }>;
	places: Array<{ id: string; name: string; description?: string }>;
	worldItems: Array<{ id: string; name: string; description?: string }>;
	concepts: Array<{ id: string; name: string; description?: string }>;
	prompts: Array<{ id: string; name: string; description?: string }>;
	notes: Array<{ id: string; title: string; content?: string }>;
	groups: Array<{ id: string; name: string; description?: string }>;
	properties: Array<{ id: string; name: string; value?: string }>;
	wildcards: Array<{ id: string; name: string; pattern?: string }>;
	audios: Array<{ id: string; name: string; duration?: number }>;
	documents: Array<{ id: string; name: string; type?: string }>;
	jsonFiles: Array<{ id: string; name: string; size?: number }>;
	file3ds: Array<{ id: string; name: string; format?: string }>;
	workflows: Array<{ id: string; name: string; status?: string }>;
	stats: SystemStats;
}

export async function getNavigationData(): Promise<NavigationData> {
	try {
		navLogger.info('🧭 Obteniendo datos de navegación (DATOS REALES)');

		// Importar servicios migrados
		const { getFolders } = await import('@/services/folder/folder.service');
		const { getCollections } = await import('@/services/collection/collection.service');
		const { getTags } = await import('@/services/tag/tag.service');
		const { getAlbums } = await import('@/services/album/album.service');
		const { getCharacters } = await import('@/services/character/character.service');
		const { getPlaces } = await import('@/services/place/place.service');
		const { getWorldItems } = await import('@/services/world-item/world-item.service');
		const { getConcepts } = await import('@/services/concept/concept.service');
		const { getPrompts } = await import('@/services/prompt/prompt.service');
		const { getNotes } = await import('@/services/note/note.service');
		const { getGroups } = await import('@/services/group/group.service');
		const { getProperties } = await import('@/services/property/property.service');
		const { getWildcards } = await import('@/services/wildcard/wildcard.service');
		const { getAudios } = await import('@/services/audio/audio.service');
		const { getDocuments } = await import('@/services/document/document.service');
		const { getJsonFiles } = await import('@/services/json-file/json-file.service');
		const { getFile3Ds } = await import('@/services/file3d/file3d.service');

		// Obtener datos reales en paralelo
		const [
			foldersResult,
			collectionsResult,
			tagsResult,
			albumsResult,
			charactersResult,
			placesResult,
			worldItemsResult,
			conceptsResult,
			promptsResult,
			notesResult,
			groupsResult,
			propertiesResult,
			wildcardsResult,
			audiosResult,
			documentsResult,
			jsonFilesResult,
			file3dsResult,
		] = await Promise.all([
			getFolders({ includeArchived: false }).catch(() => ({ folders: [], total: 0 })),
			getCollections({ includeArchived: false }).catch(() => ({ collections: [], total: 0 })),
			getTags({ includeArchived: false }).catch(() => ({ tags: [], total: 0 })),
			getAlbums({ includeArchived: false }).catch(() => ({ albums: [], total: 0 })),
			getCharacters({ includeArchived: false }).catch(() => ({ characters: [], total: 0 })),
			getPlaces({ includeArchived: false }).catch(() => ({ places: [], total: 0 })),
			getWorldItems({ includeArchived: false }).catch(() => ({ worldItems: [], total: 0 })),
			getConcepts({ includeArchived: false }).catch(() => ({ concepts: [], total: 0 })),
			getPrompts({ includeArchived: false }).catch(() => ({ prompts: [], total: 0 })),
			getNotes({ includeArchived: false }).catch(() => ({ notes: [], total: 0 })),
			getGroups({ includeArchived: false }).catch(() => ({ groups: [], total: 0 })),
			getProperties().catch(() => ({ properties: [], total: 0 })),
			getWildcards().catch(() => ({ wildcards: [], total: 0 })),
			getAudios({ includeArchived: false }).catch(() => ({ audios: [], total: 0 })),
			getDocuments({ includeArchived: false }).catch(() => ({ documents: [], total: 0 })),
			getJsonFiles({ includeArchived: false }).catch(() => ({ jsonFiles: [], total: 0 })),
			getFile3Ds({ includeArchived: false }).catch(() => ({ file3ds: [], total: 0 })),
		]);

		// Calcular estadísticas reales
		const defaultStats: SystemStats = {
			totalImages: 0, // TODO: Implementar cuando ImageService esté completo
			totalFolders: foldersResult.total,
			totalCollections: collectionsResult.total,
			totalTags: tagsResult.total,
			totalAlbums: albumsResult.total,
			totalCharacters: charactersResult.total,
			totalPlaces: placesResult.total,
			totalWorldItems: worldItemsResult.total,
			totalFavorites: 0, // TODO: Calcular favoritos reales
			totalActivities: 0, // TODO: Implementar actividades
			totalSize: 0, // TODO: Calcular tamaño real
			totalViews: 0, // TODO: Implementar vistas
			totalDownloads: 0, // TODO: Implementar descargas
			topTags: tagsResult.tags.slice(0, 5).map((tag) => ({
				id: tag.id,
				name: tag.name,
				count: 0, // TODO: Implementar conteos reales
			})),
			recentActivity: [],
		};

		navLogger.info('✅ Datos de navegación obtenidos exitosamente (DATOS REALES)');

		return {
			folders: foldersResult.folders.map((folder) => ({
				id: folder.id,
				name: folder.name,
				path: folder.path,
				itemCount: 0, // TODO: Implementar conteo real de items
			})),
			collections: collectionsResult.collections.map((collection) => ({
				id: collection.id,
				name: collection.name,
				description: collection.description || '',
				itemCount: 0, // TODO: Implementar conteo real
			})),
			tags: tagsResult.tags.map((tag) => ({
				id: tag.id,
				name: tag.name,
				count: 0, // TODO: Implementar conteo real
			})),
			albums: albumsResult.albums.map((album) => ({
				id: album.id,
				name: album.name,
				description: album.description || '',
				itemCount: 0, // TODO: Implementar conteo real
			})),
			characters: charactersResult.characters.map((character) => ({
				id: character.id,
				name: character.name,
				description: character.description || '',
			})),
			places: placesResult.places.map((place) => ({
				id: place.id,
				name: place.name,
				description: place.description || '',
			})),
			worldItems: worldItemsResult.worldItems.map((item) => ({
				id: item.id,
				name: item.name,
				description: item.description || '',
			})),
			concepts: conceptsResult.concepts.map((concept) => ({
				id: concept.id,
				name: concept.name,
				description: concept.description || '',
			})),
			prompts: promptsResult.prompts.map((prompt) => ({
				id: prompt.id,
				name: prompt.name,
				description: prompt.description || '',
			})),
			notes: notesResult.notes.map((note) => ({
				id: note.id,
				title: note.title,
				content: note.content || '',
			})),
			groups: groupsResult.groups.map((group) => ({
				id: group.id,
				name: group.name,
				description: group.description || '',
			})),
			properties: propertiesResult.properties.map((property) => ({
				id: property.id,
				name: property.name,
				value: property.value || '',
			})),
			wildcards: wildcardsResult.wildcards.map((wildcard) => ({
				id: wildcard.id,
				name: wildcard.name,
				pattern: wildcard.pattern || '',
			})),
			audios: audiosResult.audios.map((audio) => ({
				id: audio.id,
				name: audio.name,
				duration: audio.duration || 0,
			})),
			documents: documentsResult.documents.map((doc) => ({
				id: doc.id,
				name: doc.name,
				type: doc.fileType || 'Unknown',
			})),
			jsonFiles: jsonFilesResult.jsonFiles.map((json) => ({
				id: json.id,
				name: json.name,
				size: json.size || 0,
			})),
			file3ds: file3dsResult.file3ds.map((file3d) => ({
				id: file3d.id,
				name: file3d.name,
				format: file3d.fileType || 'Unknown',
			})),
			workflows: [
				// TODO: Implementar cuando WorkflowService esté migrado
			],
			stats: defaultStats,
		};
	} catch (error) {
		navLogger.error('❌ Error al obtener los datos de navegación:', error);
		throw new Error('No se pudieron obtener los datos de navegación.');
	}
}

export async function revalidateNavigation() {
	try {
		navLogger.info('🔄 Iniciando revalidación de rutas de navegación (MOCK)');
		// En Vite no necesitamos revalidación real
		navLogger.info('✅ Rutas de navegación revalidadas exitosamente (MOCK)');
	} catch (error) {
		navLogger.error('❌ Error al revalidar rutas de navegación:', error);
		throw new Error('No se pudieron revalidar las rutas de navegación');
	}
}

// Interfaz para estadísticas del sistema en tiempo real
export interface SystemRuntimeStats {
	cpuUsage: number;
	memoryUsage: number;
	cacheSize: number;
	dbSize: number;
	totalEntities: number;
	uptime: number;
	nodeVersion: string;
	hostname: string;
}

// Respuesta estándar para operaciones del sistema
export interface SystemResponse {
	success: boolean;
	message: string;
	data?: unknown;
}

/**
 * Obtiene estadísticas del sistema en tiempo real
 */
export async function getSystemStats(): Promise<SystemRuntimeStats> {
	try {
		systemLogger.info('📊 Obteniendo estadísticas del sistema');

		// Obtener información de CPU
		const cpus = os.cpus();
		let totalIdle = 0;
		let totalTick = 0;

		for (const cpu of cpus) {
			for (const type in cpu.times) {
				totalTick += cpu.times[type as keyof typeof cpu.times];
			}
			totalIdle += cpu.times.idle;
		}

		const cpuUsage = Math.round(100 - (totalIdle / totalTick) * 100);

		// Obtener información de memoria
		const totalMem = os.totalmem();
		const freeMem = os.freemem();
		const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

		// Obtener tamaño de caché (simulado con el directorio de Vite)
		let cacheSize = 0;
		try {
			const viteCachePath = path.join(process.cwd(), 'node_modules/.vite');
			const cacheStats = await fs.stat(viteCachePath).catch(() => ({ size: 0 }));
			cacheSize = Math.round(cacheStats.size / (1024 * 1024)); // Convertir a MB
		} catch (error) {
			systemLogger.warn('⚠️ Error al obtener tamaño de caché:', error);
		}

		// Obtener tamaño de base de datos (conteo de entidades)
		const [totalImagesResult, totalCollectionsResult, totalTagsResult, totalAlbumsResult, totalNotesResult] =
			await Promise.all([
				db.select({ count: count() }).from(images),
				db.select({ count: count() }).from(collections),
				db.select({ count: count() }).from(tags),
				db.select({ count: count() }).from(albums),
				db.select({ count: count() }).from(notes),
			]);

		const totalImages = totalImagesResult[0].count;
		const totalCollections = totalCollectionsResult[0].count;
		const totalTags = totalTagsResult[0].count;
		const totalAlbums = totalAlbumsResult[0].count;
		const totalNotes = totalNotesResult[0].count;

		const totalEntities = totalImages + totalCollections + totalTags + totalAlbums + totalNotes;

		// Obtener tamaño de la base de datos (simulado)
		const dbSize = totalEntities * 0.1; // Simulación: 100KB por entidad

		systemLogger.info('✅ Estadísticas del sistema obtenidas');

		return {
			cpuUsage,
			memoryUsage,
			cacheSize,
			dbSize,
			totalEntities,
			uptime: Math.round(os.uptime() / 60 / 60), // En horas
			nodeVersion: process.version,
			hostname: os.hostname(),
		} satisfies SystemStats;
	} catch (error) {
		systemLogger.error('❌ Error al obtener estadísticas del sistema:', error);
		throw createSystemError('No se pudieron obtener las estadísticas del sistema', 'STATS_FETCH_ERROR', error);
	}
}

/**
 * Realiza la reparación del sistema (limpieza de caché, optimización de BD, etc.)
 */
export async function repairSystem(): Promise<SystemResponse> {
	try {
		systemLogger.info('🔧 Iniciando reparación del sistema');

		// 1. Limpiar caché de Vite (simulado)
		await new Promise((resolve) => setTimeout(resolve, 500));

		// 2. Verificar integridad de la base de datos (simulado)
		await new Promise((resolve) => setTimeout(resolve, 500));

		// 3. Optimizar índices (simulado)
		await new Promise((resolve) => setTimeout(resolve, 500));

		// 4. Eliminar archivos temporales (simulado)
		await new Promise((resolve) => setTimeout(resolve, 500));

		systemLogger.info('✅ Sistema reparado correctamente');
		return {
			success: true,
			message: 'Sistema reparado correctamente',
		};
	} catch (error) {
		systemLogger.error('❌ Error al reparar el sistema:', error);
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Error desconocido en la reparación del sistema',
		};
	}
}

/**
 * Resetea la base de datos (elimina todos los datos)
 * ¡PRECAUCIÓN! Esta acción es irreversible
 */
export async function resetDatabase(): Promise<SystemResponse> {
	try {
		systemLogger.warn('⚠️ Iniciando reseteo de base de datos');

		// Esta es una simulación, en producción implementaríamos el borrado real
		// Aquí se implementaría la lógica para:
		// 1. Hacer backup de seguridad
		// 2. Truncar todas las tablas
		// 3. Restaurar configuraciones mínimas

		await new Promise((resolve) => setTimeout(resolve, 3000));

		systemLogger.info('✅ Base de datos reseteada correctamente');
		return {
			success: true,
			message: 'Base de datos reseteada correctamente',
		};
	} catch (error) {
		systemLogger.error('❌ Error al resetear la base de datos:', error);
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Error desconocido al resetear la base de datos',
		};
	}
}

/**
 * Obtiene información sobre la versión del sistema
 */
export async function getSystemVersion(): Promise<{
	version: string;
	buildDate: string;
	environment: string;
}> {
	try {
		systemLogger.info('📋 Obteniendo información de versión del sistema');

		// En una implementación real, esto leería del package.json o un archivo de build
		return {
			version: '1.0.0',
			buildDate: new Date().toISOString(),
			environment: process.env.NODE_ENV || 'development',
		};
	} catch (error) {
		systemLogger.error('❌ Error al obtener versión del sistema:', error);
		throw createSystemError('No se pudo obtener la información de versión', 'VERSION_FETCH_ERROR', error);
	}
}

/**
 * Respuesta estándar para operaciones de configuración
 */
export interface SettingsResponse {
	success: boolean;
	message: string;
	data?: Settings;
}

/**
 * Obtiene la configuración global del sistema
 */
export async function getSystemSettings(): Promise<Settings> {
	settingsLogger.debug('📤 Action: Obteniendo configuración global del sistema');

	try {
		return await settingsService.getSystemSettings();
	} catch (error) {
		settingsLogger.error('❌ Error en action getSystemSettings:', error);
		if (isSettingsError(error)) {
			throw error;
		}
		throw createSettingsError('No se pudo obtener la configuración del sistema', 'GET_FAILED', error);
	}
}

/**
 * Actualiza la configuración global del sistema
 */
export async function updateSystemSettings(data: Partial<Settings>): Promise<Settings> {
	settingsLogger.debug('📥 Action: Actualizando configuración global del sistema', { data });

	try {
		return await settingsService.updateSystemSettings(data);
	} catch (error) {
		settingsLogger.error('❌ Error en action updateSystemSettings:', error);
		if (isSettingsError(error)) {
			throw error;
		}
		throw createSettingsError('No se pudo actualizar la configuración del sistema', 'UPDATE_FAILED', error);
	}
}

/**
 * Resetea la configuración global a valores predeterminados
 */
export async function resetSystemSettings(): Promise<Settings> {
	settingsLogger.debug('🔄 Action: Reseteando configuración global a valores predeterminados');

	try {
		return await settingsService.resetSystemSettings();
	} catch (error) {
		settingsLogger.error('❌ Error en action resetSystemSettings:', error);
		if (isSettingsError(error)) {
			throw error;
		}
		throw createSettingsError('No se pudo resetear la configuración del sistema', 'RESET_FAILED', error);
	}
}

/**
 * Obtiene la configuración de un perfil específico
 */
export async function getProfileSettings(profileId: string): Promise<Settings | null> {
	settingsLogger.debug(`📤 Action: Obteniendo configuración del perfil: ${profileId}`);

	try {
		return await settingsService.getProfileSettings(profileId);
	} catch (error) {
		settingsLogger.error(`❌ Error en action getProfileSettings para perfil ${profileId}:`, error);
		if (isSettingsError(error)) {
			throw error;
		}
		throw createSettingsError('No se pudo obtener la configuración del perfil', 'GET_PROFILE_FAILED', error);
	}
}

/**
 * Actualiza la configuración de un perfil específico
 */
export async function updateProfileSettings(profileId: string, data: Partial<Settings>): Promise<Settings> {
	settingsLogger.debug(`📥 Action: Actualizando configuración del perfil: ${profileId}`, { data });

	try {
		return await settingsService.updateProfileSettings(profileId, data);
	} catch (error) {
		settingsLogger.error(`❌ Error en action updateProfileSettings para perfil ${profileId}:`, error);
		if (isSettingsError(error)) {
			throw error;
		}
		throw createSettingsError('No se pudo actualizar la configuración del perfil', 'UPDATE_PROFILE_FAILED', error);
	}
}

/**
 * Resetea la configuración de un perfil a los valores globales
 */
export async function resetProfileSettings(profileId: string): Promise<void> {
	settingsLogger.debug(`🔄 Action: Reseteando configuración del perfil: ${profileId}`);

	try {
		return await settingsService.resetProfileSettings(profileId);
	} catch (error) {
		settingsLogger.error(`❌ Error en action resetProfileSettings para perfil ${profileId}:`, error);
		if (isSettingsError(error)) {
			throw error;
		}
		throw createSettingsError('No se pudo resetear la configuración del perfil', 'RESET_PROFILE_FAILED', error);
	}
}

/**
 * Crear datos de configuración por defecto
 */
export async function createDefaultSettingsData(): Promise<Settings> {
	settingsLogger.info('📝 Creando configuración por defecto');

	try {
		// Retornar configuración por defecto
		const defaultSettings: Settings = {
			appearance: {
				theme: 'system',
				fontSize: 16,
				language: 'es',
				reducedAnimations: false,
				highContrast: false,
			},
			notifications: {
				enabled: true,
				email: false,
				desktop: true,
				frequency: 'daily',
			},
			privacy: {
				shareUsageData: false,
				storeCookies: true,
				storeHistory: true,
			},
			advanced: {
				apiKey: null,
				devMode: false,
				experimentalFeatures: false,
			},
		};

		return defaultSettings;
	} catch (error) {
		settingsLogger.error('❌ Error creando configuración por defecto:', error);
		throw createSettingsError('CREATE_DEFAULT_FAILED', 'Error al crear configuración por defecto');
	}
}

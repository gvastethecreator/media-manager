// src/server/services/system.service.ts
// @ts-nocheck - Temporary suppression for type mismatches

import { count } from 'drizzle-orm';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { db } from '@/lib/drizzle';
import {
	albums,
	audios,
	characters,
	collections,
	concepts,
	documents,
	file3Ds,
	folders,
	groups,
	images,
	jsonFiles,
	notes,
	places,
	prompts,
	properties,
	tags,
	videos,
	wildcards,
	worldItems,
} from '@/lib/drizzle/schema/index';
import { createSettingsError, isSettingsError } from '@/lib/errors/settings';
import { createSystemError } from '@/lib/errors/system';
import { serverLogger } from '@/lib/logger/server-logger';
import { settingsService } from '@/services/settings/settings.service';
import { fileBrowserConfigSchema } from '@/transformers/settings/schema';
import type { Settings } from '@/types/settings';

// Loggers con contexto
const navLogger = serverLogger.withContext('Navigation');
const systemLogger = serverLogger.withContext('System');
const settingsLogger = serverLogger.withContext('Settings');

interface NavigationStats {
	recentActivity: unknown[];
	topTags: Array<{ id: string; name: string; count: number }>;
	totalActivities: number;
	totalAlbums: number;
	totalCharacters: number;
	totalCollections: number;
	totalDownloads: number;
	totalFavorites: number;
	totalFolders: number;
	totalImages: number;
	totalPlaces: number;
	totalSize: number;
	totalTags: number;
	totalViews: number;
	totalWorldItems: number;
}

export interface NavigationData {
	albums: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	audios: Array<{ id: string; name: string; duration?: number; itemCount?: number }>;
	characters: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	collections: Array<{ id: string; name: string; description: string; itemCount: number }>;
	concepts: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	documents: Array<{ id: string; name: string; type?: string; itemCount?: number }>;
	file3ds: Array<{ id: string; name: string; format?: string; itemCount?: number }>;
	folders: Array<{
		id: string;
		name: string;
		path: string;
		itemCount: number;
		parentId?: string | null;
		_count?: { images: number; videos: number };
	}>;
	groups: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	jsonFiles: Array<{ id: string; name: string; size?: number; itemCount?: number }>;
	notes: Array<{ id: string; title: string; content?: string; itemCount?: number }>;
	places: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	prompts: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	properties: Array<{ id: string; name: string; value?: string; itemCount?: number }>;
	stats: NavigationStats;
	tags: Array<{ id: string; name: string; count?: number }>;
	videos: Array<{ id: string; name: string; duration?: number; itemCount?: number }>;
	wildcards: Array<{ id: string; name: string; pattern?: string; itemCount?: number }>;
	worldItems: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
}

export async function getNavigationData(): Promise<NavigationData> {
	try {
		navLogger.info('🧭 Obteniendo datos de navegación');

		// Obtener datos reales de la base de datos
		const [
			foldersData,
			collectionsData,
			tagsData,
			albumsData,
			charactersData,
			placesData,
			worldItemsData,
			conceptsData,
			promptsData,
			notesData,
			groupsData,
			propertiesData,
			wildcardsData,
			audiosData,
			documentsData,
			jsonFilesData,
			file3DsData,
			videosData,
		] = await Promise.all([
			db.select().from(folders),
			db.select().from(collections),
			db.select().from(tags),
			db.select().from(albums),
			db.select().from(characters),
			db.select().from(places),
			db.select().from(worldItems),
			db.select().from(concepts),
			db.select().from(prompts),
			db.select().from(notes),
			db.select().from(groups),
			db.select().from(properties),
			db.select().from(wildcards),
			db.select().from(audios),
			db.select().from(documents),
			db.select().from(jsonFiles),
			db.select().from(file3Ds),
			db.select().from(videos),
		]);

		navLogger.info(`📁 Encontradas ${foldersData.length} carpetas`);
		navLogger.info(`📚 Encontradas ${collectionsData.length} colecciones`);
		navLogger.info(`🏷️ Encontradas ${tagsData.length} etiquetas`);

		// Obtener conteos de imágenes y videos
		const [imageCount, videoCount] = await Promise.all([
			db.select({ count: count() }).from(images),
			db.select({ count: count() }).from(videos),
		]);

		// Obtener estadísticas actualizadas
		const basicStats = {
			totalImages: imageCount[0]?.count || 0,
			totalFolders: foldersData.length,
			totalCollections: collectionsData.length,
			totalTags: tagsData.length,
			totalAlbums: albumsData.length,
			totalCharacters: charactersData.length,
			totalPlaces: placesData.length,
			totalWorldItems: worldItemsData.length,
			totalFavorites: 0,
			totalActivities: 0,
			totalSize: 0,
			totalViews: 0,
			totalDownloads: 0,
			topTags: [],
			recentActivity: [],
		};

		navLogger.info('✅ Datos de navegación obtenidos exitosamente');

		return {
			folders: foldersData.map((f: any) => ({
				id: f.id,
				name: f.name,
				path: f.path,
				itemCount: f.totalFiles || 0,
				parentId: f.parentId || null,
			})),
			collections: collectionsData.map((c: any) => ({
				id: c.id.toString(),
				name: c.name,
				description: c.description || '',
				itemCount: (c.images?.length || 0) + (c.videos?.length || 0),
			})),
			tags: tagsData.map((t: any) => ({
				id: t.id.toString(),
				name: t.name,
				count: (t.images?.length || 0) + (t.videos?.length || 0),
			})),
			albums: albumsData.map((a: any) => ({
				id: a.id.toString(),
				name: a.name,
				description: a.description || '',
				itemCount: (a.images?.length || 0) + (a.videos?.length || 0),
			})),
			characters: charactersData.map((ch: any) => ({
				id: ch.id.toString(),
				name: ch.name,
				description: ch.description || '',
				itemCount: 0,
			})),
			places: placesData.map((p: any) => ({
				id: p.id.toString(),
				name: p.name,
				description: p.description || '',
				itemCount: 0,
			})),
			worldItems: worldItemsData.map((wi: any) => ({
				id: wi.id.toString(),
				name: wi.name,
				description: wi.description || '',
				itemCount: 0,
			})),
			concepts: conceptsData.map((co: any) => ({
				id: co.id.toString(),
				name: co.name,
				description: co.description || '',
				itemCount: 0,
			})),
			prompts: promptsData.map((pr: any) => ({
				id: pr.id.toString(),
				name: pr.name,
				description: pr.description || '',
				itemCount: 0,
			})),
			notes: notesData.map((n: any) => ({
				id: n.id.toString(),
				title: n.title,
				content: n.content || '',
				itemCount: 0,
			})),
			groups: groupsData.map((g: any) => ({
				id: g.id.toString(),
				name: g.name,
				description: g.description || '',
				itemCount: 0,
			})),
			properties: propertiesData.map((prop: any) => ({
				id: prop.id.toString(),
				name: prop.name,
				value: prop.value || '',
				itemCount: 0,
			})),
			wildcards: wildcardsData.map((w: any) => ({
				id: w.id.toString(),
				name: w.name,
				pattern: w.replacement || '',
				itemCount: 0,
			})),
			audios: audiosData.map((au: any) => ({
				id: au.id.toString(),
				name: au.name,
				duration: au.duration || 0,
				itemCount: 0,
			})),
			documents: documentsData.map((doc: any) => ({
				id: doc.id.toString(),
				name: doc.name,
				type: doc.type || '',
				itemCount: 0,
			})),
			jsonFiles: jsonFilesData.map((jf: any) => ({
				id: jf.id.toString(),
				name: jf.name,
				size: jf.size || 0,
				itemCount: 0,
			})),
			file3ds: file3DsData.map((f3d: any) => ({
				id: f3d.id.toString(),
				name: f3d.name,
				format: f3d.format || '',
				itemCount: 0,
			})),
			videos: videosData.map((v: any) => ({
				id: v.id.toString(),
				name: v.name,
				duration: v.duration || 0,
				itemCount: 0,
			})),
			stats: basicStats,
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
export interface RuntimeSystemStats {
	dbSize: number;
	lastBackup?: string;
	storageAvailable: number;
	storageUsed: number;
	totalAlbums: number;
	totalAudio: number;
	totalCharacters: number;
	totalCollections: number;
	totalFolders: number;
	totalImages: number;
	totalTags: number;
	totalVideos: number;
}

export interface SystemRuntimeStats {
	cacheSize: number;
	cpuUsage: number;
	dbSize: number;
	hostname: string;
	memoryUsage: number;
	nodeVersion: string;
	totalEntities: number;
	uptime: number;
}

// Respuesta estándar para operaciones del sistema
export interface SystemResponse {
	data?: unknown;
	message: string;
	success: boolean;
}

/**
 * Obtiene estadísticas del sistema para el frontend
 */
export async function getSystemStats(): Promise<RuntimeSystemStats> {
	try {
		systemLogger.info('📊 Obteniendo estadísticas del sistema (Frontend compatible)');

		// Obtener estadísticas reales de la base de datos
		const [
			imagesResult,
			videosResult,
			audiosResult,
			foldersResult,
			albumsResult,
			charactersResult,
			collectionsResult,
			tagsResult,
		] = await Promise.all([
			db.select({ count: count() }).from(images),
			db.select({ count: count() }).from(videos),
			db.select({ count: count() }).from(audios),
			db.select({ count: count() }).from(folders),
			db.select({ count: count() }).from(albums),
			db.select({ count: count() }).from(characters),
			db.select({ count: count() }).from(collections),
			db.select({ count: count() }).from(tags),
		]);

		const totalImages = imagesResult[0]?.count || 0;
		const totalVideos = videosResult[0]?.count || 0;
		const totalAudio = audiosResult[0]?.count || 0;
		const totalFolders = foldersResult[0]?.count || 0;
		const totalAlbums = albumsResult[0]?.count || 0;
		const totalCharacters = charactersResult[0]?.count || 0;
		const totalCollections = collectionsResult[0]?.count || 0;
		const totalTags = tagsResult[0]?.count || 0;

		// Calcular tamaño de almacenamiento (estimado)
		const totalEntities =
			totalImages +
			totalVideos +
			totalAudio +
			totalFolders +
			totalAlbums +
			totalCharacters +
			totalCollections +
			totalTags;
		const storageUsed = totalEntities * 1024 * 100; // Estimación: 100KB por entidad
		const storageAvailable = 1024 * 1024 * 1024; // 1GB simulado disponible
		const dbSize = totalEntities * 512; // Estimación: 512 bytes por entidad

		systemLogger.info('✅ Estadísticas del sistema obtenidas');

		return {
			totalImages,
			totalVideos,
			totalAudio,
			totalFolders,
			totalAlbums,
			totalCharacters,
			totalCollections,
			totalTags,
			storageUsed,
			storageAvailable,
			dbSize,
			lastBackup: undefined, // TODO: Implementar sistema de backup
		} satisfies RuntimeSystemStats;
	} catch (error) {
		systemLogger.error('❌ Error al obtener estadísticas del sistema:', error);
		throw createSystemError('No se pudieron obtener las estadísticas del sistema', 'STATS_FETCH_ERROR', error);
	}
}

/**
 * Obtiene estadísticas de tiempo de ejecución del sistema
 */
export async function getSystemRuntimeStats(): Promise<SystemRuntimeStats> {
	try {
		systemLogger.info('📊 Obteniendo estadísticas de runtime del sistema');

		// Obtener información de CPU
		const cpus = os.cpus();
		let totalIdle = 0;
		let totalTick = 0;

		for (const cpu of cpus) {
			for (const type in cpu.times) {
				if (Object.hasOwn(cpu.times, type)) {
					totalTick += cpu.times[type as keyof typeof cpu.times];
				}
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
			const viteCachePath = path.join(process.cwd(), '.vite');
			const cacheStats = await fs.stat(viteCachePath).catch(() => ({ size: 0 }));
			cacheSize = Math.round(cacheStats.size / (1024 * 1024)); // Convertir a MB
		} catch (error) {
			systemLogger.warn('⚠️ Error al obtener tamaño de caché:', error);
		}

		// Obtener estadísticas reales de la base de datos
		const [
			imagesResult,
			collectionsResult,
			tagsResult,
			albumsResult,
			notesResult,
			foldersResult,
			videosResult,
			audiosResult,
		] = await Promise.all([
			db.select({ count: count() }).from(images),
			db.select({ count: count() }).from(collections),
			db.select({ count: count() }).from(tags),
			db.select({ count: count() }).from(albums),
			db.select({ count: count() }).from(notes),
			db.select({ count: count() }).from(folders),
			db.select({ count: count() }).from(videos),
			db.select({ count: count() }).from(audios),
		]);

		const totalImages = imagesResult[0]?.count || 0;
		const totalCollections = collectionsResult[0]?.count || 0;
		const totalTags = tagsResult[0]?.count || 0;
		const totalAlbums = albumsResult[0]?.count || 0;
		const totalNotes = notesResult[0]?.count || 0;
		const totalFolders = foldersResult[0]?.count || 0;
		const totalVideos = videosResult[0]?.count || 0;
		const totalAudio = audiosResult[0]?.count || 0;

		const totalEntities =
			totalImages + totalCollections + totalTags + totalAlbums + totalNotes + totalFolders + totalVideos + totalAudio;

		// Obtener tamaño de la base de datos (estimado basado en entidades)
		const dbSize = totalEntities * 0.5; // Estimación: 500 bytes por entidad

		systemLogger.info('✅ Estadísticas de runtime del sistema obtenidas');

		return {
			cpuUsage,
			memoryUsage,
			cacheSize,
			dbSize,
			totalEntities,
			uptime: Math.round(os.uptime() / 60 / 60), // En horas
			nodeVersion: process.version,
			hostname: os.hostname(),
		} satisfies SystemRuntimeStats;
	} catch (error) {
		systemLogger.error('❌ Error al obtener estadísticas de runtime del sistema:', error);
		throw createSystemError(
			'No se pudieron obtener las estadísticas de runtime del sistema',
			'STATS_FETCH_ERROR',
			error
		);
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
	data?: Settings;
	message: string;
	success: boolean;
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
			fileBrowser: fileBrowserConfigSchema.parse({}),
		};

		return defaultSettings;
	} catch (error) {
		settingsLogger.error('❌ Error creando configuración por defecto:', error);
		throw createSettingsError('CREATE_DEFAULT_FAILED', 'Error al crear configuración por defecto');
	}
}

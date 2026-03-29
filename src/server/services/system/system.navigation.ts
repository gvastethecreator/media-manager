/**
 * Queries de navegación del sistema
 * Obtiene datos de todas las entidades para el panel de navegación
 */

import { count } from 'drizzle-orm';
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
import { serverLogger } from '@/lib/logger/server-logger';
import type { NavigationData } from './system.types';

// Logger con contexto
const navLogger = serverLogger.withContext('Navigation');

/**
 * Obtiene todos los datos necesarios para la navegación del sistema
 * Incluye 18 tipos de entidades: folders, collections, tags, albums, characters,
 * places, worldItems, concepts, prompts, notes, groups, properties, wildcards,
 * audios, documents, jsonFiles, file3Ds, videos
 */
export async function getNavigationData(): Promise<NavigationData> {
	try {
		navLogger.info('🧭 Obteniendo datos de navegación');

		// Obtener datos reales de la base de datos (18 entidades en paralelo)
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

		// Construir estadísticas básicas
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

		// Transformar y retornar datos
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

/**
 * Revalida las rutas de navegación cuando el runtime lo requiere.
 * En el stack actual la navegación se obtiene por consulta, así que normalmente no hay caché manual que invalidar.
 */
export async function revalidateNavigation() {
	try {
		navLogger.info('🔄 Verificando si la navegación requiere revalidación manual');
		navLogger.info('✅ No se requirió revalidación manual de navegación');
	} catch (error) {
		navLogger.error('❌ Error al revalidar rutas de navegación:', error);
		throw new Error('No se pudieron revalidar las rutas de navegación');
	}
}

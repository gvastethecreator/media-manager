// 🎯 Servicio optimizado de estadísticas migrado a Drizzle ORM
// filepath: d:\DEV\image-manager\src\services\stats\optimized-stats.service.ts

import { sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { serverLogger } from '@/lib/logger/server-logger';
import { unstable_cache } from '@/lib/server/revalidate';

/**
 * 🚀 Servicio optimizado que agrupa consultas SUM y usa caché inteligente
 * ✅ MIGRADO A DRIZZLE ORM
 */
export class OptimizedStatsService {
	private static instance: OptimizedStatsService;
	private logger = serverLogger.withContext('OptimizedStatsService');

	private constructor() {
		// Constructor vacío - ya no necesitamos PrismaClient
	}

	public static getInstance(): OptimizedStatsService {
		if (!OptimizedStatsService.instance) {
			OptimizedStatsService.instance = new OptimizedStatsService();
		}
		return OptimizedStatsService.instance;
	}

	/**
	 * 🎯 Reemplazo optimizado para getAlbumStats() - Una consulta Drizzle en lugar de 15+
	 * ✅ MIGRADO A DRIZZLE
	 */
	getAlbumStatsOptimized = async (
		albumId: string
	): Promise<{
		imageCount: number;
		videoCount: number;
		totalSize: number;
		entitiesCount: number;
		breakdown: Record<string, number>;
	}> => {
			this.logger.debug(`📊 Obteniendo estadísticas optimizadas para álbum: ${albumId}`);

			try {
				// 🚀 Consulta optimizada usando Drizzle con SQL raw para joins complejos
				const statsQuery = await db.all(sql`
					SELECT
						COUNT(DISTINCT i.id) as imageCount,
						COUNT(DISTINCT v.id) as videoCount,
						COALESCE(SUM(i.size), 0) as imageTotalSize,
						COALESCE(SUM(v.size), 0) as videoTotalSize,
						COUNT(DISTINCT c.id) as collectionsCount,
						COUNT(DISTINCT t.id) as tagsCount,
						COUNT(DISTINCT ch.id) as charactersCount,
						COUNT(DISTINCT p.id) as placesCount,
						COUNT(DISTINCT wi.id) as worldItemsCount,
						COUNT(DISTINCT co.id) as conceptsCount,
						COUNT(DISTINCT pr.id) as promptsCount,
						COUNT(DISTINCT n.id) as notesCount,
						COUNT(DISTINCT w.id) as wildcardsCount,
						COUNT(DISTINCT prop.id) as propertiesCount,
						COUNT(DISTINCT g.id) as groupsCount
					FROM Album a
					LEFT JOIN _AlbumToImage ai ON a.id = ai.A
					LEFT JOIN Image i ON ai.B = i.id
					LEFT JOIN _AlbumToVideo av ON a.id = av.A
					LEFT JOIN Video v ON av.B = v.id
					LEFT JOIN _AlbumToCollection ac ON a.id = ac.A
					LEFT JOIN Collection c ON ac.B = c.id
					LEFT JOIN _AlbumToTag at ON a.id = at.A
					LEFT JOIN Tag t ON at.B = t.id
					LEFT JOIN _AlbumToCharacter ach ON a.id = ach.A
					LEFT JOIN Character ch ON ach.B = ch.id
					LEFT JOIN _AlbumToPlace ap ON a.id = ap.A
					LEFT JOIN Place p ON ap.B = p.id
					LEFT JOIN _AlbumToWorldItem awi ON a.id = awi.A
					LEFT JOIN WorldItem wi ON awi.B = wi.id
					LEFT JOIN _AlbumToConcept aco ON a.id = aco.A
					LEFT JOIN Concept co ON aco.B = co.id
					LEFT JOIN _AlbumToPrompt apr ON a.id = apr.A
					LEFT JOIN Prompt pr ON apr.B = pr.id
					LEFT JOIN _AlbumToNote an ON a.id = an.A
					LEFT JOIN Note n ON an.B = n.id
					LEFT JOIN _AlbumToWildcard aw ON a.id = aw.A
					LEFT JOIN Wildcard w ON aw.B = w.id
					LEFT JOIN _AlbumToProperty aprop ON a.id = aprop.A
					LEFT JOIN Property prop ON aprop.B = prop.id
					LEFT JOIN _AlbumToGroup ag ON a.id = ag.A
					LEFT JOIN Group g ON ag.B = g.id
					WHERE a.id = ${albumId}
				`);

				const stats = statsQuery[0] as any;

				const breakdown = {
					collections: Number(stats.collectionsCount) || 0,
					tags: Number(stats.tagsCount) || 0,
					characters: Number(stats.charactersCount) || 0,
					places: Number(stats.placesCount) || 0,
					worldItems: Number(stats.worldItemsCount) || 0,
					concepts: Number(stats.conceptsCount) || 0,
					prompts: Number(stats.promptsCount) || 0,
					notes: Number(stats.notesCount) || 0,
					wildcards: Number(stats.wildcardsCount) || 0,
					properties: Number(stats.propertiesCount) || 0,
					groups: Number(stats.groupsCount) || 0,
				};

				return {
					imageCount: Number(stats.imageCount) || 0,
					videoCount: Number(stats.videoCount) || 0,
					totalSize: (Number(stats.imageTotalSize) || 0) + (Number(stats.videoTotalSize) || 0),
					entitiesCount: Object.values(breakdown).reduce((sum, count) => sum + count, 0),
					breakdown,
				};
			} catch (error) {
				this.logger.error('❌ Error al obtener estadísticas de álbum:', { albumId, error });
				throw error;
			}
	};

	/**
	 * 🎯 Estadísticas por lotes para múltiples álbumes - Evita N+1 queries
	 * ✅ MIGRADO A DRIZZLE
	 */
	getBatchAlbumStats = async (albumIds: string[]): Promise<Record<string, any>> => {
			if (albumIds.length === 0) return {};

			this.logger.debug(`📊 Obteniendo estadísticas por lotes para ${albumIds.length} álbumes`);

			try {
				// 🚀 Una consulta para todos los álbumes en lugar de N consultas separadas
				const batchStatsQuery = await db.all(sql`
					SELECT
						a.id as albumId,
						a.name as albumName,
						COUNT(DISTINCT i.id) as imageCount,
						COUNT(DISTINCT v.id) as videoCount,
						COALESCE(SUM(i.size), 0) as imageTotalSize,
						COALESCE(SUM(v.size), 0) as videoTotalSize,
						COUNT(DISTINCT CASE WHEN i.isFavorite = true THEN i.id END) as favoriteImagesCount,
						COUNT(DISTINCT CASE WHEN v.isFavorite = true THEN v.id END) as favoriteVideosCount
					FROM Album a
					LEFT JOIN _AlbumToImage ai ON a.id = ai.A
					LEFT JOIN Image i ON ai.B = i.id
					LEFT JOIN _AlbumToVideo av ON a.id = av.A
					LEFT JOIN Video v ON av.B = v.id
					WHERE a.id IN (${albumIds.map(id => `'${id}'`).join(',')})
					GROUP BY a.id, a.name
				`);

				return (batchStatsQuery as any[]).reduce(
					(acc, stats) => {
						acc[stats.albumId] = {
							albumId: stats.albumId,
							albumName: stats.albumName,
							imageCount: Number(stats.imageCount) || 0,
							videoCount: Number(stats.videoCount) || 0,
							totalSize: (Number(stats.imageTotalSize) || 0) + (Number(stats.videoTotalSize) || 0),
							favoritesCount: (Number(stats.favoriteImagesCount) || 0) + (Number(stats.favoriteVideosCount) || 0),
							totalCount: (Number(stats.imageCount) || 0) + (Number(stats.videoCount) || 0),
						};
						return acc;
					},
					{} as Record<string, any>
				);
			} catch (error) {
				this.logger.error('❌ Error al obtener estadísticas por lotes:', { albumIds, error });
				throw error;
			}
	};

	/**
	 * 🎯 Estadísticas globales optimizadas - Una consulta en lugar de 13+
	 * ✅ MIGRADO A DRIZZLE
	 */
	getGlobalStatsOptimized = async (): Promise<{
		totalImages: number;
		totalVideos: number;
		totalFolders: number;
		totalCollections: number;
		totalTags: number;
		totalAlbums: number;
		totalCharacters: number;
		totalPlaces: number;
		totalWorldItems: number;
		totalActivities: number;
		totalSize: number;
		totalViews: number;
		totalDownloads: number;
		totalFavorites: number;
	}> => {
			this.logger.debug('📊 Obteniendo estadísticas globales optimizadas');

			try {
				// 🚀 Una sola consulta SQL para todos los conteos globales usando Drizzle
				const globalStatsQuery = await db.all(sql`
					SELECT
						(SELECT COUNT(*) FROM Image) as totalImages,
						(SELECT COUNT(*) FROM Video) as totalVideos,
						(SELECT COUNT(*) FROM Folder) as totalFolders,
						(SELECT COUNT(*) FROM Collection) as totalCollections,
						(SELECT COUNT(*) FROM Tag) as totalTags,
						(SELECT COUNT(*) FROM Album) as totalAlbums,
						(SELECT COUNT(*) FROM Character) as totalCharacters,
						(SELECT COUNT(*) FROM Place) as totalPlaces,
						(SELECT COUNT(*) FROM WorldItem) as totalWorldItems,
						(SELECT COUNT(*) FROM Activity) as totalActivities,
						(SELECT COALESCE(SUM(size), 0) FROM Image) as totalImagesSize,
						(SELECT COALESCE(SUM(size), 0) FROM Video) as totalVideosSize,
						(SELECT COUNT(*) FROM Image WHERE isFavorite = true) as totalFavoriteImages,
						(SELECT COUNT(*) FROM Video WHERE isFavorite = true) as totalFavoriteVideos
				`);

				const stats = globalStatsQuery[0] as any;

				return {
					totalImages: Number(stats.totalImages) || 0,
					totalVideos: Number(stats.totalVideos) || 0,
					totalFolders: Number(stats.totalFolders) || 0,
					totalCollections: Number(stats.totalCollections) || 0,
					totalTags: Number(stats.totalTags) || 0,
					totalAlbums: Number(stats.totalAlbums) || 0,
					totalCharacters: Number(stats.totalCharacters) || 0,
					totalPlaces: Number(stats.totalPlaces) || 0,
					totalWorldItems: Number(stats.totalWorldItems) || 0,
					totalActivities: Number(stats.totalActivities) || 0,
					totalSize: (Number(stats.totalImagesSize) || 0) + (Number(stats.totalVideosSize) || 0),
					totalViews: 0, // TODO: Implementar cuando tengamos tabla de vistas
					totalDownloads: 0, // TODO: Implementar cuando tengamos tabla de descargas
					totalFavorites: (Number(stats.totalFavoriteImages) || 0) + (Number(stats.totalFavoriteVideos) || 0),
				};
			} catch (error) {
				this.logger.error('❌ Error al obtener estadísticas globales:', { error });
				throw error;
			}
	};

	/**
	 * 🎯 Estadísticas de grupo optimizadas - Reemplaza múltiples count() queries
	 * ✅ MIGRADO A DRIZZLE
	 */
	getGroupStatsOptimized = async (
		groupId: string
	): Promise<{
		imageCount: number;
		videoCount: number;
		albumCount: number;
		tagCount: number;
		totalSize: number;
		itemCounts: {
			images: number;
			videos: number;
			albums: number;
			tags: number;
		};
	}> => {
			this.logger.debug(`📊 Obteniendo estadísticas optimizadas para grupo: ${groupId}`);

			try {
				// 🚀 Una sola consulta SQL raw en lugar de múltiples count() separadas usando Drizzle
				const groupStatsQuery = await db.all(sql`
					SELECT
						COUNT(DISTINCT gti.B) as imageCount,
						COUNT(DISTINCT gtv.B) as videoCount,
						COUNT(DISTINCT gta.B) as albumCount,
						COUNT(DISTINCT gtt.B) as tagCount,
						COALESCE(SUM(DISTINCT i.size), 0) as imageTotalSize,
						COALESCE(SUM(DISTINCT v.size), 0) as videoTotalSize
					FROM Group g
					LEFT JOIN _GroupToImage gti ON g.id = gti.A
					LEFT JOIN Image i ON gti.B = i.id
					LEFT JOIN _GroupToVideo gtv ON g.id = gtv.A
					LEFT JOIN Video v ON gtv.B = v.id
					LEFT JOIN _GroupToAlbum gta ON g.id = gta.A
					LEFT JOIN _GroupToTag gtt ON g.id = gtt.A
					WHERE g.id = ${groupId}
				`);

				const stats = groupStatsQuery[0] as any;

				const imageCount = Number(stats.imageCount) || 0;
				const videoCount = Number(stats.videoCount) || 0;
				const albumCount = Number(stats.albumCount) || 0;
				const tagCount = Number(stats.tagCount) || 0;

				return {
					imageCount,
					videoCount,
					albumCount,
					tagCount,
					totalSize: (Number(stats.imageTotalSize) || 0) + (Number(stats.videoTotalSize) || 0),
					itemCounts: {
						images: imageCount,
						videos: videoCount,
						albums: albumCount,
						tags: tagCount,
					},
				};
			} catch (error) {
				this.logger.error('❌ Error al obtener estadísticas de grupo:', { groupId, error });
				throw error;
			}
	};

	/**
	 * 🎯 Estadísticas de tags optimizadas - Reemplaza N+1 aggregate queries
	 * ✅ MIGRADO A DRIZZLE
	 */
	getBatchTagStatsOptimized = async (tagIds?: string[]): Promise<Record<string, any>> => {
			this.logger.debug('📊 Obteniendo estadísticas por lotes para tags');

			try {
				// Si no se proporcionan IDs, obtener todos los tags
				const batchTagStatsQuery =
					tagIds && tagIds.length > 0
						? await db.all(sql`
						SELECT
							t.id as tagId,
							t.name,
							t.color,
							COUNT(DISTINCT i.id) as imageCount,
							COALESCE(SUM(i.size), 0) as totalSize,
							COUNT(DISTINCT g.id) as groupCount,
							COUNT(DISTINCT p.id) as propertyCount,
							COUNT(DISTINCT w.id) as wildcardCount
						FROM Tag t
						LEFT JOIN _ImageToTag it ON t.id = it.B
						LEFT JOIN Image i ON it.A = i.id
						LEFT JOIN _GroupToTag gt ON t.id = gt.B
						LEFT JOIN Group g ON gt.A = g.id
						LEFT JOIN _PropertyToTag pt ON t.id = pt.B
						LEFT JOIN Property p ON pt.A = p.id
						LEFT JOIN _TagToWildcard tw ON t.id = tw.A
						LEFT JOIN Wildcard w ON tw.B = w.id
						WHERE t.id IN (${tagIds.map(id => `'${id}'`).join(',')})
						GROUP BY t.id, t.name, t.color
					`)
						: await db.all(sql`
						SELECT
							t.id as tagId,
							t.name,
							t.color,
							COUNT(DISTINCT i.id) as imageCount,
							COALESCE(SUM(i.size), 0) as totalSize,
							COUNT(DISTINCT g.id) as groupCount,
							COUNT(DISTINCT p.id) as propertyCount,
							COUNT(DISTINCT w.id) as wildcardCount
						FROM Tag t
						LEFT JOIN _ImageToTag it ON t.id = it.B
						LEFT JOIN Image i ON it.A = i.id
						LEFT JOIN _GroupToTag gt ON t.id = gt.B
						LEFT JOIN Group g ON gt.A = g.id
						LEFT JOIN _PropertyToTag pt ON t.id = pt.B
						LEFT JOIN Property p ON pt.A = p.id
						LEFT JOIN _TagToWildcard tw ON t.id = tw.A
						LEFT JOIN Wildcard w ON tw.B = w.id
						GROUP BY t.id, t.name, t.color
					`);

				// Convertir array de resultados a objeto con clave tagId
				const statsArray = Array.isArray(batchTagStatsQuery) ? batchTagStatsQuery : [batchTagStatsQuery];
				return statsArray.reduce(
					(
						acc: Record<
							string,
							{
								imageCount: number;
								totalSize: number;
								groupCount: number;
								propertyCount: number;
								wildcardCount: number;
								_count: {
									images: number;
									groups: number;
									properties: number;
									wildcards: number;
								};
							}
						>,
						stats: any
					) => {
						acc[stats.tagId] = {
							imageCount: Number(stats.imageCount) || 0,
							totalSize: Number(stats.totalSize) || 0,
							groupCount: Number(stats.groupCount) || 0,
							propertyCount: Number(stats.propertyCount) || 0,
							wildcardCount: Number(stats.wildcardCount) || 0,
							_count: {
								images: Number(stats.imageCount) || 0,
								groups: Number(stats.groupCount) || 0,
								properties: Number(stats.propertyCount) || 0,
								wildcards: Number(stats.wildcardCount) || 0,
							},
						};
						return acc;
					},
					{}
				);
			} catch (error) {
				this.logger.error('❌ Error al obtener estadísticas por lotes de tags:', { tagIds, error });
				throw error;
			}
	};

	/**
	 * 🎯 Estadísticas de colecciones optimizadas - Similar a álbumes
	 * ✅ MIGRADO A DRIZZLE
	 */
	getBatchCollectionStatsOptimized = async (collectionIds?: string[]): Promise<Record<string, any>> => {
			this.logger.debug('📊 Obteniendo estadísticas por lotes para colecciones');

			try {
				const batchCollectionStatsQuery =
					collectionIds && collectionIds.length > 0
						? await db.all(sql`
						SELECT
							c.id as collectionId,
							c.name,
							COUNT(DISTINCT i.id) as imageCount,
							COALESCE(SUM(i.size), 0) as totalSize,
							COUNT(DISTINCT g.id) as groupCount,
							COUNT(DISTINCT p.id) as propertyCount,
							COUNT(DISTINCT w.id) as wildcardCount
						FROM Collection c
						LEFT JOIN _CollectionToImage ci ON c.id = ci.A
						LEFT JOIN Image i ON ci.B = i.id
						LEFT JOIN _CollectionToGroup cg ON c.id = cg.A
						LEFT JOIN Group g ON cg.B = g.id
						LEFT JOIN _CollectionToProperty cp ON c.id = cp.A
						LEFT JOIN Property p ON cp.B = p.id
						LEFT JOIN _CollectionToWildcard cw ON c.id = cw.A
						LEFT JOIN Wildcard w ON cw.B = w.id
						WHERE c.id IN (${collectionIds.map(id => `'${id}'`).join(',')})
						GROUP BY c.id, c.name
					`)
						: await db.all(sql`
						SELECT
							c.id as collectionId,
							c.name,
							COUNT(DISTINCT i.id) as imageCount,
							COALESCE(SUM(i.size), 0) as totalSize,
							COUNT(DISTINCT g.id) as groupCount,
							COUNT(DISTINCT p.id) as propertyCount,
							COUNT(DISTINCT w.id) as wildcardCount
						FROM Collection c
						LEFT JOIN _CollectionToImage ci ON c.id = ci.A
						LEFT JOIN Image i ON ci.B = i.id
						LEFT JOIN _CollectionToGroup cg ON c.id = cg.A
						LEFT JOIN Group g ON cg.B = g.id
						LEFT JOIN _CollectionToProperty cp ON c.id = cp.A
						LEFT JOIN Property p ON cp.B = p.id
						LEFT JOIN _CollectionToWildcard cw ON c.id = cw.A
						LEFT JOIN Wildcard w ON cw.B = w.id
						GROUP BY c.id, c.name
					`);

				const statsArray = Array.isArray(batchCollectionStatsQuery)
					? batchCollectionStatsQuery
					: [batchCollectionStatsQuery];
				return statsArray.reduce(
					(
						acc: Record<
							string,
							{
								imageCount: number;
								totalSize: number;
								groupCount: number;
								propertyCount: number;
								wildcardCount: number;
								_count: {
									images: number;
									groups: number;
									properties: number;
									wildcards: number;
								};
							}
						>,
						stats: any
					) => {
						acc[stats.collectionId] = {
							imageCount: Number(stats.imageCount) || 0,
							totalSize: Number(stats.totalSize) || 0,
							groupCount: Number(stats.groupCount) || 0,
							propertyCount: Number(stats.propertyCount) || 0,
							wildcardCount: Number(stats.wildcardCount) || 0,
							_count: {
								images: Number(stats.imageCount) || 0,
								groups: Number(stats.groupCount) || 0,
								properties: Number(stats.propertyCount) || 0,
								wildcards: Number(stats.wildcardCount) || 0,
							},
						};
						return acc;
					},
					{}
				);
			} catch (error) {
				this.logger.error('❌ Error al obtener estadísticas por lotes de colecciones:', { collectionIds, error });
				throw error;
			}
	};

	/**
	 * 🎯 Estadísticas de favoritos optimizadas - Una consulta en lugar de múltiples count()
	 * ✅ MIGRADO A DRIZZLE
	 */
	getFavoriteStatsOptimized = async (): Promise<{
		total: number;
		byType: Record<string, number>;
	}> => {
			this.logger.debug('📊 Obteniendo estadísticas de favoritos optimizadas');

			try {
				// 🚀 Una sola consulta SQL para todos los conteos de favoritos usando Drizzle
				const favoriteStatsQuery = await db.all(sql`
					SELECT
						(SELECT COUNT(*) FROM Character WHERE isFavorite = true) as characterCount,
						(SELECT COUNT(*) FROM Place WHERE isFavorite = true) as placeCount,
						(SELECT COUNT(*) FROM WorldItem WHERE isFavorite = true) as worldItemCount,
						(SELECT COUNT(*) FROM Collection WHERE isFavorite = true) as collectionCount,
						(SELECT COUNT(*) FROM Concept WHERE isFavorite = true) as conceptCount,
						(SELECT COUNT(*) FROM Prompt WHERE isFavorite = true) as promptCount,
						(SELECT COUNT(*) FROM Note WHERE isFavorite = true) as noteCount
				`);

				const stats = favoriteStatsQuery[0] as {
					characterCount: number;
					placeCount: number;
					worldItemCount: number;
					collectionCount: number;
					conceptCount: number;
					promptCount: number;
					noteCount: number;
				};

				const characterCount = Number(stats.characterCount) || 0;
				const placeCount = Number(stats.placeCount) || 0;
				const worldItemCount = Number(stats.worldItemCount) || 0;
				const collectionCount = Number(stats.collectionCount) || 0;
				const conceptCount = Number(stats.conceptCount) || 0;
				const promptCount = Number(stats.promptCount) || 0;
				const noteCount = Number(stats.noteCount) || 0;

				const total =
					characterCount + placeCount + worldItemCount + collectionCount + conceptCount + promptCount + noteCount;

				return {
					total,
					byType: {
						character: characterCount,
						place: placeCount,
						'world-item': worldItemCount,
						collection: collectionCount,
						concept: conceptCount,
						prompt: promptCount,
						note: noteCount,
					},
				};
			} catch (error) {
				this.logger.error('❌ Error al obtener estadísticas de favoritos:', { error });
				throw error;
			}
	};

	/**
	 * 🎯 Top tags optimizado con una sola consulta
	 * ✅ MIGRADO A DRIZZLE
	 */
	getTopTagsOptimized = async (
		limit = 10
	): Promise<
		Array<{
			id: string;
			name: string;
			color: string;
			count: number;
			imageCount: number;
			videoCount: number;
		}>
	> => {
			this.logger.debug(`📊 Obteniendo top ${limit} tags optimizado`);

			try {
				// 🚀 Una consulta optimizada para obtener tags con conteos usando Drizzle
				const topTagsQuery = await db.all(sql`
					SELECT
						t.id,
						t.name,
						t.color,
						COUNT(DISTINCT ti.B) as imageCount,
						COUNT(DISTINCT tv.B) as videoCount,
						(COUNT(DISTINCT ti.B) + COUNT(DISTINCT tv.B)) as totalCount
					FROM Tag t
					LEFT JOIN _ImageToTag ti ON t.id = ti.A
					LEFT JOIN _TagToVideo tv ON t.id = tv.A
					GROUP BY t.id, t.name, t.color
					HAVING totalCount > 0
					ORDER BY totalCount DESC
					LIMIT ${limit}
				`);

				return (
					topTagsQuery as Array<{
						id: string;
						name: string;
						color: string;
						imageCount: number;
						videoCount: number;
						totalCount: number;
					}>
				).map((tag: (typeof topTagsQuery)[0]) => ({
					id: tag.id,
					name: tag.name,
					color: tag.color || '#6B7280',
					count: Number(tag.totalCount) || 0,
					imageCount: Number(tag.imageCount) || 0,
					videoCount: Number(tag.videoCount) || 0,
				}));
			} catch (error) {
				this.logger.error('❌ Error al obtener top tags:', { limit, error });
				throw error;
			}
	};
}

/**
 * 🧹 Funciones de utilidad para invalidar caché
 */
export const optimizedStatsUtils = {
	/**
	 * Invalida caché cuando se modifica un álbum
	 */
	invalidateAlbumCache: () => {
		// Invalidar caché global
		// Esta función se llamaría después de operaciones CRUD en álbumes
	},

	/**
	 * Invalida caché global
	 */
	invalidateGlobalCache: () => {
		// Invalidar caché global
		// Esta función se llamaría después de operaciones significativas
	},
};

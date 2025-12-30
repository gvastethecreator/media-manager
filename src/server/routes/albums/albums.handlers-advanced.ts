/**
 * @file albums.handlers-advanced.ts
 * @module server/routes/albums/handlers-advanced
 * @description Handlers complejos para rutas de albums (card-data, search, recent-media)
 */

import { and, asc, count, desc, eq, inArray, like, or } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db } from '@/lib/drizzle';
import { albums, images, videos, imageAlbums, videoAlbums } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import type { AlbumCardData, ThumbnailImage } from './albums.types';
import { getAlbumStats } from './albums.utils';

const albumLogger = serverLogger.withContext('AlbumsAPI');

/**
 * GET /api/albums - Listar albums
 */
export async function getAlbumsHandler(req: Request, res: Response) {
	try {
		const { limit = '50', offset = '0', sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;
		const limitNum = Number.parseInt(limit as string, 10);
		const offsetNum = Number.parseInt(offset as string, 10);

		const albumCount = await db.select({ count: count() }).from(albums);
		const total = albumCount[0].count;

		if (total === 0) {
			res.json({
				data: [],
				pagination: { total: 0, limit: limitNum, offset: offsetNum },
				message: 'No hay albums disponibles',
			});
			return;
		}

		// Obtener albums con ordenamiento
		const orderColumn = sortBy === 'name' ? albums.name : sortBy === 'createdAt' ? albums.createdAt : albums.updatedAt;
		const orderDir = sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);

		const allAlbums = await db.select().from(albums).orderBy(orderDir).limit(limitNum).offset(offsetNum);

		res.json({
			data: allAlbums,
			pagination: {
				total,
				limit: limitNum,
				offset: offsetNum,
			},
		});
	} catch (error) {
		albumLogger.error('Error en /api/albums', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			details: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
}

/**
 * GET /api/albums/:id/card-data - Obtiene datos para tarjeta de album
 */
export async function getAlbumCardDataHandler(req: Request, res: Response) {
	try {
		const { id: albumId } = req.params;

		const album = await db.query.albums.findFirst({
			where: eq(albums.id, albumId),
			with: {
				images: { columns: { id: true } },
				videos: { columns: { id: true } },
				collections: { columns: { id: true } },
				tags: { columns: { id: true } },
				characters: { columns: { id: true } },
				places: { columns: { id: true } },
				worldItems: { columns: { id: true } },
				concepts: { columns: { id: true } },
				prompts: { columns: { id: true } },
				notes: { columns: { id: true } },
				wildcards: { columns: { id: true } },
				properties: { columns: { id: true } },
				groups: { columns: { id: true } },
			},
		});

		if (!album) {
			res.status(404).json({ error: `Álbum no encontrado: ${albumId}` });
			return;
		}

		// Obtener imágenes recientes
		const recentImages = await db.query.images.findMany({
			where: inArray(
				images.id,
				album.images.map((img: any) => img.id)
			),
			columns: { id: true, path: true, thumbnailWidth: true, thumbnailHeight: true },
			orderBy: desc(images.updatedAt),
			limit: 6,
		});

		const recentImagePaths = recentImages.map((img: any) => `/api/thumbnails/${img.id}`);

		// Obtener videos recientes
		const recentVideos = await db.query.videos.findMany({
			where: inArray(
				videos.id,
				album.videos.map((vid: any) => vid.id)
			),
			columns: { id: true, path: true, thumbnailWidth: true, thumbnailHeight: true },
			orderBy: desc(videos.updatedAt),
			limit: 3,
		});

		const recentVideoPaths = recentVideos.map((video: any) => `/api/video-thumbnails/${video.id}`);

		// Parsear filters
		let filters = [];
		if (typeof album.filters === 'string' && album.filters !== 'empty_array') {
			try {
				filters = JSON.parse(album.filters);
			} catch {
				filters = [];
			}
		}

		const { totalSize, imageCount, videoCount, entitiesCount } = await getAlbumStats(albumId);

		const metadata = {
			itemCount: imageCount + videoCount,
			imageCount,
			videoCount,
			lastModified: album.updatedAt,
			coverImageUrl: album.featuredImage ? `/api/images/${album.featuredImage}` : null,
			thumbnailUrls: recentImagePaths.slice(0, 3),
			entitiesCount,
		};

		const viewConfig = {
			theme: 'default',
			layout: 'grid',
			thumbnailSize: 'medium' as 'none' | 'small' | 'medium' | 'large',
		};

		const result: AlbumCardData = {
			...album,
			stats: {
				imageCount: album.images.length,
				videoCount: album.videos.length,
				collectionCount: album.collections.length,
				tagCount: album.tags.length,
				characterCount: album.characters.length,
				placeCount: album.places.length,
				worldItemCount: album.worldItems.length,
				conceptCount: album.concepts.length,
				promptCount: album.prompts.length,
				noteCount: album.notes.length,
				wildcardCount: album.wildcards.length,
				propertyCount: album.properties.length,
				groupCount: album.groups.length,
			},
			recentImages: recentImagePaths,
			recentVideos: recentVideoPaths,
			totalSize,
			filters,
			metadata,
			viewConfig,
		};

		res.json(result);
	} catch (error) {
		albumLogger.error('Error getting album card data', { error, albumId: req.params.id });
		res.status(500).json({ error: 'Error interno del servidor' });
	}
}

/**
 * GET /api/albums/cards - Lista albums para galería de tarjetas
 */
export async function getAlbumCardsHandler(req: Request, res: Response) {
	try {
		const {
			limit = '20',
			category,
			searchTerm,
			orderBy = 'updatedAt',
			orderDir = 'desc',
			isFavorite,
			includeStats = 'true',
		} = req.query;

		const limitNum = Number.parseInt(limit as string, 10);
		const includeStatsFlag = includeStats === 'true';

		const conditions = [];

		if (category) {
			conditions.push(eq(albums.category, category as string));
		}

		if (searchTerm) {
			conditions.push(or(like(albums.name, `%${searchTerm}%`), like(albums.description, `%${searchTerm}%`)));
		}

		if (isFavorite === 'true') {
			conditions.push(eq(albums.isFavorite, true));
		}

		const orderColumn =
			orderBy === 'name' ? albums.name : orderBy === 'createdAt' ? albums.createdAt : albums.updatedAt;
		const orderDirection = orderDir === 'asc' ? asc : desc;

		const albumResults = await db.query.albums.findMany({
			where: conditions.length > 0 ? and(...conditions) : undefined,
			with: includeStatsFlag
				? {
						images: { columns: { id: true } },
						videos: { columns: { id: true } },
						collections: { columns: { id: true } },
						tags: { columns: { id: true } },
						characters: { columns: { id: true } },
						places: { columns: { id: true } },
						worldItems: { columns: { id: true } },
						concepts: { columns: { id: true } },
						prompts: { columns: { id: true } },
						notes: { columns: { id: true } },
						wildcards: { columns: { id: true } },
						properties: { columns: { id: true } },
						groups: { columns: { id: true } },
					}
				: undefined,
			orderBy: orderDirection(orderColumn),
			limit: limitNum,
		});

		const results: AlbumCardData[] = albumResults.map((album: any) => ({
			...album,
			stats: includeStatsFlag
				? {
						imageCount: album.images?.length || 0,
						videoCount: album.videos?.length || 0,
						collectionCount: album.collections?.length || 0,
						tagCount: album.tags?.length || 0,
						characterCount: album.characters?.length || 0,
						placeCount: album.places?.length || 0,
						worldItemCount: album.worldItems?.length || 0,
						conceptCount: album.concepts?.length || 0,
						promptCount: album.prompts?.length || 0,
						noteCount: album.notes?.length || 0,
						wildcardCount: album.wildcards?.length || 0,
						propertyCount: album.properties?.length || 0,
						groupCount: album.groups?.length || 0,
					}
				: {
						imageCount: 0,
						videoCount: 0,
						collectionCount: 0,
						tagCount: 0,
						characterCount: 0,
						placeCount: 0,
						worldItemCount: 0,
						conceptCount: 0,
						promptCount: 0,
						noteCount: 0,
						wildcardCount: 0,
						propertyCount: 0,
						groupCount: 0,
					},
		}));

		res.json(results);
	} catch (error) {
		albumLogger.error('Error getting albums for cards', { error });
		res.status(500).json({ error: 'Error interno del servidor' });
	}
}

/**
 * GET /api/albums/:id/recent-media - Obtiene medios recientes de album
 */
export async function getAlbumRecentMediaHandler(req: Request, res: Response) {
	try {
		const { id: albumId } = req.params;
		const { limit = '6' } = req.query;
		const limitNum = Number.parseInt(limit as string, 10);

		// Verificar que el álbum existe
		const album = await db.query.albums.findFirst({
			where: eq(albums.id, albumId),
		});

		if (!album) {
			res.status(404).json({ error: `Álbum no encontrado: ${albumId}` });
			return;
		}

		const media: ThumbnailImage[] = [];

		// Obtener imágenes recientes del álbum usando JOIN
		const recentImages = await db
			.select({
				id: images.id,
				name: images.name,
			})
			.from(images)
			.innerJoin(imageAlbums, eq(imageAlbums.A, images.id))
			.where(eq(imageAlbums.B, albumId))
			.orderBy(desc(images.updatedAt))
			.limit(Math.ceil(limitNum * 0.8));

		media.push(
			...recentImages.map(
				(img): ThumbnailImage => ({
					id: img.id,
					name: img.name,
					thumbnailUrl: `/api/thumbnails/${img.id}`,
					url: `/api/images/${img.id}`,
					isVideo: false,
				})
			)
		);

		// Obtener videos recientes del álbum usando JOIN
		const recentVideos = await db
			.select({
				id: videos.id,
				name: videos.name,
			})
			.from(videos)
			.innerJoin(videoAlbums, eq(videoAlbums.A, videos.id))
			.where(eq(videoAlbums.B, albumId))
			.orderBy(desc(videos.updatedAt))
			.limit(Math.ceil(limitNum * 0.2));

		media.push(
			...recentVideos.map(
				(video): ThumbnailImage => ({
					id: video.id,
					name: video.name,
					thumbnailUrl: `/api/video-thumbnails/${video.id}`,
					url: `/api/videos/${video.id}`,
					isVideo: true,
				})
			)
		);

		res.json(media.slice(0, limitNum));
	} catch (error) {
		albumLogger.error('Error getting recent album media', { error, albumId: req.params.id });
		res.status(500).json({ error: 'Error interno del servidor' });
	}
}

/**
 * GET /api/albums/:id/stats - Obtiene estadísticas de album
 */
export async function getAlbumStatsHandler(req: Request, res: Response) {
	try {
		const { id: albumId } = req.params;
		const stats = await getAlbumStats(albumId);
		res.json(stats);
	} catch (error) {
		albumLogger.error('Error getting album stats', { error, albumId: req.params.id });
		res.status(500).json({ error: 'Error interno del servidor' });
	}
}

/**
 * GET /api/albums/search - Búsqueda avanzada de albums
 */
export async function searchAlbumsHandler(req: Request, res: Response) {
	try {
		const {
			searchTerm,
			limit = '20',
			offset = '0',
			category,
			orderBy = 'updatedAt',
			orderDir = 'desc',
			includeStats = 'true',
		} = req.query;

		if (!searchTerm) {
			res.status(400).json({ error: 'searchTerm es requerido' });
			return;
		}

		const limitNum = Number.parseInt(limit as string, 10);
		const offsetNum = Number.parseInt(offset as string, 10);
		const includeStatsFlag = includeStats === 'true';

		const conditions = [or(like(albums.name, `%${searchTerm}%`), like(albums.description, `%${searchTerm}%`))];

		if (category) {
			conditions.push(eq(albums.category, category as string));
		}

		const orderColumn =
			orderBy === 'name' ? albums.name : orderBy === 'createdAt' ? albums.createdAt : albums.updatedAt;
		const orderDirection = orderDir === 'asc' ? asc : desc;

		const albumResults = await db.query.albums.findMany({
			where: and(...conditions),
			with: includeStatsFlag
				? {
						images: { columns: { id: true } },
						videos: { columns: { id: true } },
						collections: { columns: { id: true } },
						tags: { columns: { id: true } },
						characters: { columns: { id: true } },
						places: { columns: { id: true } },
						worldItems: { columns: { id: true } },
						concepts: { columns: { id: true } },
						prompts: { columns: { id: true } },
						notes: { columns: { id: true } },
						wildcards: { columns: { id: true } },
						properties: { columns: { id: true } },
						groups: { columns: { id: true } },
					}
				: undefined,
			orderBy: orderDirection(orderColumn),
			limit: limitNum,
			offset: offsetNum,
		});

		const results: AlbumCardData[] = albumResults.map((album: any) => ({
			...album,
			stats: includeStatsFlag
				? {
						imageCount: album.images?.length || 0,
						videoCount: album.videos?.length || 0,
						collectionCount: album.collections?.length || 0,
						tagCount: album.tags?.length || 0,
						characterCount: album.characters?.length || 0,
						placeCount: album.places?.length || 0,
						worldItemCount: album.worldItems?.length || 0,
						conceptCount: album.concepts?.length || 0,
						promptCount: album.prompts?.length || 0,
						noteCount: album.notes?.length || 0,
						wildcardCount: album.wildcards?.length || 0,
						propertyCount: album.properties?.length || 0,
						groupCount: album.groups?.length || 0,
					}
				: {
						imageCount: 0,
						videoCount: 0,
						collectionCount: 0,
						tagCount: 0,
						characterCount: 0,
						placeCount: 0,
						worldItemCount: 0,
						conceptCount: 0,
						promptCount: 0,
						noteCount: 0,
						wildcardCount: 0,
						propertyCount: 0,
						groupCount: 0,
					},
		}));

		res.json(results);
	} catch (error) {
		albumLogger.error('Error searching albums', { error });
		res.status(500).json({ error: 'Error interno del servidor' });
	}
}

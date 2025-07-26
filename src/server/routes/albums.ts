import { and, asc, count, desc, eq, inArray, like, or } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';
import { z } from 'zod';
import type { ExpressHandler } from '@/lib/express-types';
import { db } from '@/lib/drizzle';
import { albums, imageAlbums, images, videos } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { OptimizedStatsService } from '@/services/stats/optimized-stats.service';
import { serializeAlbum, toAlbumWithStats } from '@/transformers/album/index';
import type { AlbumWithStats } from '@/types/entities/album';

// Albums router loaded

/**
 * @file albums.ts
 * @description Rutas REST para gestión de albums.
 *  - GET    /api/albums         → Listar albums con filtros
 *  - GET    /api/albums/:id     → Obtener album específico
 *  - GET    /api/albums/:id/images → Obtener imágenes del album
 *  - POST   /api/albums         → Crear nuevo album
 *  - PUT    /api/albums/:id     → Actualizar album
 *  - DELETE /api/albums/:id     → Eliminar album
 *  - POST   /api/albums/:id/images/:imageId → Añadir imagen al album
 *  - DELETE /api/albums/:id/images/:imageId → Quitar imagen del album
 */

export const albumsRouter = express.Router();

// Schemas de validación
const AlbumFiltersSchema = z.object({
	search: z.string().optional(),
	limit: z.coerce.number().min(1).max(100).default(20),
	offset: z.coerce.number().min(0).default(0),
	sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('updatedAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const AlbumCreateSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().nullable().optional(),
	emoji: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	featuredImage: z.string().nullable().optional(),
	isPublic: z.boolean().default(false),
	isFavorite: z.boolean().default(false),
	totalImages: z.number().int().min(0).default(0),
	totalVideos: z.number().int().min(0).default(0),
	totalSize: z.number().int().min(0).default(0),
	filters: z.string().nullable().optional(),
	shortcut: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	metadata: z.string().nullable().optional(),
	lastImageAddedAt: z.date().nullable().optional(),
	lastVideoAddedAt: z.date().nullable().optional(),
	parentId: z.string().nullable().optional(),
});

const AlbumUpdateSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	description: z.string().nullable().optional(),
	emoji: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	featuredImage: z.string().nullable().optional(),
	isPublic: z.boolean().optional(),
	isFavorite: z.boolean().optional(),
	totalImages: z.number().int().min(0).optional(),
	totalVideos: z.number().int().min(0).optional(),
	totalSize: z.number().int().min(0).optional(),
	filters: z.string().nullable().optional(),
	shortcut: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	metadata: z.string().nullable().optional(),
	lastImageAddedAt: z.date().nullable().optional(),
	lastVideoAddedAt: z.date().nullable().optional(),
	parentId: z.string().nullable().optional(),
});

const albumLogger = serverLogger.withContext('AlbumsAPI');

interface AlbumCardData extends Omit<AlbumWithStats, 'filters' | 'metadata'> {
	recentImages?: string[];
	recentVideos?: string[];
	totalSize: number; // Make required to match expected type
	filters?: unknown[] | string;
	metadata?: {
		itemCount?: number;
		imageCount?: number;
		videoCount?: number;
		coverImageUrl?: string | null;
		thumbnailUrls?: string[];
		lastModified?: Date | string;
		entitiesCount?: number;
	} | null;
	viewConfig?: {
		theme?: string;
		layout?: string;
		thumbnailSize?: 'small' | 'medium' | 'large';
	};
}

interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
	isVideo?: boolean;
}

// GET /api/albums - Listar albums
const getAlbumsHandler: ExpressHandler = async (req: Request, res: Response) => {
	try {
		// Verificar si existen albums
		const albumCount = await db.select({ count: count() }).from(albums);

		if (albumCount[0].count === 0) {
			return res.json({
				data: [],
				pagination: { total: 0, limit: 0, offset: 0 },
				message: 'No hay albums disponibles',
			});
		}

		// Test básico con solo 1 album
		const simpleAlbums = await db.select().from(albums).limit(1);

		res.json({
			data: simpleAlbums,
			pagination: {
				total: albumCount[0].count,
				limit: 1,
				offset: 0,
			},
		});
	} catch (error) {
		console.error('Error en /api/albums:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			details: error instanceof Error ? error.message : 'Error desconocido'
		});
	}
};

albumsRouter.get('/', getAlbumsHandler);


// GET /api/albums/:id - Obtener album específico
const getAlbumByIdHandler: ExpressHandler = async (req, res) => {
	const { id } = req.params;

	try {
		const album = await db.query.albums.findFirst({
			where: eq(albums.id, id),
			with: {
				images: { columns: { id: true } },
			},
		});

		if (!album) {
			res.status(404).json({ error: 'Album no encontrado' });
			return;
		}

		const albumWithStats = toAlbumWithStats(album);
		res.json(serializeAlbum(albumWithStats));
	} catch (error) {
		console.error('Error obteniendo album:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
};

albumsRouter.get('/:id', getAlbumByIdHandler);

// GET /api/albums/:id/images - Obtener imágenes del album
const getAlbumImagesHandler: ExpressHandler = async (req, res) => {
	const { id } = req.params;

	try {
		const album = await db.query.albums.findFirst({
			where: eq(albums.id, id),
			with: {
				images: {
					with: {
						folder: true,
						tags: { columns: { id: true } },
						albums: { columns: { id: true } },
						collections: { columns: { id: true } },
						characters: { columns: { id: true } },
						places: { columns: { id: true } },
						worldItems: { columns: { id: true } },
						notes: { columns: { id: true } },
					},
				},
			},
		});

		if (!album) {
			res.status(404).json({ error: 'Album no encontrado' });; return;
		}

		// Serializar imágenes (usar serializeImage si existe)
		res.json(album.images);
	} catch (error) {
		console.error('Error obteniendo imágenes del album:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
};

albumsRouter.get('/:id/images', getAlbumImagesHandler);

// POST /api/albums - Crear album
const createAlbumHandler: ExpressHandler = async (req, res) => {
	const parse = AlbumCreateSchema.safeParse(req.body);
	if (!parse.success) {
		res.status(400).json({ error: 'Datos inválidos', details: parse.error.errors });; return;
	}

	try {
		const [newAlbum] = await db.insert(albums).values(parse.data).returning({
			id: albums.id,
			name: albums.name,
			description: albums.description,
			color: albums.color,
			isPublic: albums.isPublic,
			createdAt: albums.createdAt,
			updatedAt: albums.updatedAt,
			featuredImage: albums.featuredImage,
			shortcut: albums.shortcut,
			category: albums.category,
			filters: albums.filters,
		});

		if (!newAlbum) {
			res.status(500).json({ error: 'Error creando álbum' });; return;
		}

		// Para serializar el álbum, necesitamos las relaciones. Realizamos una nueva consulta.
		const album = await db.query.albums.findFirst({
			where: eq(albums.id, newAlbum.id),
			with: {
				images: { columns: { id: true } },
			},
		});

		if (!album) {
			res.status(500).json({ error: 'Error obteniendo álbum creado' });; return;
		}

		res.status(201).json(serializeAlbum(album));
	} catch (error) {
		console.error('Error creando album:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
};

albumsRouter.post('/', createAlbumHandler);

// PUT /api/albums/:id - Actualizar album
const updateAlbumHandler: ExpressHandler = async (req, res) => {
	const { id } = req.params;
	const parse = AlbumUpdateSchema.safeParse(req.body);

	if (!parse.success) {
		res.status(400).json({ error: 'Datos inválidos', details: parse.error.errors });; return;
	}

	try {
		const [updatedAlbum] = await db.update(albums).set(parse.data).where(eq(albums.id, id)).returning({
			id: albums.id,
			name: albums.name,
			description: albums.description,
			color: albums.color,
			isPublic: albums.isPublic,
			createdAt: albums.createdAt,
			updatedAt: albums.updatedAt,
			featuredImage: albums.featuredImage,
			shortcut: albums.shortcut,
			category: albums.category,
			filters: albums.filters,
		});

		if (!updatedAlbum) {
			res.status(404).json({ error: 'Album no encontrado' });; return;
		}

		// Para serializar el álbum, necesitamos las relaciones. Realizamos una nueva consulta.
		const album = await db.query.albums.findFirst({
			where: eq(albums.id, updatedAlbum.id),
			with: {
				images: { columns: { id: true } },
			},
		});

		if (!album) {
			res.status(500).json({ error: 'Error obteniendo álbum actualizado' });; return;
		}

		res.json(serializeAlbum(album));
	} catch (error) {
		console.error('Error actualizando album:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
};

albumsRouter.put('/:id', updateAlbumHandler);

// DELETE /api/albums/:id - Eliminar album
albumsRouter.delete('/:id', async (req, res) => {
	const { id } = req.params;

	try {
		await db.delete(albums).where(eq(albums.id, id));

		res.status(204).send();
	} catch (error) {
		console.error('Error eliminando album:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /api/albums/:id/images/:imageId - Añadir imagen al album
albumsRouter.post('/:id/images/:imageId', async (req, res) => {
	const { id, imageId } = req.params;

	try {
		await db.insert(imageAlbums).values({
			A: imageId, // imageId
			B: id, // albumId
		});

		res.status(204).send();
	} catch (error) {
		console.error('Error añadiendo imagen al album:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /api/albums/:id/images/:imageId - Quitar imagen del album
albumsRouter.delete('/:id/images/:imageId', async (req, res) => {
	const { id, imageId } = req.params;

	try {
		await db.delete(imageAlbums).where(and(eq(imageAlbums.A, imageId), eq(imageAlbums.B, id)));

		res.status(204).send();
	} catch (error) {
		console.error('Error quitando imagen del album:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

/**
 * GET /albums/:id/card-data
 * Obtiene los datos de un álbum para mostrar en una tarjeta
 */
albumsRouter.get('/:id/card-data', async (req, res) => {
	try {
		const { id: albumId } = req.params;

		const album = await db.query.albums.findFirst({
			where: eq(albums.id, albumId),
			with: {
				images: {
					columns: { id: true },
				},
				videos: {
					columns: { id: true },
				},
				collections: {
					columns: { id: true },
				},
				tags: {
					columns: { id: true },
				},
				characters: {
					columns: { id: true },
				},
				places: {
					columns: { id: true },
				},
				worldItems: {
					columns: { id: true },
				},
				concepts: {
					columns: { id: true },
				},
				prompts: {
					columns: { id: true },
				},
				notes: {
					columns: { id: true },
				},
				wildcards: {
					columns: { id: true },
				},
				properties: {
					columns: { id: true },
				},
				groups: {
					columns: { id: true },
				},
			},
		});

		if (!album) {
			res.status(404).json({ error: `Álbum no encontrado: ${albumId}` });; return;
		}

		// Obtener imágenes recientes relacionadas con este álbum
		const recentImages = await db.query.images.findMany({
			where: inArray(
				images.id,
				album.images.map((img: any) => img.id)
			),
			columns: {
				id: true,
				path: true,
				thumbnailWidth: true,
				thumbnailHeight: true,
			},
			orderBy: desc(images.updatedAt),
			limit: 6,
		});

		const recentImagePaths = recentImages.map((img: any) => `/api/thumbnails/${img.id}`);

		// Obtener videos recientes relacionados con este álbum
		const recentVideos = await db.query.videos.findMany({
			where: inArray(
				videos.id,
				album.videos.map((vid: any) => vid.id)
			),
			columns: {
				id: true,
				path: true,
				thumbnailWidth: true,
				thumbnailHeight: true,
			},
			orderBy: desc(videos.updatedAt),
			limit: 3,
		});

		const recentVideoPaths = recentVideos.map((video: any) => `/api/video-thumbnails/${video.id}`);

		// Intentar parsear el campo filters si existe
		let filters = [];
		if (typeof album.filters === 'string' && album.filters !== 'empty_array') {
			try {
				filters = JSON.parse(album.filters);
			} catch (e) {
				filters = [];
			}
		}

		// Calcular el tamaño total de las imágenes y videos en el álbum
		const { totalSize, imageCount, videoCount, entitiesCount } = await getAlbumStats(albumId);

		// Crear objeto de metadata
		const metadata = {
			itemCount: imageCount + videoCount,
			imageCount,
			videoCount,
			lastModified: album.updatedAt,
			coverImageUrl: album.featuredImage ? `/api/images/${album.featuredImage}` : null,
			thumbnailUrls: recentImagePaths.slice(0, 3),
			entitiesCount,
		};

		// Crear viewConfig básico
		const viewConfig = {
			theme: 'default',
			layout: 'grid',
			thumbnailSize: 'medium' as 'small' | 'medium' | 'large',
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
});

/**
 * GET /albums/cards
 * Obtiene una lista de álbumes para mostrar en una galería de tarjetas
 */
albumsRouter.get('/cards', async (req, res) => {
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

		// Filtros
		if (category) {
			conditions.push(eq(albums.category, category as string));
		}

		if (searchTerm) {
			conditions.push(or(like(albums.name, `%${searchTerm}%`), like(albums.description, `%${searchTerm}%`)));
		}

		if (isFavorite === 'true') {
			conditions.push(eq(albums.isFavorite, true));
		}

		// Ordenamiento
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

		// Transformar resultados a AlbumCardData
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
});

/**
 * GET /albums/:id/recent-media
 * Obtiene medios recientes de un álbum
 */
albumsRouter.get('/:id/recent-media', async (req, res) => {
	try {
		const { id: albumId } = req.params;
		const { limit = '6' } = req.query;
		const limitNum = Number.parseInt(limit as string, 10);

		const album = await db.query.albums.findFirst({
			where: eq(albums.id, albumId),
			with: {
				images: { columns: { id: true } },
				videos: { columns: { id: true } },
			},
		});

		if (!album) {
			res.status(404).json({ error: `Álbum no encontrado: ${albumId}` });; return;
		}

		const media: ThumbnailImage[] = [];

		// Obtener imágenes recientes
		if (album.images.length > 0) {
			const recentImages = await db.query.images.findMany({
				where: inArray(
					images.id,
					album.images.map((img: any) => img.id)
				),
				columns: {
					id: true,
					name: true,
					path: true,
				},
				orderBy: desc(images.updatedAt),
				limit: Math.ceil(limitNum * 0.8), // 80% para imágenes
			});

			media.push(
				...recentImages.map(
					(img: any): ThumbnailImage => ({
						id: img.id,
						name: img.name,
						thumbnailUrl: `/api/thumbnails/${img.id}`,
						url: `/api/images/${img.id}`,
						isVideo: false,
					})
				)
			);
		}

		// Obtener videos recientes
		if (album.videos.length > 0) {
			const recentVideos = await db.query.videos.findMany({
				where: inArray(
					videos.id,
					album.videos.map((vid: any) => vid.id)
				),
				columns: {
					id: true,
					name: true,
					path: true,
				},
				orderBy: desc(videos.updatedAt),
				limit: Math.ceil(limitNum * 0.2), // 20% para videos
			});

			media.push(
				...recentVideos.map(
					(video: any): ThumbnailImage => ({
						id: video.id,
						name: video.name,
						thumbnailUrl: `/api/video-thumbnails/${video.id}`,
						url: `/api/videos/${video.id}`,
						isVideo: true,
					})
				)
			);
		}

		// Limitar el resultado final
		const result = media.slice(0, limitNum);
		res.json(result);
	} catch (error) {
		albumLogger.error('Error getting recent album media', { error, albumId: req.params.id });
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

/**
 * GET /albums/:id/stats
 * Obtiene estadísticas de un álbum
 */
albumsRouter.get('/:id/stats', async (req, res) => {
	try {
		const { id: albumId } = req.params;
		const stats = await getAlbumStats(albumId);
		res.json(stats);
	} catch (error) {
		albumLogger.error('Error getting album stats', { error, albumId: req.params.id });
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

/**
 * GET /albums/search
 * Busca álbumes con filtros avanzados
 */
albumsRouter.get('/search', async (req, res) => {
	try {
		const {
			searchTerm,
			limit = '20',
			offset = '0',
			category,
			orderBy = 'updatedAt',
			orderDir = 'desc',
			includeHidden = 'false',
			includeStats = 'true',
		} = req.query;

		if (!searchTerm) {
			res.status(400).json({ error: 'searchTerm es requerido' });; return;
		}

		const limitNum = Number.parseInt(limit as string, 10);
		const offsetNum = Number.parseInt(offset as string, 10);
		const includeStatsFlag = includeStats === 'true';
		const includeHiddenFlag = includeHidden === 'true';

		const conditions = [or(like(albums.name, `%${searchTerm}%`), like(albums.description, `%${searchTerm}%`))];

		if (category) {
			conditions.push(eq(albums.category, category as string));
		}

		// Note: isHidden column doesn't exist in albums table
		// if (!includeHiddenFlag) {
		//	conditions.push(eq(albums.isHidden, false));
		// }

		// Ordenamiento
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

		// Transformar resultados
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
});

/**
 * Helper function para obtener estadísticas de un álbum
 */
async function getAlbumStats(albumId: string): Promise<{
	imageCount: number;
	videoCount: number;
	totalSize: number;
	entitiesCount: number;
}> {
	try {
		const stats = await OptimizedStatsService.getInstance().getAlbumStatsOptimized(albumId);
		return {
			imageCount: stats.imageCount || 0,
			videoCount: stats.videoCount || 0,
			totalSize: stats.totalSize || 0,
			entitiesCount: stats.entitiesCount || 0,
		};
	} catch (error) {
		albumLogger.error('Error getting album stats from OptimizedStatsService', { error, albumId });
		return {
			imageCount: 0,
			videoCount: 0,
			totalSize: 0,
			entitiesCount: 0,
		};
	}
}

// Middleware de captura de errores específico para albums (debe ir al final)
albumsRouter.use((error: any, req: any, res: any, next: any) => {
	console.error('🚨 [ALBUMS ERROR MIDDLEWARE] Error capturado:', error);
	console.error('🚨 [ALBUMS ERROR MIDDLEWARE] Stack:', error.stack);
	console.error('🚨 [ALBUMS ERROR MIDDLEWARE] Message:', error.message);
	console.error('🚨 [ALBUMS ERROR MIDDLEWARE] URL:', req.url);
	console.error('🚨 [ALBUMS ERROR MIDDLEWARE] Method:', req.method);
	res.status(500).json({ error: 'Error interno del servidor en albums' });
});

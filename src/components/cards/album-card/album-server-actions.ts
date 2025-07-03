'use server';

import { db } from '@/lib/drizzle';
import { albums, images, videos } from '@/lib/drizzle/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { serverLogger } from '@/lib/logger/server-logger';
import { OptimizedStatsService } from '@/services/stats/optimized-stats.service';
import type { AlbumWithStats } from '@/types/entities/album';

const _albumLogger = serverLogger.withContext('AlbumServerActions');

export interface AlbumCardData extends Omit<AlbumWithStats, 'filters'> {
	recentImages?: string[];
	recentVideos?: string[];
	totalSize?: number; // Tamaño total de los archivos
	filters?: unknown[] | string; // Puede ser array o string JSON
	metadata?: {
		itemCount?: number;
		imageCount?: number;
		videoCount?: number;
		coverImageUrl?: string | null;
		thumbnailUrls?: string[];
		lastModified?: Date | string;
		entitiesCount?: number;
	};
	viewConfig?: {
		theme?: string;
		layout?: string;
		thumbnailSize?: 'small' | 'medium' | 'large';
	};
}

/**
 * Obtiene los datos de un álbum para mostrar en una tarjeta
 */
export async function getAlbumCardData(albumId: string): Promise<AlbumCardData> {
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
		throw new Error(`Álbum no encontrado: ${albumId}`);
	}

	// Obtener imágenes recientes relacionadas con este álbum
	const recentImages = await db.query.images.findMany({
		where: inArray(images.id, album.images.map((img) => img.id)),
		columns: {
			id: true,
			path: true,
			thumbnailWidth: true,
			thumbnailHeight: true,
		},
		orderBy: images.updatedAt,
		limit: 6,
	});

	const recentImagePaths = recentImages.map((img) => {
		// Convertir la ruta del sistema a una URL para el navegador
		const imagePath = `/api/thumbnails/${img.id}`;
		return imagePath;
	});

	// Obtener videos recientes relacionados con este álbum
	const recentVideos = await db.query.videos.findMany({
		where: inArray(videos.id, album.videos.map((vid) => vid.id)),
		columns: {
			id: true,
			path: true,
			thumbnailWidth: true,
			thumbnailHeight: true,
		},
		orderBy: videos.updatedAt,
		limit: 3,
	});

	const recentVideoPaths = recentVideos.map((video) => {
		// Convertir la ruta del sistema a una URL para el navegador
		const videoPath = `/api/video-thumbnails/${video.id}`;
		return videoPath;
	});

	// Intentar parsear el campo filters si existe
	let filters = [];
	if (typeof album.filters === 'string' && album.filters !== 'empty_array') {
		try {
			filters = JSON.parse(album.filters);
		} catch (e) {
			// Error parsing filters - use empty array
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

	return {
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
}

/**
 * Obtiene una lista de álbumes para mostrar en una galería de tarjetas
 */
export async function getAlbumsForCards(options: {
	limit?: number;
	category?: string;
	searchTerm?: string;
	orderBy?: 'name' | 'updatedAt' | 'createdAt';
	orderDir?: 'asc' | 'desc';
	isFavorite?: boolean;
	includeStats?: boolean;
}) {
	const {
		limit = 20,
		category,
		searchTerm,
		orderBy = 'updatedAt',
		orderDir = 'desc',
		isFavorite,
		includeStats = false,
	} = options;

	const whereConditions = [];
	if (category) {
		whereConditions.push(eq(albums.category, category));
	}
	if (isFavorite !== undefined) {
		whereConditions.push(eq(albums.isFavorite, isFavorite));
	}
	if (searchTerm) {
		whereConditions.push(
			or(
				like(albums.name, `%${searchTerm}%`),
				like(albums.description, `%${searchTerm}%`),
			),
		);
	}

	const orderByColumn = albums[orderBy];
	const orderByClause = orderDir === 'desc' ? desc(orderByColumn) : asc(orderByColumn);

	const albumsData = await db.query.albums.findMany({
		where: and(...whereConditions),
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
		orderBy: orderByClause,
		limit: limit,
	});

	// Si se solicitan estadísticas adicionales, cargarlas para cada álbum
	if (includeStats) {
		const albumsWithStats = await Promise.all(
			albumsData.map(async (album) => {
				const { totalSize, imageCount, videoCount, entitiesCount } = await getAlbumStats(album.id);

				// Obtener algunas imágenes y videos recientes para mostrar en la tarjeta
				const recentMedia = await getRecentAlbumMedia(album.id, 4);
				const recentImagePaths = recentMedia.filter((media) => !media.isVideo).map((media) => media.thumbnailUrl);
				const recentVideoPaths = recentMedia.filter((media) => media.isVideo).map((media) => media.thumbnailUrl);

				// Crear objeto de metadata
				const metadata = {
					itemCount: imageCount + videoCount,
					imageCount,
					videoCount,
					entitiesCount,
					lastModified: album.updatedAt,
					coverImageUrl: album.featuredImage ? `/api/images/${album.featuredImage}` : null,
					thumbnailUrls: recentImagePaths.slice(0, 3),
				};

				// Parsear filtros si es necesario
				let filters = [];
				if (typeof album.filters === 'string' && album.filters !== 'empty_array') {
					try {
						filters = JSON.parse(album.filters);
					} catch (e) {
						// Error parsing filters - use empty array
						filters = [];
					}
				}

				// Crear viewConfig básico (sin campos que no existen en Prisma)
				const viewConfig = {
					theme: 'default',
					layout: 'grid',
					thumbnailSize: 'medium' as 'small' | 'medium' | 'large',
				};

				return {
					...album,
					recentImages: recentImagePaths,
					recentVideos: recentVideoPaths,
					totalSize,
					filters,
					metadata,
					viewConfig,
				};
			})
		);

		return albumsWithStats;
	}

	return albumsData;
}

// Interfaz para las imágenes thumbnail
interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
	isVideo?: boolean;
}

/**
 * Obtiene las imágenes y videos recientes de un álbum para mostrar en la tarjeta
 */
export async function getRecentAlbumMedia(albumId: string, limit = 6): Promise<ThumbnailImage[]> {
	// Cargar imágenes recientes
	const recentImages = await db.query.images.findMany({
		where: eq(images.albumId, albumId),
		columns: {
			id: true,
			name: true,
			path: true,
		},
		orderBy: images.updatedAt,
		limit: Math.ceil(limit / 2),
	});

	// Cargar videos recientes
	const recentVideos = await db.query.videos.findMany({
		where: eq(videos.albumId, albumId),
		columns: {
			id: true,
			name: true,
			path: true,
		},
		orderBy: videos.updatedAt,
		limit: Math.floor(limit / 2),
	});

	// Combinar y formatear los resultados
	const imageResults: ThumbnailImage[] = recentImages.map((img) => ({
		id: img.id,
		name: img.name,
		thumbnailUrl: `/api/thumbnails/${img.id}`,
		url: `/api/images/${img.id}`,
		isVideo: false,
	}));

	const videoResults: ThumbnailImage[] = recentVideos.map((video) => ({
		id: video.id,
		name: video.name,
		thumbnailUrl: `/api/video-thumbnails/${video.id}`,
		url: `/api/videos/${video.id}`,
		isVideo: true,
	}));

	// Combinar y ordenar por ID (como proxy de fecha)
	return [...imageResults, ...videoResults].sort((a, b) => (a.id > b.id ? -1 : 1)).slice(0, limit);
}

/**
 * 🚀 Obtiene estadísticas de un álbum con consultas optimizadas
 */
export async function getAlbumStats(albumId: string): Promise<{
	imageCount: number;
	videoCount: number;
	totalSize: number;
	entitiesCount: number;
}> {
	// 🚀 Usar servicio optimizado - una consulta en lugar de 15+
			const optimizedStatsService = OptimizedStatsService.getInstance();
	const stats = await optimizedStatsService.getAlbumStatsOptimized(albumId);

	return {
		imageCount: stats.imageCount,
		videoCount: stats.videoCount,
		totalSize: stats.totalSize,
		entitiesCount: stats.entitiesCount,
	};
}

/**
 * Busca álbumes con opciones de filtrado avanzadas
 */
export async function searchAlbums(options: {
	searchTerm: string;
	limit?: number;
	offset?: number;
	category?: string;
	orderBy?: 'name' | 'updatedAt' | 'createdAt';
	orderDir?: 'asc' | 'desc';
	includeHidden?: boolean;
	includeStats?: boolean;
}) {
	const {
		searchTerm,
		limit = 20,
		offset = 0,
		category,
		orderBy = 'updatedAt',
		orderDir = 'desc',
		includeHidden = false,
		includeStats = false,
	} = options;

	const whereConditions = [];
	if (category) {
		whereConditions.push(eq(albums.category, category));
	}
	if (!includeHidden) {
		whereConditions.push(eq(albums.isHidden, false));
	}
	if (searchTerm) {
		whereConditions.push(
			or(
				like(albums.name, `%${searchTerm}%`),
				like(albums.description, `%${searchTerm}%`),
				like(albums.category, `%${searchTerm}%`),
				like(albums.shortcut, `%${searchTerm}%`),
			),
		);
	}

	const orderByColumn = albums[orderBy];
	const orderByClause = orderDir === 'desc' ? desc(orderByColumn) : asc(orderByColumn);

	// Consulta de álbumes
	const albumsData = await db.query.albums.findMany({
		where: and(...whereConditions),
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
		orderBy: orderByClause,
		offset: offset,
		limit: limit,
	});

	// Obtener el conteo total para paginación
	const totalCount = await db.select({ count: count() }).from(albums).where(and(...whereConditions));

	// Agregar estadísticas si se solicitan
	if (includeStats) {
		const albumsWithStats = await Promise.all(
			albumsData.map(async (album) => {
				const stats = await getAlbumStats(album.id);

				// Obtener algunas imágenes y videos recientes para mostrar en la tarjeta
				const recentMedia = await getRecentAlbumMedia(album.id, 4);

				// Simplificar respuesta para reducir tamaño
				return {
					...album,
					stats,
					recentMedia,
				};
			})
		);

		return {
			albums: albumsWithStats,
			totalCount: totalCount[0].count,
			hasMore: offset + albumsData.length < totalCount[0].count,
		};
	}

	return {
		albums: albumsData,
		totalCount: totalCount[0].count,
		hasMore: offset + albumsData.length < totalCount[0].count,
	};
}

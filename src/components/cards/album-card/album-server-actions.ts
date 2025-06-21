'use server';

import { getPrismaClient } from '@/lib/db';
import { serverLogger } from '@/lib/logger/server-logger';
import { OptimizedStatsService } from '@/services/stats/optimized-stats.service';
import type { AlbumWithStats } from '@/types/entities/album';

const _albumLogger = serverLogger.withContext('AlbumServerActions');

export interface AlbumCardData extends AlbumWithStats {
	recentImages?: string[];
	recentVideos?: string[];
	totalSize?: number; // Tamaño total de los archivos
	filters?: any[]; // Representación JSON de filters
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
	const prisma = await getPrismaClient();

	const album = await prisma.album.findUnique({
		where: {
			id: albumId,
		},
		include: {
			_count: {
				select: {
					images: true,
					videos: true,
					collections: true,
					tags: true,
					characters: true,
					places: true,
					worldItems: true,
					concepts: true,
					prompts: true,
					notes: true,
					wildcards: true,
					properties: true,
					groups: true,
				},
			},
		},
	});

	if (!album) {
		throw new Error(`Álbum no encontrado: ${albumId}`);
	}

	// Obtener imágenes recientes relacionadas con este álbum
	const recentImages = await prisma.image.findMany({
		where: {
			albums: {
				some: {
					id: albumId,
				},
			},
		},
		select: {
			id: true,
			path: true,
			thumbnailWidth: true,
			thumbnailHeight: true,
		},
		orderBy: {
			updatedAt: 'desc',
		},
		take: 6,
	});

	const recentImagePaths = recentImages.map((img: { id: string }) => {
		// Convertir la ruta del sistema a una URL para el navegador
		const imagePath = `/api/thumbnails/${img.id}`;
		return imagePath;
	});

	// Obtener videos recientes relacionados con este álbum
	const recentVideos = await prisma.video.findMany({
		where: {
			albums: {
				some: {
					id: albumId,
				},
			},
		},
		select: {
			id: true,
			path: true,
			thumbnailWidth: true,
			thumbnailHeight: true,
		},
		orderBy: {
			updatedAt: 'desc',
		},
		take: 3,
	});

	const recentVideoPaths = recentVideos.map((video: { id: string }) => {
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
			console.error('Error parsing album filters:', e);
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

	const prisma = await getPrismaClient();

	// Construir la consulta base
	const albums = await prisma.album.findMany({
		where: {
			...(category ? { category } : {}),
			...(isFavorite !== undefined ? { isFavorite } : {}),
			...(searchTerm
				? {
						OR: [{ name: { contains: searchTerm } }, { description: { contains: searchTerm } }],
					}
				: {}),
		},
		include: {
			_count: {
				select: {
					images: true,
					videos: true,
					collections: true,
					tags: true,
					characters: true,
					places: true,
					worldItems: true,
					concepts: true,
					prompts: true,
					notes: true,
					wildcards: true,
					properties: true,
					groups: true,
				},
			},
		},
		orderBy: {
			[orderBy]: orderDir,
		},
		take: limit,
	});

	// Si se solicitan estadísticas adicionales, cargarlas para cada álbum
	if (includeStats) {
		const albumsWithStats = await Promise.all(
			albums.map(async (album) => {
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
						console.error('Error parsing album filters for album:', album.id, e);
					}
				}

				// Crear viewConfig
				const viewConfig = {
					theme: album.theme || 'default',
					layout: album.layout || 'grid',
					thumbnailSize: (album.thumbnailSize as 'small' | 'medium' | 'large') || 'medium',
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

	return albums;
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
	const prisma = await getPrismaClient();

	// Cargar imágenes recientes
	const recentImages = await prisma.image.findMany({
		where: {
			albums: {
				some: {
					id: albumId,
				},
			},
		},
		select: {
			id: true,
			name: true,
			path: true,
		},
		orderBy: {
			updatedAt: 'desc',
		},
		take: Math.ceil(limit / 2),
	});

	// Cargar videos recientes
	const recentVideos = await prisma.video.findMany({
		where: {
			albums: {
				some: {
					id: albumId,
				},
			},
		},
		select: {
			id: true,
			name: true,
			path: true,
		},
		orderBy: {
			updatedAt: 'desc',
		},
		take: Math.floor(limit / 2),
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
	const prisma = await getPrismaClient();

	// 🚀 Usar servicio optimizado - una consulta en lugar de 15+
	const optimizedStatsService = OptimizedStatsService.getInstance(prisma);
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

	const prisma = await getPrismaClient();

	// Construir filtros
	const whereClause: any = {
		...(category ? { category } : {}),
		...(includeHidden ? {} : { isHidden: false }),
		...(searchTerm
			? {
					OR: [
						{ name: { contains: searchTerm } },
						{ description: { contains: searchTerm } },
						{ category: { contains: searchTerm } },
						{ shortcut: { contains: searchTerm } },
					],
				}
			: {}),
	};

	// Consulta de álbumes
	const albums = await prisma.album.findMany({
		where: whereClause,
		include: {
			_count: {
				select: {
					images: true,
					videos: true,
					collections: true,
					tags: true,
					characters: true,
					places: true,
					worldItems: true,
					concepts: true,
					prompts: true,
					notes: true,
					wildcards: true,
					properties: true,
					groups: true,
				},
			},
		},
		orderBy: {
			[orderBy]: orderDir,
		},
		skip: offset,
		take: limit,
	});

	// Obtener el conteo total para paginación
	const totalCount = await prisma.album.count({
		where: whereClause,
	});

	// Agregar estadísticas si se solicitan
	if (includeStats) {
		const albumsWithStats = await Promise.all(
			albums.map(async (album) => {
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
			totalCount,
			hasMore: offset + albums.length < totalCount,
		};
	}

	return {
		albums,
		totalCount,
		hasMore: offset + albums.length < totalCount,
	};
}

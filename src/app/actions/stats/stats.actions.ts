'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { unstable_cache } from 'next/cache';

// Constantes para caché
const STATS_CACHE_TAG = 'stats';
const STATS_REVALIDATE_SECONDS = 60; // 1 minuto

// Logger para estadísticas
const statsLogger = serverLogger.withContext('StatsActions');

// Manejo de errores - enfoque funcional
enum StatsErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
}

const createStatsError = (message: string, code: StatsErrorCode = StatsErrorCode.OPERATION_FAILED, cause?: unknown) => {
	const error = new Error(message);
	error.name = 'StatsError';
	Object.assign(error, { code, cause });
	return error;
};

// Interfaces
export interface GeneralStats {
	totalImages: number;
	totalFolders: number;
	totalTags: number;
	totalCollections: number;
	totalAlbums: number;
	totalCharacters: number;
	totalPlaces: number;
	totalWorldItems: number;
	totalFavorites: number;
	totalViews: number;
	totalDownloads: number;
	totalSize: number;
	totalActivities: number;
	topTags: Array<{
		id: string;
		name: string;
		color: string;
		count: number;
	}>;
	recentActivity: Array<{
		id: string;
		type: string;
		description: string;
		createdAt: Date;
		image: {
			id: string;
			name: string;
			thumbnail: Uint8Array | null;
		} | null;
	}>;
}

export interface StatsResponse {
	collections: Array<{
		id: string;
		name: string;
		count: number;
		color?: string;
		emoji?: string;
	}>;
	folders: Array<{
		id: string;
		name: string;
		count: number;
	}>;
	tags: Array<{
		id: string;
		name: string;
		count: number;
		color: string;
	}>;
	albums: Array<{
		id: string;
		name: string;
		count: number;
		emoji: string;
	}>;
	characters: Array<{
		id: string;
		name: string;
		count: number;
		emoji: string;
	}>;
	places: Array<{
		id: string;
		name: string;
		count: number;
		emoji: string;
	}>;
	worldItems: Array<{
		id: string;
		name: string;
		count: number;
		emoji: string;
	}>;
}

// Tipo para las etiquetas populares
interface TopTag {
	id: string;
	name: string;
	color: string;
	_count: {
		images: number;
	};
}

// Funciones exportadas
export async function getSystemStats(): Promise<GeneralStats | null> {
	const cachedStats = unstable_cache(
		async () => {
			try {
				statsLogger.info('📊 Obteniendo estadísticas del sistema');

				const [
					totalImages,
					totalFolders,
					totalCollections,
					totalTags,
					totalAlbums,
					totalCharacters,
					totalPlaces,
					totalWorldItems,
					totalActivities,
					totalSize,
					totalViews,
					totalDownloads,
					topTags,
					recentActivity,
				] = await Promise.all([
					prisma.image.count(),
					prisma.folder.count(),
					prisma.collection.count(),
					prisma.tag.count(),
					prisma.album.count(),
					prisma.character.count(),
					prisma.place.count(),
					prisma.worldItem.count(),
					prisma.activity.count(),
					prisma.folder.aggregate({
						_sum: {
							totalSize: true,
						},
					}),
					prisma.imageStats.aggregate({
						_sum: {
							views: true,
						},
					}),
					prisma.imageStats.aggregate({
						_sum: {
							downloads: true,
						},
					}),
					prisma.tag.findMany({
						select: {
							id: true,
							name: true,
							color: true,
							_count: {
								select: {
									images: true,
								},
							},
						},
						orderBy: {
							images: {
								_count: 'desc',
							},
						},
						take: 5,
					}) as Promise<TopTag[]>,
					prisma.activity.findMany({
						select: {
							id: true,
							type: true,
							description: true,
							createdAt: true,
							image: {
								select: {
									id: true,
									name: true,
									thumbnail: true,
								},
							},
						},
						orderBy: {
							createdAt: 'desc',
						},
						take: 5,
					}),
				]);

				// Calcular total de favoritos
				const totalFavorites = await prisma.image.count({
					where: {
						isFavorite: true,
					},
				});

				statsLogger.info('✅ Estadísticas del sistema obtenidas');

				return {
					totalImages,
					totalFolders,
					totalCollections,
					totalTags,
					totalAlbums,
					totalCharacters,
					totalPlaces,
					totalWorldItems,
					totalFavorites,
					totalActivities,
					totalSize: totalSize._sum.totalSize || 0,
					totalViews: totalViews._sum.views || 0,
					totalDownloads: totalDownloads._sum.downloads || 0,
					topTags: topTags.map((tag: TopTag) => ({
						...tag,
						count: tag._count.images,
					})),
					recentActivity,
				} satisfies GeneralStats;
			} catch (error) {
				statsLogger.error('❌ Error al obtener las estadísticas del sistema:', error);
				return null;
			}
		},
		['system-stats'],
		{
			revalidate: STATS_REVALIDATE_SECONDS,
			tags: [STATS_CACHE_TAG],
		}
	);

	return cachedStats();
}

// Interfaces para los mapeos de datos
interface EntityWithImageCount {
	id: string;
	name: string;
	_count: {
		images: number;
	};
}

interface CollectionWithData extends EntityWithImageCount {
	color: string;
	emoji: string;
}

interface TagWithData extends EntityWithImageCount {
	color: string;
}

interface EntityWithEmoji extends EntityWithImageCount {
	emoji: string;
}

export async function getStats(): Promise<StatsResponse | null> {
	const cachedStats = unstable_cache(
		async () => {
			try {
				statsLogger.info('📊 Obteniendo estadísticas detalladas');

				const [collections, folders, tags, albums, characters, places, worldItems] = await Promise.all([
					prisma.collection.findMany({
						select: {
							id: true,
							name: true,
							color: true,
							emoji: true,
							_count: {
								select: {
									images: true,
								},
							},
						},
					}) as Promise<CollectionWithData[]>,
					prisma.folder.findMany({
						select: {
							id: true,
							name: true,
							_count: {
								select: {
									images: true,
								},
							},
						},
					}) as Promise<EntityWithImageCount[]>,
					prisma.tag.findMany({
						select: {
							id: true,
							name: true,
							color: true,
							_count: {
								select: {
									images: true,
								},
							},
						},
					}) as Promise<TagWithData[]>,
					prisma.album.findMany({
						select: {
							id: true,
							name: true,
							emoji: true,
							_count: {
								select: {
									images: true,
								},
							},
						},
					}) as Promise<EntityWithEmoji[]>,
					prisma.character.findMany({
						select: {
							id: true,
							name: true,
							emoji: true,
							_count: {
								select: {
									images: true,
								},
							},
						},
					}) as Promise<EntityWithEmoji[]>,
					prisma.place.findMany({
						select: {
							id: true,
							name: true,
							emoji: true,
							_count: {
								select: {
									images: true,
								},
							},
						},
					}) as Promise<EntityWithEmoji[]>,
					prisma.worldItem.findMany({
						select: {
							id: true,
							name: true,
							emoji: true,
							_count: {
								select: {
									images: true,
								},
							},
						},
					}) as Promise<EntityWithEmoji[]>,
				]);

				statsLogger.info('✅ Estadísticas detalladas obtenidas');

				return {
					collections: collections.map((c: CollectionWithData) => ({
						id: c.id,
						name: c.name,
						count: c._count.images,
						color: c.color,
						emoji: c.emoji,
					})),
					folders: folders.map((f: EntityWithImageCount) => ({
						id: f.id,
						name: f.name,
						count: f._count.images,
					})),
					tags: tags.map((t: TagWithData) => ({
						id: t.id,
						name: t.name,
						count: t._count.images,
						color: t.color,
					})),
					albums: albums.map((a: EntityWithEmoji) => ({
						id: a.id,
						name: a.name,
						count: a._count.images,
						emoji: a.emoji,
					})),
					characters: characters.map((c: EntityWithEmoji) => ({
						id: c.id,
						name: c.name,
						count: c._count.images,
						emoji: c.emoji,
					})),
					places: places.map((p: EntityWithEmoji) => ({
						id: p.id,
						name: p.name,
						count: p._count.images,
						emoji: p.emoji,
					})),
					worldItems: worldItems.map((o: EntityWithEmoji) => ({
						id: o.id,
						name: o.name,
						count: o._count.images,
						emoji: o.emoji,
					})),
				} satisfies StatsResponse;
			} catch (error) {
				statsLogger.error('❌ Error al obtener las estadísticas:', error);
				return null;
			}
		},
		['stats'],
		{
			revalidate: STATS_REVALIDATE_SECONDS,
			tags: [STATS_CACHE_TAG],
		}
	);

	return cachedStats();
}

export async function invalidateStats(): Promise<void> {
	statsLogger.info('🔄 Invalidando caché de estadísticas');
	revalidatePath('/stats');
	statsLogger.info('✅ Caché de estadísticas invalidada');
}

export async function getImageStats(imageId: string) {
	try {
		statsLogger.info('🔍 Obteniendo estadísticas de imagen:', imageId);

		let stats = await prisma.imageStats.findUnique({
			where: { imageId },
		});

		if (!stats) {
			statsLogger.info('➕ Creando estadísticas para imagen:', imageId);
			stats = await prisma.imageStats.create({
				data: {
					imageId,
					views: 0,
					downloads: 0,
					lastViewed: new Date(),
				},
			});
		}

		statsLogger.info('✅ Estadísticas de imagen obtenidas');
		return stats;
	} catch (error) {
		statsLogger.error('❌ Error al obtener estadísticas de imagen:', error);
		throw createStatsError(
			'No se pudieron obtener las estadísticas de la imagen',
			StatsErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function incrementImageView(imageId: string) {
	try {
		statsLogger.info('👁️ Incrementando visualización de imagen:', imageId);

		const stats = await prisma.imageStats.update({
			where: { imageId },
			data: {
				views: { increment: 1 },
				lastViewed: new Date(),
			},
		});

		statsLogger.info('✅ Visualización de imagen incrementada');
		revalidatePath('/stats');
		return stats;
	} catch (error) {
		statsLogger.error('❌ Error al incrementar visualización de imagen:', error);
		throw createStatsError(
			'No se pudo incrementar la visualización de la imagen',
			StatsErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function incrementImageDownload(imageId: string) {
	try {
		statsLogger.info('⬇️ Incrementando descarga de imagen:', imageId);

		const stats = await prisma.imageStats.update({
			where: { imageId },
			data: {
				downloads: { increment: 1 },
			},
		});

		statsLogger.info('✅ Descarga de imagen incrementada');
		revalidatePath('/stats');
		return stats;
	} catch (error) {
		statsLogger.error('❌ Error al incrementar descarga de imagen:', error);
		throw createStatsError('No se pudo incrementar la descarga de la imagen', StatsErrorCode.OPERATION_FAILED, error);
	}
}

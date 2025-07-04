import { asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import {
	activities,
	albums,
	characters,
	collections,
	folders,
	imageStats,
	images,
	places,
	tags,
	worldItems,
} from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { MOCK_STATS, USE_MOCK_STATS } from '@/lib/mock/stats.mock';
import { revalidatePath } from '@/lib/server/revalidate';
import { OptimizedStatsService } from '@/services/stats/optimized-stats.service';

// Constantes para caché
const STATS_CACHE_TAG = 'stats';
const STATS_REVALIDATE_SECONDS = 300; // 5 minutos en lugar de 1 minuto

// Logger para estadísticas
const statsLogger = serverLogger.withContext('StatsService');

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
	// Si estamos en desarrollo y USE_MOCK_STATS está activado, devolver datos simulados
	if (USE_MOCK_STATS) {
		statsLogger.info('📊 Usando estadísticas simuladas para desarrollo');
		return MOCK_STATS;
	}

	try {
		statsLogger.info('📊 Obteniendo estadísticas del sistema con optimizaciones');

		// 🚀 Usar servicio optimizado para los conteos principales
		const optimizedStatsService = OptimizedStatsService.getInstance();
		const globalStats = await optimizedStatsService.getGlobalStatsOptimized();

		// 📊 Obtener topTags y recentActivity por separado (optimización futura)
		const [topTags, recentActivity] = await Promise.all([
			db.query.tags.findMany({
				columns: {
					id: true,
					name: true,
					color: true,
				},
				with: {
					images: { columns: { id: true } },
				},
				orderBy: desc(sql`count(tags_to_images.image_id)`),
				limit: 5,
			}),
			db.query.activities.findMany({
				columns: {
					id: true,
					type: true,
					description: true,
					createdAt: true,
				},
				with: {
					image: {
						columns: {
							id: true,
							name: true,
							thumbnail: true,
						},
					},
				},
				orderBy: desc(activities.createdAt),
				limit: 5,
			}),
		]);

		statsLogger.info('✅ Estadísticas del sistema obtenidas (optimizadas)');

		return {
			...globalStats,
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
}

// Nuevos tipos para stats de entidades extendidas
export interface ExtendedStats {
	totalDocuments: number;
	totalAudio: number;
	totalJsonFiles: number;
	totalWorkflows: number;
	totalFile3D: number;
}

// Extender getSystemStats para incluir nuevas entidades
export async function getSystemStatsExtended(): Promise<(GeneralStats & ExtendedStats) | null> {
	const base = await getSystemStats();
	if (!base) return null;
	// TODO: Reemplazar por queries reales a Prisma/Drizzle
	return {
		...base,
		totalDocuments: 0,
		totalAudio: 0,
		totalJsonFiles: 0,
		totalWorkflows: 0,
		totalFile3D: 0,
	};
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
	try {
		statsLogger.info('📊 Obteniendo estadísticas detalladas');

		const [collections, folders, tags, albumsData, charactersData, placesData, worldItemsData] = await Promise.all([
			db.query.collections.findMany({
				columns: { id: true, name: true, color: true, emoji: true },
				with: { images: { columns: { id: true } } },
			}),
			db.query.folders.findMany({
				columns: { id: true, name: true },
				with: { images: { columns: { id: true } } },
			}),
			db.query.tags.findMany({
				columns: { id: true, name: true, color: true },
				with: { images: { columns: { id: true } } },
			}),
			db.query.albums.findMany({
				columns: { id: true, name: true, emoji: true },
				with: { images: { columns: { id: true } } },
			}),
			db.query.characters.findMany({
				columns: { id: true, name: true, emoji: true },
				with: { images: { columns: { id: true } } },
			}),
			db.query.places.findMany({
				columns: { id: true, name: true, emoji: true },
				with: { images: { columns: { id: true } } },
			}),
			db.query.worldItems.findMany({
				columns: { id: true, name: true, emoji: true },
				with: { images: { columns: { id: true } } },
			}),
		]);

		statsLogger.info('✅ Estadísticas detalladas obtenidas');

		return {
			collections: collections.map((c) => ({
				id: c.id,
				name: c.name,
				count: c.images.length,
				color: c.color,
				emoji: c.emoji,
			})),
			folders: folders.map((f) => ({
				id: f.id,
				name: f.name,
				count: f.images.length,
			})),
			tags: tags.map((t) => ({
				id: t.id,
				name: t.name,
				count: t.images.length,
				color: t.color,
			})),
			albums: albumsData.map((a) => ({
				id: a.id,
				name: a.name,
				count: a.images.length,
				emoji: a.emoji,
			})),
			characters: charactersData.map((c) => ({
				id: c.id,
				name: c.name,
				count: c.images.length,
				emoji: c.emoji,
			})),
			places: placesData.map((p) => ({
				id: p.id,
				name: p.name,
				count: p.images.length,
				emoji: p.emoji,
			})),
			worldItems: worldItemsData.map((o) => ({
				id: o.id,
				name: o.name,
				count: o.images.length,
				emoji: o.emoji,
			})),
		} satisfies StatsResponse;
	} catch (error) {
		statsLogger.error('❌ Error al obtener las estadísticas:', error);
		return null;
	}
}

export async function invalidateStats(): Promise<void> {
	statsLogger.info('🔄 Invalidando caché de estadísticas');
	revalidatePath('/stats');
	statsLogger.info('✅ Caché de estadísticas invalidada');
}

export async function getImageStats(imageId: string) {
	try {
		statsLogger.info('🔍 Obteniendo estadísticas de imagen:', imageId);

		let stats = await db.query.imageStats.findFirst({
			where: eq(imageStats.imageId, imageId),
		});

		if (!stats) {
			statsLogger.info('➕ Creando estadísticas para imagen:', imageId);
			const [newStats] = await db
				.insert(imageStats)
				.values({
					imageId,
					views: 0,
					lastViewed: new Date(),
				})
				.returning();
			stats = newStats;
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

		const [updatedStats] = await db
			.update(imageStats)
			.set({
				views: sql`${imageStats.views} + 1`,
				lastViewed: new Date(),
			})
			.where(eq(imageStats.imageId, imageId))
			.returning();

		if (!updatedStats) {
			throw createStatsError(
				'No se pudo encontrar la imagen para actualizar las estadísticas',
				StatsErrorCode.ENTITY_NOT_FOUND,
				{ imageId }
			);
		}

		statsLogger.info('✅ Visualización de imagen incrementada');
		revalidatePath('/stats');
		return updatedStats;
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

		// Nota: downloads no está en el esquema ImageStats actual
		// Por ahora solo revalidamos el path
		statsLogger.warn('⚠️ Campo downloads no encontrado en esquema ImageStats');

		statsLogger.info('✅ Descarga de imagen registrada (sin actualizar BD)');
		revalidatePath('/stats');
		return null;
	} catch (error) {
		statsLogger.error('❌ Error al incrementar descarga de imagen:', error);
		throw createStatsError('No se pudo incrementar la descarga de la imagen', StatsErrorCode.OPERATION_FAILED, error);
	}
}

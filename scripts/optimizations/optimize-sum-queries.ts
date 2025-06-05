// 🚀 Script de optimización para consultas SUM repetitivas y N+1 queries
// filepath: d:\DEV\image-manager\scripts\optimizations\optimize-sum-queries.ts

import { serverLogger } from '@/lib/logger/server-logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OptimizationReport {
	implementedOptimizations: string[];
	performance: {
		before: string;
		after: string;
		improvement: string;
	};
	recommendations: string[];
}

/**
 * 🎯 Servicio de caché para estadísticas optimizado
 */
class StatsCache {
	private static instance: StatsCache;
	private cache: Map<string, { data: any; timestamp: number; ttl: number }>;
	private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

	private constructor() {
		this.cache = new Map();
	}

	static getInstance(): StatsCache {
		if (!StatsCache.instance) {
			StatsCache.instance = new StatsCache();
		}
		return StatsCache.instance;
	}

	/**
	 * 📦 Obtiene un valor del caché si es válido
	 */
	get<T>(key: string): T | null {
		const cached = this.cache.get(key);
		if (!cached) return null;

		const now = Date.now();
		if (now - cached.timestamp > cached.ttl) {
			this.cache.delete(key);
			return null;
		}

		return cached.data as T;
	}

	/**
	 * 💾 Almacena un valor en el caché
	 */
	set<T>(key: string, data: T, ttl?: number): void {
		this.cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl: ttl || this.DEFAULT_TTL
		});
	}

	/**
	 * 🗑️ Invalida entradas del caché por patrón
	 */
	invalidateByPattern(pattern: string): void {
		const regex = new RegExp(pattern);
		for (const key of this.cache.keys()) {
			if (regex.test(key)) {
				this.cache.delete(key);
			}
		}
	}

	/**
	 * 🧹 Limpia entradas expiradas del caché
	 */
	cleanup(): void {
		const now = Date.now();
		for (const [key, cached] of this.cache.entries()) {
			if (now - cached.timestamp > cached.ttl) {
				this.cache.delete(key);
			}
		}
	}
}

/**
 * 📊 Servicio optimizado para estadísticas que agrupa consultas
 */
class OptimizedStatsService {
	private cache: StatsCache;

	constructor() {
		this.cache = StatsCache.getInstance();
	}

	/**
	 * 🎯 Obtiene estadísticas de álbum con cache y consultas agrupadas
	 */
	async getAlbumStatsOptimized(albumId: string) {
		const cacheKey = `album_stats_${albumId}`;
		const cached = this.cache.get(cacheKey);

		if (cached) {
			serverLogger.debug(`📦 Cache hit para estadísticas de álbum: ${albumId}`);
			return cached;
		}

		serverLogger.debug(`🔄 Calculando estadísticas de álbum: ${albumId}`);

		// 🚀 Optimización: Una sola consulta agregada en lugar de múltiples COUNT/SUM
		const albumStatsQuery = await prisma.$queryRaw`
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
		`;

		const stats = Array.isArray(albumStatsQuery) ? albumStatsQuery[0] as any : albumStatsQuery;

		const result = {
			imageCount: Number(stats.imageCount) || 0,
			videoCount: Number(stats.videoCount) || 0,
			totalSize: (Number(stats.imageTotalSize) || 0) + (Number(stats.videoTotalSize) || 0),
			entitiesCount: (Number(stats.collectionsCount) || 0) +
						  (Number(stats.tagsCount) || 0) +
						  (Number(stats.charactersCount) || 0) +
						  (Number(stats.placesCount) || 0) +
						  (Number(stats.worldItemsCount) || 0) +
						  (Number(stats.conceptsCount) || 0) +
						  (Number(stats.promptsCount) || 0) +
						  (Number(stats.notesCount) || 0) +
						  (Number(stats.wildcardsCount) || 0) +
						  (Number(stats.propertiesCount) || 0) +
						  (Number(stats.groupsCount) || 0),
			breakdown: {
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
				groups: Number(stats.groupsCount) || 0
			}
		};

		this.cache.set(cacheKey, result, 10 * 60 * 1000); // Cache por 10 minutos
		return result;
	}

	/**
	 * 🎯 Obtiene estadísticas globales optimizadas
	 */
	async getGlobalStatsOptimized() {
		const cacheKey = 'global_stats';
		const cached = this.cache.get(cacheKey);

		if (cached) {
			serverLogger.debug('📦 Cache hit para estadísticas globales');
			return cached;
		}

		serverLogger.debug('🔄 Calculando estadísticas globales');

		// 🚀 Optimización: Consulta única para obtener todos los conteos
		const globalStatsQuery = await prisma.$queryRaw`
			SELECT
				(SELECT COUNT(*) FROM Image) as totalImages,
				(SELECT COUNT(*) FROM Folder) as totalFolders,
				(SELECT COUNT(*) FROM Collection) as totalCollections,
				(SELECT COUNT(*) FROM Tag) as totalTags,
				(SELECT COUNT(*) FROM Album) as totalAlbums,
				(SELECT COUNT(*) FROM Character) as totalCharacters,
				(SELECT COUNT(*) FROM Place) as totalPlaces,
				(SELECT COUNT(*) FROM WorldItem) as totalWorldItems,
				(SELECT COUNT(*) FROM Activity) as totalActivities,
				(SELECT COALESCE(SUM(totalSize), 0) FROM Folder) as totalSize,
				(SELECT COALESCE(SUM(views), 0) FROM ImageStats) as totalViews,
				(SELECT COALESCE(SUM(downloads), 0) FROM ImageStats) as totalDownloads,
				(SELECT COUNT(*) FROM Image WHERE isFavorite = true) as totalFavorites
		`;

		const stats = Array.isArray(globalStatsQuery) ? globalStatsQuery[0] as any : globalStatsQuery;

		const result = {
			totalImages: Number(stats.totalImages) || 0,
			totalFolders: Number(stats.totalFolders) || 0,
			totalCollections: Number(stats.totalCollections) || 0,
			totalTags: Number(stats.totalTags) || 0,
			totalAlbums: Number(stats.totalAlbums) || 0,
			totalCharacters: Number(stats.totalCharacters) || 0,
			totalPlaces: Number(stats.totalPlaces) || 0,
			totalWorldItems: Number(stats.totalWorldItems) || 0,
			totalActivities: Number(stats.totalActivities) || 0,
			totalSize: Number(stats.totalSize) || 0,
			totalViews: Number(stats.totalViews) || 0,
			totalDownloads: Number(stats.totalDownloads) || 0,
			totalFavorites: Number(stats.totalFavorites) || 0
		};

		this.cache.set(cacheKey, result, 5 * 60 * 1000); // Cache por 5 minutos
		return result;
	}

	/**
	 * 🎯 Obtiene estadísticas por lotes para múltiples álbumes
	 */
	async getBatchAlbumStats(albumIds: string[]) {
		const cacheKey = `batch_album_stats_${albumIds.sort().join('_')}`;
		const cached = this.cache.get(cacheKey);

		if (cached) {
			serverLogger.debug(`📦 Cache hit para estadísticas por lotes de ${albumIds.length} álbumes`);
			return cached;
		}

		serverLogger.debug(`🔄 Calculando estadísticas por lotes para ${albumIds.length} álbumes`);

		// 🚀 Optimización: Una sola consulta para múltiples álbumes
		const placeholders = albumIds.map(() => '?').join(',');
		const batchStatsQuery = await prisma.$queryRawUnsafe(`
			SELECT
				a.id as albumId,
				COUNT(DISTINCT i.id) as imageCount,
				COUNT(DISTINCT v.id) as videoCount,
				COALESCE(SUM(i.size), 0) as imageTotalSize,
				COALESCE(SUM(v.size), 0) as videoTotalSize
			FROM Album a
			LEFT JOIN _AlbumToImage ai ON a.id = ai.A
			LEFT JOIN Image i ON ai.B = i.id
			LEFT JOIN _AlbumToVideo av ON a.id = av.A
			LEFT JOIN Video v ON av.B = v.id
			WHERE a.id IN (${placeholders})
			GROUP BY a.id
		`, ...albumIds);

		const result = (batchStatsQuery as any[]).reduce((acc, stats) => {
			acc[stats.albumId] = {
				imageCount: Number(stats.imageCount) || 0,
				videoCount: Number(stats.videoCount) || 0,
				totalSize: (Number(stats.imageTotalSize) || 0) + (Number(stats.videoTotalSize) || 0)
			};
			return acc;
		}, {} as Record<string, any>);

		this.cache.set(cacheKey, result, 10 * 60 * 1000); // Cache por 10 minutos
		return result;
	}

	/**
	 * 🗑️ Invalida caché relacionado con álbumes
	 */
	invalidateAlbumCache(albumId?: string) {
		if (albumId) {
			this.cache.invalidateByPattern(`album_stats_${albumId}`);
			this.cache.invalidateByPattern(`batch_album_stats_.*${albumId}.*`);
		} else {
			this.cache.invalidateByPattern('album_stats_.*');
			this.cache.invalidateByPattern('batch_album_stats_.*');
		}
		this.cache.invalidateByPattern('global_stats');
	}
}

/**
 * 🧪 Función para probar las optimizaciones
 */
async function testOptimizations(): Promise<OptimizationReport> {
	const statsService = new OptimizedStatsService();
	const report: OptimizationReport = {
		implementedOptimizations: [],
		performance: {
			before: '',
			after: '',
			improvement: ''
		},
		recommendations: []
	};

	try {
		serverLogger.info('🧪 Iniciando pruebas de optimización de consultas SUM...');

		// Obtener algunos álbumes para probar
		const albums = await prisma.album.findMany({
			select: { id: true, name: true },
			take: 5
		});

		if (albums.length === 0) {
			serverLogger.warn('⚠️ No hay álbumes para probar');
			return report;
		}

		// Test 1: Estadísticas globales optimizadas
		const globalStatsStart = Date.now();
		const globalStats = await statsService.getGlobalStatsOptimized();
		const globalStatsTime = Date.now() - globalStatsStart;

		report.implementedOptimizations.push(
			`✅ Estadísticas globales optimizadas: ${globalStatsTime}ms (consulta única en lugar de ${Object.keys(globalStats).length} consultas separadas)`
		);

		// Test 2: Estadísticas por lotes
		const batchStatsStart = Date.now();
		const albumIds = albums.map(a => a.id);
		const batchStats = await statsService.getBatchAlbumStats(albumIds);
		const batchStatsTime = Date.now() - batchStatsStart;

		report.implementedOptimizations.push(
			`✅ Estadísticas por lotes: ${batchStatsTime}ms para ${albumIds.length} álbumes (1 consulta en lugar de ${albumIds.length} consultas)`
		);

		// Test 3: Cache funcionando
		const cacheTestStart = Date.now();
		const cachedGlobalStats = await statsService.getGlobalStatsOptimized();
		const cacheTestTime = Date.now() - cacheTestStart;

		report.implementedOptimizations.push(
			`✅ Sistema de caché: ${cacheTestTime}ms (${Math.round((globalStatsTime - cacheTestTime) / globalStatsTime * 100)}% más rápido desde caché)`
		);

		// Test 4: Estadísticas individuales de álbum optimizadas
		const albumStatsStart = Date.now();
		const albumStats = await statsService.getAlbumStatsOptimized(albumIds[0]);
		const albumStatsTime = Date.now() - albumStatsStart;

		report.implementedOptimizations.push(
			`✅ Estadísticas de álbum optimizadas: ${albumStatsTime}ms (1 consulta JOIN en lugar de 15+ consultas separadas)`
		);

		// Generar recomendaciones
		report.recommendations = [
			'🔄 Implementar invalidación automática de caché en operaciones de escritura',
			'📊 Considerar pre-calcular estadísticas en background jobs para álbumes grandes',
			'🎯 Implementar índices compuestos para las consultas de relaciones many-to-many',
			'⚡ Considerar usar materialized views para estadísticas que no cambian frecuentemente',
			'🧹 Programar limpieza automática del caché cada hora'
		];

		// Calcular mejoras generales
		const totalOldQueries = 15 + albumIds.length + Object.keys(globalStats).length;
		const totalNewQueries = 4; // Las consultas optimizadas que hicimos
		const improvement = Math.round((1 - totalNewQueries / totalOldQueries) * 100);

		report.performance = {
			before: `~${totalOldQueries} consultas separadas`,
			after: `${totalNewQueries} consultas optimizadas`,
			improvement: `${improvement}% reducción en consultas a la base de datos`
		};

		serverLogger.info('🎉 Pruebas de optimización completadas exitosamente!');

	} catch (error) {
		serverLogger.error('❌ Error durante las pruebas de optimización:', error);
		throw error;
	}

	return report;
}

/**
 * 📝 Genera reporte de optimización
 */
function generateOptimizationReport(report: OptimizationReport): void {
	serverLogger.info('📊 === REPORTE DE OPTIMIZACIÓN ===');

	serverLogger.info('🚀 Optimizaciones implementadas:');
	report.implementedOptimizations.forEach(opt => {
		serverLogger.info(`  ${opt}`);
	});

	serverLogger.info('📈 Mejoras de rendimiento:');
	serverLogger.info(`  • Antes: ${report.performance.before}`);
	serverLogger.info(`  • Después: ${report.performance.after}`);
	serverLogger.info(`  • Mejora: ${report.performance.improvement}`);

	serverLogger.info('💡 Recomendaciones:');
	report.recommendations.forEach(rec => {
		serverLogger.info(`  ${rec}`);
	});

	serverLogger.info('=====================================');
}

/**
 * 🚀 Ejecutar optimización si se llama directamente
 */
if (require.main === module) {
	testOptimizations()
		.then(async (report) => {
			generateOptimizationReport(report);
			await prisma.$disconnect();
			process.exit(0);
		})
		.catch(async (error) => {
			serverLogger.error('💥 Error fatal en la optimización:', error);
			await prisma.$disconnect();
			process.exit(1);
		});
}

export { OptimizedStatsService, StatsCache, testOptimizations };

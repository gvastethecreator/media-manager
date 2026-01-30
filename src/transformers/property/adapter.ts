/**
 * @file Adaptador para convertir datos de Property de API a PropertyWithStats
 */
import type { PropertyStatistics, PropertyWithStats } from '@/types/entities/property';

/**
 * Crea estadísticas por defecto para una Property
 */
function defaultPropertyStats(partial?: Partial<PropertyStatistics>): PropertyStatistics {
	const now = new Date();
	return {
		// Conteos base heredados de EntityStats
		imageCount: 0,
		videoCount: 0,
		albumCount: 0,
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
		totalItems: 1,
		totalAssociations: 0,
		lastUpdated: now,
		size: 0,
		mtime: now,
		birthtime: now,
		type: 'property',
		// Específicos de Property
		usageCount: partial?.usageCount ?? 0,
		valueDiversity: partial?.valueDiversity ?? 1,
		completenessScore: partial?.completenessScore ?? 100,
		popularity: partial?.popularity ?? 0,
		totalRelations: partial?.totalRelations ?? 0,
		isDirectory: false,
		isFile: true,
		// Métricas opcionales
		viewCount: partial?.viewCount,
		downloadCount: partial?.downloadCount,
		likeCount: partial?.likeCount,
		commentCount: partial?.commentCount,
		qualityScore: partial?.qualityScore,
		isDuplicate: partial?.isDuplicate,
		isOrphaned: partial?.isOrphaned,
		needsAttention: partial?.needsAttention,
	};
}

/**
 * Adaptador: datos de Property API -> PropertyWithStats (UI)
 * Asume que los datos de la API ya vienen con PropertyWithStats
 * o los adapta si vienen como PropertyBase + conteos
 */
export function adaptPropertyToWithStats(data: any): PropertyWithStats {
	// Si ya es PropertyWithStats, devolverlo directamente
	if (data.entityType === 'property' && data.stats) {
		return data;
	}

	// Si viene con _count, calcular totalRelations
	const totalRelations = data._count
		? Object.values(data._count).reduce((sum: number, count: any) => sum + (typeof count === 'number' ? count : 0), 0)
		: 0;

	const stats = defaultPropertyStats({
		totalRelations,
		usageCount: totalRelations,
		popularity: totalRelations,
	});

	return {
		id: data.id,
		name: data.name,
		value: data.value || '',
		description: data.description || null,
		emoji: data.emoji || null,
		color: data.color || null,
		shortcut: data.shortcut || null,
		category: data.category || null,
		featuredImage: data.featuredImage || null,
		isFavorite: Boolean(data.isFavorite),
		createdAt: new Date(data.createdAt),
		updatedAt: new Date(data.updatedAt),
		// WithStats
		entityType: 'property',
		type: data.category || data.type,
		stats,
		statistics: stats,
		_count: data._count,
	};
}

/**
 * Adapta una lista de Properties a PropertyWithStats
 */
export function adaptPropertiesToWithStats(properties: any[]): PropertyWithStats[] {
	return properties.map(adaptPropertyToWithStats);
}

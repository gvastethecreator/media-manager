/**
 * @file Adaptador para GroupWithStats - Patrón estandarizado para componentes de lista
 * @module transformers/group/adapter
 * @description Convierte datos de Drizzle a GroupWithStats con estadísticas completas
 */

import type { GroupBase, GroupStatistics, GroupWithStats } from '@/types/entities/group';

/**
 * Estadísticas por defecto para Group
 * Se utiliza cuando no hay datos de conteo disponibles
 */
export function defaultGroupStats(): GroupStatistics {
	return {
		// Conteos de relaciones
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

		// Métricas globales
		totalItems: 0,
		totalAssociations: 0,

		// Timestamps
		lastUpdated: new Date(),
		lastViewed: null,
		lastModified: null,

		// Métricas de uso
		viewCount: 0,
		downloadCount: 0,
		likeCount: 0,
		commentCount: 0,

		// Métricas de calidad
		qualityScore: 0,
		completenessScore: 0,

		// Estado
		isDuplicate: false,
		isOrphaned: false,
		needsAttention: false,

		// Propiedades del sistema de archivos
		size: 0,
		mtime: new Date(),
		birthtime: new Date(),
		type: 'group',

		// Campos específicos de GroupStatistics
		completeness: 0,
	};
}

/**
 * Adaptador principal: convierte GroupBase a GroupWithStats
 * @param group - Objeto GroupBase de Drizzle
 * @param counts - Conteos opcionales de relaciones
 * @returns GroupWithStats con estadísticas calculadas
 */
export function adaptGroupWithStats(
	group: GroupBase,
	counts?: {
		images?: number;
		videos?: number;
		albums?: number;
		collections?: number;
		tags?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	}
): GroupWithStats {
	// Calcular el total de relaciones
	const totalRelations = counts
		? (counts.images || 0) +
			(counts.videos || 0) +
			(counts.albums || 0) +
			(counts.collections || 0) +
			(counts.tags || 0) +
			(counts.characters || 0) +
			(counts.places || 0) +
			(counts.worldItems || 0) +
			(counts.concepts || 0) +
			(counts.prompts || 0) +
			(counts.notes || 0) +
			(counts.wildcards || 0) +
			(counts.properties || 0) +
			(counts.groups || 0)
		: 0;

	// Calcular completeness basado en campos requeridos
	let completenessScore = 0;
	const maxScore = 6;

	// Campos básicos requeridos (peso: 1 punto cada uno)
	if (group.name?.trim()) completenessScore += 1;
	if (group.description?.trim()) completenessScore += 1;
	if (group.emoji?.trim()) completenessScore += 1;
	if (group.category?.trim()) completenessScore += 1;

	// Campos de configuración (peso: 1 punto cada uno)
	if (group.organizationType?.trim()) completenessScore += 1;
	if (totalRelations > 0) completenessScore += 1;

	const completeness = Math.round((completenessScore / maxScore) * 100);

	// Crear estadísticas
	const stats: GroupStatistics = {
		// Conteos de relaciones
		imageCount: counts?.images || 0,
		videoCount: counts?.videos || 0,
		albumCount: counts?.albums || 0,
		collectionCount: counts?.collections || 0,
		tagCount: counts?.tags || 0,
		characterCount: counts?.characters || 0,
		placeCount: counts?.places || 0,
		worldItemCount: counts?.worldItems || 0,
		conceptCount: counts?.concepts || 0,
		promptCount: counts?.prompts || 0,
		noteCount: counts?.notes || 0,
		wildcardCount: counts?.wildcards || 0,
		propertyCount: counts?.properties || 0,
		groupCount: counts?.groups || 0,

		// Métricas globales
		totalItems: totalRelations,
		totalAssociations: totalRelations,

		// Timestamps
		lastUpdated: group.updatedAt || new Date(),
		lastViewed: null,
		lastModified: group.updatedAt || new Date(),

		// Métricas de uso
		viewCount: 0,
		downloadCount: 0,
		likeCount: 0,
		commentCount: 0,

		// Métricas de calidad
		qualityScore: completeness,
		completenessScore: completeness,

		// Estado
		isDuplicate: false,
		isOrphaned: totalRelations === 0,
		needsAttention: completeness < 50,

		// Propiedades del sistema de archivos
		size: 0,
		mtime: group.updatedAt || new Date(),
		birthtime: group.createdAt || new Date(),
		type: 'group',

		// Campos específicos de GroupStatistics
		completeness,
	};

	// Crear objeto GroupWithStats
	return {
		...group,
		entityType: 'group',
		stats,
		statistics: stats, // Alias para compatibilidad
		_count: counts || {
			images: 0,
			videos: 0,
			albums: 0,
			collections: 0,
			tags: 0,
			characters: 0,
			places: 0,
			worldItems: 0,
			concepts: 0,
			prompts: 0,
			notes: 0,
			wildcards: 0,
			properties: 0,
			groups: 0,
		},
	};
}

/**
 * Adaptador para listas: convierte array de GroupBase a GroupWithStats[]
 * @param groups - Array de objetos GroupBase
 * @param countsMap - Mapa opcional de conteos por ID de group
 * @returns Array de GroupWithStats
 */
export function adaptGroupsWithStats(
	groups: GroupBase[],
	countsMap?: Record<
		string,
		{
			images?: number;
			videos?: number;
			albums?: number;
			collections?: number;
			tags?: number;
			characters?: number;
			places?: number;
			worldItems?: number;
			concepts?: number;
			prompts?: number;
			notes?: number;
			wildcards?: number;
			properties?: number;
			groups?: number;
		}
	>
): GroupWithStats[] {
	return groups.map((group) => adaptGroupWithStats(group, countsMap?.[group.id]));
}

/**
 * @file Transformadores para la entidad Tag.
 * @module transformers/tag/transformer
 * @description Contiene funciones para convertir objetos Tag entre diferentes formatos.
 */

import { clientLogger } from '@/lib/logger/client-logger';
import { calculateCompleteness } from '@/lib/utils/transformers';
import type { TagBase, TagStatistics, TagWithStats } from '@/types/entities/tag';

const tagTransformerLogger = clientLogger.withContext('TagTransformer');

/**
 * Convierte un objeto Tag de Drizzle a TagWithStats. * Esta función es compatible con el sistema legacy que esperaba TagComplete.
 *
 * @param drizzleTag El objeto Tag de Drizzle, puede incluir conteos de relaciones
 * @returns Un objeto TagWithStats con estadísticas calculadas o null si el input es inválido
 */
export function fromDrizzleTag(drizzleTag: any | null): TagWithStats | null {
	if (!drizzleTag) {
		tagTransformerLogger.warn('⚠️ Tag de Drizzle nulo o indefinido');
		return null;
	}

	try {
		tagTransformerLogger.debug(`🔄 Transformando tag: ${drizzleTag.id}`);

		const hasCounts = '_count' in drizzleTag && drizzleTag._count;

		if (hasCounts) {
			const { _count, ...baseTag } = drizzleTag;

			const totalRelations = Object.values(_count).reduce((sum, count) => sum + (count as number), 0);
			const usageDiversity = Object.values(_count).filter((count) => count > 0).length;
			const totalPossibleRelations = Object.keys(_count).length;
			const diversityRatio = totalPossibleRelations > 0 ? usageDiversity / totalPossibleRelations : 0;
			const popularity = Math.log1p(totalRelations) * diversityRatio;
			const completenessScore = calculateCompleteness(baseTag, ['name', 'description', 'category']);

			const stats: TagStatistics = {
				totalRelations,
				usageDiversity: Number.parseFloat(diversityRatio.toFixed(2)),
				popularity: Number.parseFloat(popularity.toFixed(2)),
				completenessScore,
			};

			return {
				...baseTag,
				stats,
			};
		}

		const completenessScore = calculateCompleteness(drizzleTag, ['name', 'description', 'category']);

		const stats: TagStatistics = {
			totalRelations: 0,
			usageDiversity: 0,
			popularity: 0,
			completenessScore,
		};

		return {
			...(drizzleTag as TagBase),
			stats,
		};
	} catch (error) {
		tagTransformerLogger.error('❌ Error transformando tag:', error);
		return null;
	}
}

export const TagTransformer = {
	fromDrizzleTag,
} as const;

export const transformTag = TagTransformer.fromDrizzleTag;

export type TagComplete = TagWithStats;

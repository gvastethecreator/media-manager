/**
 * @file Transformadores para la entidad Tag.
 * @module transformers/tag/transformer
 * @description Contiene funciones para convertir objetos Tag entre diferentes formatos.
 */

import { clientLogger } from '@/lib/logger/client-logger';
import { calculateCompleteness } from '@/lib/utils/transformers';
import type { PrismaTagWithCounts, TagBase, TagStatistics, TagWithStats } from '@/types/entities/tag';

const tagTransformerLogger = clientLogger.withContext('TagTransformer');

/**
 * Convierte un objeto Tag de Prisma a TagWithStats. * Esta función es compatible con el sistema legacy que esperaba TagComplete.
 *
 * @param prismaTag El objeto Tag de Prisma, puede incluir conteos de relaciones
 * @returns Un objeto TagWithStats con estadísticas calculadas o null si el input es inválido
 */
function fromPrismaTag(prismaTag: PrismaTagWithCounts | TagBase | null): TagWithStats | null {
	if (!prismaTag) {
		tagTransformerLogger.warn('⚠️ Tag de Prisma nulo o indefinido');
		return null;
	}

	try {
		tagTransformerLogger.debug(`🔄 Transformando tag: ${prismaTag.id}`);

		// Verificar si el objeto tiene conteos (_count)
		const hasCounts = '_count' in prismaTag && prismaTag._count;

		if (hasCounts) {
			// Si tiene conteos, usar el transformador completo
			const { _count, ...baseTag } = prismaTag as PrismaTagWithCounts;

			// Calcular estadísticas
			const totalRelations = Object.values(_count).reduce((sum, count) => sum + count, 0);
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

		// Si no tiene conteos, crear estadísticas vacías
		const completenessScore = calculateCompleteness(prismaTag, ['name', 'description', 'category']);

		const stats: TagStatistics = {
			totalRelations: 0,
			usageDiversity: 0,
			popularity: 0,
			completenessScore,
		};

		return {
			...prismaTag,
			stats,
		};
	} catch (error) {
		tagTransformerLogger.error('❌ Error transformando tag:', error);
		return null;
	}
}

// === NAMESPACE DE EXPORTACIÓN ===
// Esta estructura evita que Next.js detecte el archivo como Server Action

/**
 * TagTransformer - Namespace que contiene todas las funciones de transformación para tags
 */
export const TagTransformer = {
	fromPrismaTag,
} as const;

/**
 * Alias para compatibilidad con código legacy.
 * @deprecated Usar fromPrismaTag directamente. SERÁ ELIMINADO EN v2.0
 */
export const transformTag = TagTransformer.fromPrismaTag;

/**
 * Tipo de compatibilidad para código legacy que espera TagComplete.
 * @deprecated Usar TagWithStats directamente. SERÁ ELIMINADO EN v2.0
 */
export type TagComplete = TagWithStats;

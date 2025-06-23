/**
 * @file Transformadores para la entidad Property.
 * @module transformers/property/transformer
 * @description Contiene funciones para convertir objetos Property entre diferentes formatos.
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type { PrismaPropertyWithCounts, PropertyBase, PropertyStatistics, PropertyWithStats } from '@/types/entities/property';
import { calculateCompleteness } from '@/utils/transformers';

const propertyTransformerLogger = clientLogger.withContext('PropertyTransformer');

/**
 * Convierte un objeto Property de Prisma a PropertyWithStats.
 * Esta función es compatible con el sistema legacy que esperaba PropertyComplete.
 *
 * @param prismaProperty El objeto Property de Prisma, puede incluir conteos de relaciones
 * @returns Un objeto PropertyWithStats con estadísticas calculadas o null si el input es inválido
 */
export function fromPrismaProperty(
	prismaProperty: PrismaPropertyWithCounts | PropertyBase | null
): PropertyWithStats | null {
	if (!prismaProperty) {
		propertyTransformerLogger.warn('⚠️ Property de Prisma nulo o indefinido');
		return null;
	}

	try {
		propertyTransformerLogger.debug(`🔄 Transformando property: ${prismaProperty.id}`);

		// Verificar si el objeto tiene conteos (_count)
		const hasCounts = '_count' in prismaProperty && prismaProperty._count;

		if (hasCounts) {
			// Si tiene conteos, usar el transformador completo
			const { _count, ...baseProperty } = prismaProperty as PrismaPropertyWithCounts;

			// Calcular estadísticas
			const totalRelations = Object.values(_count).reduce((sum, count) => sum + count, 0);
			const usageDiversity = Object.values(_count).filter(count => count > 0).length;
			const totalPossibleRelations = Object.keys(_count).length;
			const diversityRatio = totalPossibleRelations > 0 ? usageDiversity / totalPossibleRelations : 0;
			const popularity = Math.log1p(totalRelations) * diversityRatio;
			const completenessScore = calculateCompleteness(baseProperty, [
				'name',
				'description',
				'category',
			]);

			const stats: PropertyStatistics = {
				totalRelations,
				usageDiversity: Number.parseFloat(diversityRatio.toFixed(2)),
				popularity: Number.parseFloat(popularity.toFixed(2)),
				completenessScore,
			};
		return {
			...baseProperty,
			stats,
		};
	}

	// Si no tiene conteos, crear estadísticas vacías
	const completenessScore = calculateCompleteness(prismaProperty, [
		'name',
		'description',
		'category',
	]);

	const stats: PropertyStatistics = {
		totalRelations: 0,
		usageDiversity: 0,
		popularity: 0,
		completenessScore,
	};

	return {
		...prismaProperty,
		stats,
	};
	} catch (error) {
		propertyTransformerLogger.error('❌ Error transformando property:', error);
		return null;
	}
}

/**
 * Alias para compatibilidad con código legacy.
 * @deprecated Usar fromPrismaProperty directamente.
 */
export const transformProperty = fromPrismaProperty;

/**
 * Tipo de compatibilidad para código legacy que espera PropertyComplete.
 * @deprecated Usar PropertyWithStats directamente.
 */
export type PropertyComplete = PropertyWithStats;

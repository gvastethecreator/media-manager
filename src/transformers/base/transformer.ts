/**
 * @file Transformador base para todas las entidades
 * @module transformers/base
 * @description Define la lógica común para transformar entidades y sus estadísticas
 * ✅ MIGRADO A DRIZZLE ORM
 */

import { TransformerError } from '@/lib/errors/transformer-error';
import { serverLogger } from '@/lib/logger/server-logger';
import type { EntityBase, EntityStats, EntityStatsTypeValue } from '@/types/entities/entity.types';

const logger = serverLogger.withContext('BaseTransformer');

/**
 * 🔧 Interfaz base para transformadores de entidades
 */
export interface EntityTransformer<TEntity extends EntityBase, TStats extends EntityStats> {
	/**
	 * Calcula las estadísticas para una entidad
	 */
	calculateStats(entity: TEntity): TStats;
	/**
	 * Transforma una entidad base en una entidad con estadísticas
	 */
	transform(entity: TEntity): TEntity & { stats: TStats; entityType: EntityStatsTypeValue };

	/**
	 * Valida una entidad
	 */
	validate(entity: TEntity): void;
}

/**
 * 🛠️ Clase base para transformadores de entidades
 */
export abstract class BaseEntityTransformer<TEntity extends EntityBase, TStats extends EntityStats>
	implements EntityTransformer<TEntity, TStats>
{
	protected constructor(
		protected readonly entityType: EntityStatsTypeValue,
		protected readonly logger = serverLogger
	) {}

	/**
	 * Implementación por defecto del método transform
	 */
	transform(entity: TEntity): TEntity & { stats: TStats; entityType: EntityStatsTypeValue } {
		try {
			// Validar la entidad antes de transformarla
			this.validate(entity);

			// Calcular estadísticas
			const stats = this.calculateStats(entity);

			// Transformar la entidad
			return {
				...entity,
				entityType: this.entityType,
				stats,
			};
		} catch (error) {
			this.logger.error('Error transformando entidad', {
				error,
				entityId: entity.id,
				entityType: this.entityType,
			});
			throw new TransformerError(
				`Error transformando ${this.entityType}: ${error}`,
				'TRANSFORMATION_ERROR',
				{ entityId: entity.id, entityType: this.entityType },
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * Método abstracto para calcular estadísticas
	 * Debe ser implementado por las clases hijas
	 */
	abstract calculateStats(entity: TEntity): TStats;

	/**
	 * Validación básica de una entidad
	 * Puede ser extendido por las clases hijas
	 */
	validate(entity: TEntity): void {
		if (!entity) {
			throw new TransformerError('Entidad nula o undefined', 'VALIDATION_ERROR');
		}

		if (!entity.id) {
			throw new TransformerError('ID de entidad requerido', 'VALIDATION_ERROR');
		}

		if (!entity.name) {
			throw new TransformerError('Nombre de entidad requerido', 'VALIDATION_ERROR');
		}
	}

	/**
	 * Calcula estadísticas base comunes a todas las entidades
	 */
	protected calculateBaseStats(entity: TEntity): Partial<EntityStats> {
		return {
			totalItems: 0,
			totalAssociations: 0,
			lastUpdated: entity.updatedAt,
			lastModified: entity.updatedAt,
			viewCount: 0,
			downloadCount: 0,
			likeCount: 0,
			commentCount: 0,
			qualityScore: 0,
			completenessScore: this.calculateCompletenessScore(entity),
			isDuplicate: false,
			isOrphaned: false,
			needsAttention: false,
		};
	}

	/**
	 * Calcula un score de completitud básico para una entidad
	 */
	protected calculateCompletenessScore(entity: TEntity): number {
		let score = 0;

		// Puntos por tener campos básicos
		if (entity.name) {
			score += 20;
		}
		if (entity.description) {
			score += 20;
		}

		// Puntos por tener campos opcionales comunes
		// Las clases hijas deben extender esto para campos específicos
		const optionalFields = ['thumbnailUrl', 'category', 'metadata'];
		for (const field of optionalFields) {
			if (field in entity) {
				score += 10;
			}
		}

		return Math.min(score, 100);
	}

	/**
	 * Calcula la diferencia en días entre dos fechas
	 */
	protected daysBetween(start: Date, end: Date = new Date()): number {
		const millisecondsPerDay = 1000 * 60 * 60 * 24;
		return Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay);
	}

	/**
	 * Calcula un score de calidad básico (0-100)
	 * Las clases hijas deben extender esto con lógica específica
	 */
	protected calculateQualityScore(entity: TEntity): number {
		let score = 0;

		// Puntos por tener una descripción
		if (entity.description) {
			score += entity.description.length > 100 ? 20 : 10;
		}

		// Puntos por actualización reciente
		const daysSinceUpdate = this.daysBetween(entity.updatedAt);
		if (daysSinceUpdate < 7) {
			score += 20;
		} else if (daysSinceUpdate < 30) {
			score += 10;
		} else if (daysSinceUpdate < 90) {
			score += 5;
		}

		return Math.min(score, 100);
	}
}

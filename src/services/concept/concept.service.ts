// Tipo local para crear conceptos

import * as crypto from 'crypto';
import { and, asc, count, desc, eq, like, type SQL } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { concepts } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { type EventType, emit } from '@/lib/server/events.server';
import { fromDrizzleConcept } from '@/transformers/concept/transformer';
import type { ConceptBase } from '@/types/entities/concept/base';
import type {
	ConceptCreateInput,
	ConceptFilters,
	ConceptResults,
	ConceptUpdateInput,
	ConceptWithStats,
} from '@/types/entities/concept/types';

const conceptLogger = serverLogger.withContext('ConceptService');

// Constantes para los tipos de eventos
const EVENTS = {
	CONCEPT_CREATED: 'concept:created',
	CONCEPT_UPDATED: 'concept:updated',
	CONCEPT_DELETED: 'concept:deleted',
	CONCEPTS_CHANGED: 'concepts:changed',
};

// Mapeo de eventos a EventType
const EVENT_TYPE_MAPPING: Record<string, EventType> = {
	[EVENTS.CONCEPT_CREATED]: 'update',
	[EVENTS.CONCEPT_UPDATED]: 'update',
	[EVENTS.CONCEPT_DELETED]: 'delete',
	[EVENTS.CONCEPTS_CHANGED]: 'update',
};

/**
 * Servicio para gestionar los conceptos
 * Completamente migrado a Drizzle ORM
 */
export const ConceptService = {
	async createConcept(data: ConceptCreateInput): Promise<ConceptWithStats> {
		try {
			const result = await db
				.insert(concepts)
				.values({
					id: crypto.randomUUID(),
					name: data.name,
					description: data.description || null,
					emoji: data.emoji || '💡',
					color: data.color || '#3b82f6',
					category: data.category || null,

					isFavorite: data.isFavorite || false,
					totalImages: data.totalImages || 0,
					totalVideos: data.totalVideos || 0,
					type: data.type || null,
					complexity: data.complexity || null,
					applications: data.applications || null,
					examples: data.examples || null,
					relatedConcepts: data.relatedConcepts || null,
					notes: data.notes || null,
					featuredImage: data.featuredImage || null,
					parentId: data.parentId || null,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			const conceptBase = result[0] as ConceptBase;

			// Transformar a ConceptWithStats
			const concept = fromDrizzleConcept(conceptBase, {
				images: 0,
				videos: 0,
				albums: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			});

			// Emitir eventos con el nuevo sistema
			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.CONCEPT_CREATED],
				data: { action: 'create', entity: concept, eventType: EVENTS.CONCEPT_CREATED },
			});

			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.CONCEPTS_CHANGED],
				data: { action: 'change', eventType: EVENTS.CONCEPTS_CHANGED },
			});

			if (!concept) {
				throw new Error('Error al transformar el concepto creado');
			}

			return concept;
		} catch (error) {
			conceptLogger.error('Error creating concept:', { data, error });
			throw new Error('Error al crear concepto');
		}
	},

	async updateConcept(id: string, data: ConceptUpdateInput): Promise<ConceptWithStats> {
		try {
			const updateData: Partial<typeof concepts.$inferInsert> = {
				updatedAt: new Date(),
			};

			if (data.name !== undefined) updateData.name = data.name;
			if (data.description !== undefined) updateData.description = data.description;
			if (data.emoji !== undefined) updateData.emoji = data.emoji;
			if (data.color !== undefined) updateData.color = data.color;
			if (data.category !== undefined) updateData.category = data.category;

			if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
			if (data.totalImages !== undefined) updateData.totalImages = data.totalImages;
			if (data.totalVideos !== undefined) updateData.totalVideos = data.totalVideos;
			if (data.type !== undefined) updateData.type = data.type;
			if (data.complexity !== undefined) updateData.complexity = data.complexity;
			if (data.applications !== undefined) updateData.applications = data.applications;
			if (data.examples !== undefined) updateData.examples = data.examples;
			if (data.relatedConcepts !== undefined) updateData.relatedConcepts = data.relatedConcepts;
			if (data.notes !== undefined) updateData.notes = data.notes;
			if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
			if (data.parentId !== undefined) updateData.parentId = data.parentId;

			const result = await db.update(concepts).set(updateData).where(eq(concepts.id, id)).returning();

			if (result.length === 0) {
				throw new Error('Concepto no encontrado');
			}

			const updatedConcept = result[0];

			// Agregar _count vacío para el transformer
			const counts = {
				images: 0,
				videos: 0,
				albums: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			};

			// Transformar usando el transformer
			const concept = fromDrizzleConcept(
				{
					...updatedConcept,
					isFavorite: Boolean(updatedConcept.isFavorite),
				},
				counts
			);

			if (!concept) {
				throw new Error('Error al transformar concepto actualizado');
			}

			// Emitir eventos con el nuevo sistema
			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.CONCEPT_UPDATED],
				data: { action: 'update', entity: concept, eventType: EVENTS.CONCEPT_UPDATED },
			});

			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.CONCEPTS_CHANGED],
				data: { action: 'change', eventType: EVENTS.CONCEPTS_CHANGED },
			});

			return concept;
		} catch (error) {
			conceptLogger.error('Error updating concept:', { id, data, error });
			throw new Error('Error al actualizar concepto');
		}
	},

	async deleteConcept(id: string): Promise<void> {
		try {
			const result = await db.delete(concepts).where(eq(concepts.id, id)).returning();

			if (result.length === 0) {
				throw new Error('Concepto no encontrado');
			}

			const concept = result[0];

			// Emitir eventos con el nuevo sistema
			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.CONCEPT_DELETED],
				data: { action: 'delete', entity: concept, eventType: EVENTS.CONCEPT_DELETED },
			});

			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.CONCEPTS_CHANGED],
				data: { action: 'change', eventType: EVENTS.CONCEPTS_CHANGED },
			});
		} catch (error) {
			conceptLogger.error('Error deleting concept:', { id, error });
			throw new Error('Error al eliminar concepto');
		}
	},

	async getConcept(id: string): Promise<ConceptWithStats | null> {
		try {
			const result = await db
				.select({
					id: concepts.id,
					name: concepts.name,
					description: concepts.description,
					category: concepts.category,
					emoji: concepts.emoji,
					color: concepts.color,

					isFavorite: concepts.isFavorite,
					totalImages: concepts.totalImages,
					totalVideos: concepts.totalVideos,
					type: concepts.type,
					complexity: concepts.complexity,
					applications: concepts.applications,
					examples: concepts.examples,
					relatedConcepts: concepts.relatedConcepts,
					notes: concepts.notes,
					featuredImage: concepts.featuredImage,
					parentId: concepts.parentId,
					createdAt: concepts.createdAt,
					updatedAt: concepts.updatedAt,
				})
				.from(concepts)
				.where(eq(concepts.id, id))
				.limit(1);

			if (result.length === 0) {
				return null;
			}

			const rawConcept = result[0];

			// Agregar _count vacío para el transformer
			const counts = {
				images: 0,
				videos: 0,
				albums: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			};

			// Transformar usando el transformer
			return fromDrizzleConcept(
				{
					...rawConcept,
					isFavorite: Boolean(rawConcept.isFavorite),
				},
				counts
			);
		} catch (error) {
			conceptLogger.error('Error getting concept:', { id, error });
			throw new Error('Error al obtener concepto');
		}
	},

	async getConcepts(filters: ConceptFilters = {}): Promise<ConceptResults> {
		try {
			const { category, search, sortBy = 'createdAt', sortOrder = 'desc', page = 0, pageSize = 50 } = filters;

			// Construir filtros dinámicamente
			const conditions: SQL<unknown>[] = [];

			if (category) {
				if (Array.isArray(category)) {
					conditions.push(...category.map((cat: (typeof category)[0]) => eq(concepts.category, cat)));
				} else {
					conditions.push(eq(concepts.category, category));
				}
			}

			if (search) {
				conditions.push(like(concepts.name, `%${search}%`));
			}

			// Determinar el ordenamiento
			const orderDirection_fn = sortOrder === 'desc' ? desc : asc;
			let orderByField: ReturnType<typeof orderDirection_fn>;

			switch (sortBy) {
				case 'name':
					orderByField = orderDirection_fn(concepts.name);
					break;
				case 'category':
					orderByField = orderDirection_fn(concepts.category);
					break;
				default: // 'createdAt'
					orderByField = orderDirection_fn(concepts.createdAt);
			}

			// Consulta principal
			let drizzleQuery = db
				.select({
					id: concepts.id,
					name: concepts.name,
					description: concepts.description,
					category: concepts.category,
					emoji: concepts.emoji,
					color: concepts.color,

					isFavorite: concepts.isFavorite,
					totalImages: concepts.totalImages,
					totalVideos: concepts.totalVideos,
					type: concepts.type,
					complexity: concepts.complexity,
					applications: concepts.applications,
					examples: concepts.examples,
					relatedConcepts: concepts.relatedConcepts,
					notes: concepts.notes,
					featuredImage: concepts.featuredImage,
					parentId: concepts.parentId,
					createdAt: concepts.createdAt,
					updatedAt: concepts.updatedAt,
				})
				.from(concepts);

			// Aplicar filtros si existen
			if (conditions.length > 0) {
				drizzleQuery = drizzleQuery.where(and(...conditions));
			}

			// Aplicar ordenamiento y paginación
			const drizzleConcepts = await drizzleQuery
				.orderBy(orderByField)
				.limit(pageSize)
				.offset(page * pageSize);

			// Consulta de conteo total (con los mismos filtros)
			let countQuery = db.select({ count: count() }).from(concepts);

			if (conditions.length > 0) {
				countQuery = countQuery.where(and(...conditions));
			}

			const [{ count: total }] = await countQuery;

			// Transformar resultados usando el transformer
			const transformedConcepts = drizzleConcepts
				.map((rawConcept: typeof concepts.$inferSelect) => {
					const counts = {
						images: 0,
						videos: 0,
						albums: 0,
						collections: 0,
						tags: 0,
						characters: 0,
						places: 0,
						worldItems: 0,
						prompts: 0,
						notes: 0,
						wildcards: 0,
						properties: 0,
						groups: 0,
					};

					return fromDrizzleConcept(
						{
							...rawConcept,
							content: rawConcept.description || '', // Usar description como content por compatibilidad
							emoji: rawConcept.emoji || '💡',
							color: rawConcept.color || '#3b82f6',
							updatedAt: rawConcept.updatedAt || new Date(),
							isFavorite: Boolean(rawConcept.isFavorite),
						},
						counts
					);
				})
				.filter((concept: ConceptWithStats | null): concept is ConceptWithStats => concept !== null);

			// Obtener estadísticas
			const stats = await this.getConceptStats();

			return {
				items: transformedConcepts,
				total,
				page,
				pageSize,
				stats,
			};
		} catch (error) {
			conceptLogger.error('Error getting concepts:', { filters, error });
			throw new Error('Error al obtener conceptos');
		}
	},

	async getConceptStats(): Promise<{ totalConcepts: number; categoriesStats: Record<string, number> }> {
		try {
			// Obtener conteo total
			const [{ count: total }] = await db.select({ count: count() }).from(concepts);

			// Agrupar por categoría usando Drizzle
			const categoryStats = await db
				.select({
					category: concepts.category,
					count: count(),
				})
				.from(concepts)
				.groupBy(concepts.category);

			// Transformar a formato esperado
			const categoriesStats = Object.fromEntries(
				categoryStats.map((item: { category: string | null; count: number }) => [
					item.category || 'sin categoría',
					item.count,
				])
			);

			return {
				totalConcepts: total,
				categoriesStats,
			};
		} catch (error) {
			conceptLogger.error('Error getting concept stats:', error);
			throw new Error('Error al obtener estadísticas de conceptos');
		}
	},

	async getRecentConceptImages(conceptId: string): Promise<{ id: string; thumbnailUrl: string }[]> {
		console.warn(`[ConceptService] getRecentConceptImages no implementado. ID: ${conceptId}. Retornando array vacío.`);
		return [];
	},

	async getConceptCounts(conceptId: string): Promise<{ images: number; videos: number; albums: number; tags: number }> {
		console.warn(`[ConceptService] getConceptCounts no implementado. ID: ${conceptId}. Retornando ceros.`);
		return {
			images: 0,
			videos: 0,
			albums: 0,
			tags: 0,
		};
	},
};

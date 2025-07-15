// Tipo local para crear conceptos

import * as crypto from 'crypto';
import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { concepts } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { type EventType, emit } from '@/lib/server/events.server';
import type { Concept, ConceptCreateInput, ConceptUpdateInput } from '@/types/entities/concept';

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

import type { Concept, ConceptFilters, ConceptResults, ConceptStats } from '@/types/entities/concept';

/**
 * Servicio para gestionar los conceptos
 * Completamente migrado a Drizzle ORM
 */
export const ConceptService = {
	async createConcept(data: ConceptCreateInput): Promise<Concept> {
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
					isPublic: data.isPublic || false,
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

			const concept = result[0] as Concept;

			// Emitir eventos con el nuevo sistema
			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.CONCEPT_CREATED],
				data: { action: 'create', entity: concept, eventType: EVENTS.CONCEPT_CREATED },
			});

			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.CONCEPTS_CHANGED],
				data: { action: 'change', eventType: EVENTS.CONCEPTS_CHANGED },
			});

			return concept;
		} catch (error) {
			conceptLogger.error('Error creating concept:', { data, error });
			throw new Error('Error al crear concepto');
		}
	},

	async updateConcept(id: string, data: ConceptUpdateInput): Promise<Concept> {
		try {
			const updateData: any = {
				updatedAt: new Date(),
			};

			if (data.name !== undefined) updateData.name = data.name;
			if (data.description !== undefined) updateData.description = data.description;
			if (data.emoji !== undefined) updateData.emoji = data.emoji;
			if (data.color !== undefined) updateData.color = data.color;
			if (data.category !== undefined) updateData.category = data.category;
			if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
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

			const concept = result[0] as Concept;

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

	async getConcept(id: string): Promise<Concept | null> {
		try {
			const result = await db
				.select({
					id: concepts.id,
					name: concepts.name,
					content: concepts.content,
					description: concepts.description,
					category: concepts.category,
					emoji: concepts.emoji,
					color: concepts.color,
					shortcut: concepts.shortcut,
					sortBy: concepts.sortBy,
					filters: concepts.filters,
					featuredImage: concepts.featuredImage,
					isFavorite: concepts.isFavorite,
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

			// Asegurar que isFavorite sea boolean
			return {
				...rawConcept,
				isFavorite: Boolean(rawConcept.isFavorite),
			} as Concept;
		} catch (error) {
			conceptLogger.error('Error getting concept:', { id, error });
			throw new Error('Error al obtener concepto');
		}
	},

	async getConcepts(filters: ConceptFilters = {}): Promise<ConceptResults> {
		try {
			const { category, search, sortBy = 'createdAt', sortOrder = 'desc', page = 0, pageSize = 50 } = filters;

			// Construir filtros dinámicamente
			const conditions: any[] = [];

			if (category) {
				conditions.push(eq(concepts.category, category));
			}

			if (search) {
				conditions.push(
					or(
						like(concepts.name, `%${search}%`),
						like(concepts.content, `%${search}%`),
						like(concepts.description, `%${search}%`)
					)
				);
			}

			// Determinar el ordenamiento
			const orderDirection_fn = sortOrder === 'desc' ? desc : asc;
			let orderByField: any;

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
					content: concepts.content,
					description: concepts.description,
					category: concepts.category,
					emoji: concepts.emoji,
					color: concepts.color,
					shortcut: concepts.shortcut,
					sortBy: concepts.sortBy,
					filters: concepts.filters,
					featuredImage: concepts.featuredImage,
					isFavorite: concepts.isFavorite,
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

			// Transformar resultados de Drizzle asegurando tipos correctos
			const transformedConcepts = drizzleConcepts.map((rawConcept) => ({
				...rawConcept,
				isFavorite: Boolean(rawConcept.isFavorite),
			}));

			// Obtener estadísticas
			const stats = await this.getConceptStats();

			return {
				items: transformedConcepts as Concept[],
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

	async getConceptStats(): Promise<ConceptStats> {
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
			const byCategory = Object.fromEntries(
				categoryStats.map((item) => [item.category || 'sin categoría', item.count])
			);

			return {
				total,
				byCategory,
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

	async getConceptCounts(conceptId: string): Promise<any> {
		console.warn(`[ConceptService] getConceptCounts no implementado. ID: ${conceptId}. Retornando ceros.`);
		return {
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
	},
};

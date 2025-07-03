import type { Concept, Prisma } from '@prisma/client';
// Drizzle imports
import type { ConceptCreate } from '@/app/actions/concepts/concept.actions';
import { prisma } from '@/lib/database/prisma';
import { db } from '@/lib/drizzle';
import { concepts } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { type EventType, emit } from '@/lib/server/events.server';
import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';

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

interface ConceptFilters {
	category?: string;
	search?: string;
	sortBy?: 'createdAt' | 'name' | 'category';
	sortOrder?: 'asc' | 'desc';
	page?: number;
	pageSize?: number;
}

interface ConceptStats {
	total: number;
	byCategory: Record<string, number>;
}

interface ConceptResults {
	items: Concept[];
	total: number;
	page: number;
	pageSize: number;
	stats: ConceptStats;
}

/**
 * Servicio para gestionar los conceptos
 * Migrado a usar serverEvents en lugar de EventEmitter
 */
export const ConceptService = {
	async createConcept(data: ConceptCreate): Promise<Concept> {
		try {
			const concept = await prisma.concept.create({
				data,
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

			return concept;
		} catch (error) {
			conceptLogger.error('Error creating concept:', { data, error });
			throw new Error('Error al crear concepto');
		}
	},

	async updateConcept(id: string, data: Partial<ConceptCreate>): Promise<Concept> {
		try {
			const concept = await prisma.concept.update({
				where: { id },
				data,
			});

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
			const concept = await prisma.concept.delete({
				where: { id },
			});

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
			// **MIGRACIÓN A DRIZZLE**
			const drizzleConcept = await db
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

			if (drizzleConcept.length === 0) {
				return null;
			}

			const rawConcept = drizzleConcept[0];

			// Transformar a formato compatible con Prisma
			const transformedConcept = {
				...rawConcept,
				isFavorite: Boolean(rawConcept.isFavorite),
			};

			// **VALIDACIÓN DUAL EN DESARROLLO**
			if (process.env.NODE_ENV === 'development') {
				try {
					const prismaConcept = await prisma.concept.findUnique({
						where: { id },
					});

					if (prismaConcept && transformedConcept) {
						conceptLogger.info('✅ Validación dual exitosa getConcept:', {
							conceptName: transformedConcept.name
						});
					} else if (!prismaConcept && !transformedConcept) {
						conceptLogger.info('✅ Validación dual exitosa getConcept: ambos null');
					} else {
						conceptLogger.warn('⚠️ Diferencia en getConcept:', {
							drizzleFound: !!transformedConcept,
							prismaFound: !!prismaConcept
						});
					}
				} catch (validationError) {
					conceptLogger.error('❌ Error en validación dual getConcept:', validationError);
				}
			}

			return transformedConcept as Concept;
		} catch (error) {
			conceptLogger.error('Error getting concept:', { id, error });
			throw new Error('Error al obtener concepto');
		}
	},

	async getConcepts(filters: ConceptFilters = {}): Promise<ConceptResults> {
		try {
			const { category, search, sortBy = 'createdAt', sortOrder = 'desc', page = 0, pageSize = 50 } = filters;

			// **MIGRACIÓN A DRIZZLE**
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

			// Transformar resultados de Drizzle a formato compatible con Prisma
			const transformedConcepts = drizzleConcepts.map((rawConcept) => ({
				...rawConcept,
				isFavorite: Boolean(rawConcept.isFavorite),
			}));

			// **VALIDACIÓN DUAL EN DESARROLLO**
			if (process.env.NODE_ENV === 'development') {
				try {
					// Construir filtros para Prisma (código original)
					const where: Prisma.ConceptWhereInput = {};
					if (category) {
						where.category = category;
					}
					if (search) {
						where.OR = [
							{ name: { contains: search } },
							{ content: { contains: search } },
							{ description: { contains: search } },
						];
					}

					const [prismaTotal] = await Promise.all([
						prisma.concept.count({ where }),
					]);

					// Comparar resultados básicos
					if (Math.abs(total - prismaTotal) > 0) {
						conceptLogger.warn('⚠️ Diferencia en conteo total getConcepts:', {
							drizzle: total,
							prisma: prismaTotal,
							filters
						});
					} else {
						conceptLogger.info('✅ Validación dual exitosa getConcepts:', {
							total,
							concepts: transformedConcepts.length
						});
					}
				} catch (validationError) {
					conceptLogger.error('❌ Error en validación dual getConcepts:', validationError);
				}
			}

			// Obtener estadísticas (mantener implementación original por ahora)
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
			const total = await prisma.concept.count();

			// Agrupar por categoría
			const byCategory = await prisma.concept.groupBy({
				by: ['category'],
				_count: true,
			});

			return {
				total,
				byCategory: Object.fromEntries(byCategory.map((item) => [item.category, item._count])),
			};
		} catch (error) {
			conceptLogger.error('Error getting concept stats:', error);
			throw new Error('Error al obtener estadísticas de conceptos');
		}
	},
};

export const conceptService = ConceptService;

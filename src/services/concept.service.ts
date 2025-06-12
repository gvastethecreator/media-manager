import type { ConceptCreate } from '@/app/actions/concepts/concept.actions';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { type EventType, emit } from '@/lib/server/events.server';
import type { Concept } from '@prisma/client';
import type { Prisma } from '@prisma/client';

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
			return await prisma.concept.findUnique({
				where: { id },
			});
		} catch (error) {
			conceptLogger.error('Error getting concept:', { id, error });
			throw new Error('Error al obtener concepto');
		}
	},

	async getConcepts(filters: ConceptFilters = {}): Promise<ConceptResults> {
		try {
			const { category, search, sortBy = 'createdAt', sortOrder = 'desc', page = 0, pageSize = 50 } = filters;

			// Construir where
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

			// Obtener total
			const total = await prisma.concept.count({ where });

			// Obtener conceptos
			const concepts = await prisma.concept.findMany({
				where,
				orderBy: {
					[sortBy]: sortOrder,
				},
				skip: page * pageSize,
				take: pageSize,
			});

			// Obtener estadísticas
			const stats = await this.getConceptStats();

			return {
				items: concepts,
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

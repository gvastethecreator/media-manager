import { logger } from '@/lib/logger/logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import type { ConceptCreate } from '@/types/entities';
import type { Concept } from '@prisma/client';
import type { Prisma } from '@prisma/client';

const conceptLogger = logger.withContext('ConceptService');

// Constantes para los tipos de eventos
const EVENTS = {
	CONCEPT_CREATED: 'concept:created',
	CONCEPT_UPDATED: 'concept:updated',
	CONCEPT_DELETED: 'concept:deleted',
	CONCEPTS_CHANGED: 'concepts:changed',
};

interface ConceptFilters {
	category?: string;
	search?: string;
	tags?: string[];
	sortBy?: 'createdAt' | 'name' | 'category';
	sortOrder?: 'asc' | 'desc';
	page?: number;
	pageSize?: number;
}

interface ConceptStats {
	total: number;
	byCategory: Record<string, number>;
	byTag: Record<string, number>;
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
				type: 'update',
				data: { action: 'create', entity: concept, eventType: EVENTS.CONCEPT_CREATED },
			});

			await emit({
				type: 'update',
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
				type: 'update',
				data: { action: 'update', entity: concept, eventType: EVENTS.CONCEPT_UPDATED },
			});

			await emit({
				type: 'update',
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
				type: 'delete',
				data: { action: 'delete', entity: concept, eventType: EVENTS.CONCEPT_DELETED },
			});

			await emit({
				type: 'update',
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
			const { category, search, tags, sortBy = 'createdAt', sortOrder = 'desc', page = 0, pageSize = 50 } = filters;

			// Construir where
			const where: Prisma.ConceptWhereInput = {};
			if (category) {
				where.category = category;
			}
			if (search) {
				where.OR = [
					{ name: { contains: search, mode: 'insensitive' } },
					{ content: { contains: search, mode: 'insensitive' } },
					{ description: { contains: search, mode: 'insensitive' } },
				];
			}
			if (tags && tags.length > 0) {
				where.tags = {
					hasSome: tags,
				};
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

			// Obtener todos los tags únicos y su conteo
			const concepts = await prisma.concept.findMany({
				select: {
					tags: true,
				},
			});

			const tagCounts: Record<string, number> = {};
			for (const concept of concepts) {
				const tags = JSON.parse(concept.tags || '[]') as string[];
				for (const tag of tags) {
					tagCounts[tag] = (tagCounts[tag] || 0) + 1;
				}
			}

			return {
				total,
				byCategory: Object.fromEntries(byCategory.map((item) => [item.category, item._count])),
				byTag: tagCounts,
			};
		} catch (error) {
			conceptLogger.error('Error getting concept stats:', error);
			throw new Error('Error al obtener estadísticas de conceptos');
		}
	},
};

export const conceptService = ConceptService;

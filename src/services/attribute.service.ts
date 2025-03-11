import { logger } from '@/lib/logger/logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import type { AttributeCreate } from '@/types/entities';
import type { Attribute } from '@prisma/client';
import type { Prisma } from '@prisma/client';

const attributeLogger = logger.withContext('AttributeService');

// Constantes para los tipos de eventos
const EVENTS = {
	ATTRIBUTE_CREATED: 'attribute:created',
	ATTRIBUTE_UPDATED: 'attribute:updated',
	ATTRIBUTE_DELETED: 'attribute:deleted',
	ATTRIBUTES_CHANGED: 'attributes:changed',
};

interface AttributeFilters {
	type?: string;
	category?: string;
	search?: string;
	sortBy?: 'createdAt' | 'name' | 'type' | 'category';
	sortOrder?: 'asc' | 'desc';
	page?: number;
	pageSize?: number;
}

interface AttributeStats {
	total: number;
	byType: Record<string, number>;
	byCategory: Record<string, number>;
}

interface AttributeResults {
	items: Attribute[];
	total: number;
	page: number;
	pageSize: number;
	stats: AttributeStats;
}

/**
 * Servicio para gestionar los atributos
 * Migrado a usar serverEvents en lugar de EventEmitter
 */
export const AttributeService = {
	async createAttribute(data: AttributeCreate): Promise<Attribute> {
		try {
			const attribute = await prisma.attribute.create({
				data,
			});

			// Emitir eventos con el nuevo sistema
			await emit({
				type: 'update',
				data: { action: 'create', entity: attribute, eventType: EVENTS.ATTRIBUTE_CREATED },
			});

			await emit({
				type: 'update',
				data: { action: 'change', eventType: EVENTS.ATTRIBUTES_CHANGED },
			});

			return attribute;
		} catch (error) {
			attributeLogger.error('Error creating attribute:', { data, error });
			throw new Error('Error al crear atributo');
		}
	},

	async updateAttribute(id: string, data: Partial<AttributeCreate>): Promise<Attribute> {
		try {
			const attribute = await prisma.attribute.update({
				where: { id },
				data,
			});

			// Emitir eventos con el nuevo sistema
			await emit({
				type: 'update',
				data: { action: 'update', entity: attribute, eventType: EVENTS.ATTRIBUTE_UPDATED },
			});

			await emit({
				type: 'update',
				data: { action: 'change', eventType: EVENTS.ATTRIBUTES_CHANGED },
			});

			return attribute;
		} catch (error) {
			attributeLogger.error('Error updating attribute:', { id, data, error });
			throw new Error('Error al actualizar atributo');
		}
	},

	async deleteAttribute(id: string): Promise<void> {
		try {
			const attribute = await prisma.attribute.delete({
				where: { id },
			});

			// Emitir eventos con el nuevo sistema
			await emit({
				type: 'delete',
				data: { action: 'delete', entity: attribute, eventType: EVENTS.ATTRIBUTE_DELETED },
			});

			await emit({
				type: 'update',
				data: { action: 'change', eventType: EVENTS.ATTRIBUTES_CHANGED },
			});
		} catch (error) {
			attributeLogger.error('Error deleting attribute:', { id, error });
			throw new Error('Error al eliminar atributo');
		}
	},

	async getAttribute(id: string): Promise<Attribute | null> {
		try {
			return await prisma.attribute.findUnique({
				where: { id },
			});
		} catch (error) {
			attributeLogger.error('Error getting attribute:', { id, error });
			throw new Error('Error al obtener atributo');
		}
	},

	async getAttributes(filters: AttributeFilters = {}): Promise<AttributeResults> {
		try {
			const { type, category, search, sortBy = 'createdAt', sortOrder = 'desc', page = 0, pageSize = 50 } = filters;

			// Construir where
			const where: Prisma.AttributeWhereInput = {};
			if (type) {
				where.type = type;
			}
			if (category) {
				where.category = category;
			}
			if (search) {
				where.OR = [
					{ name: { contains: search, mode: 'insensitive' } },
					{ description: { contains: search, mode: 'insensitive' } },
				];
			}

			// Obtener total
			const total = await prisma.attribute.count({ where });

			// Obtener atributos
			const attributes = await prisma.attribute.findMany({
				where,
				orderBy: {
					[sortBy]: sortOrder,
				},
				skip: page * pageSize,
				take: pageSize,
			});

			// Obtener estadísticas
			const stats = await this.getAttributeStats();

			return {
				items: attributes,
				total,
				page,
				pageSize,
				stats,
			};
		} catch (error) {
			attributeLogger.error('Error getting attributes:', { filters, error });
			throw new Error('Error al obtener atributos');
		}
	},

	async getAttributeStats(): Promise<AttributeStats> {
		try {
			const total = await prisma.attribute.count();

			// Agrupar por tipo
			const byType = await prisma.attribute.groupBy({
				by: ['type'],
				_count: true,
			});

			// Agrupar por categoría
			const byCategory = await prisma.attribute.groupBy({
				by: ['category'],
				_count: true,
			});

			return {
				total,
				byType: Object.fromEntries(byType.map((item) => [item.type, item._count])),
				byCategory: Object.fromEntries(byCategory.map((item) => [item.category, item._count])),
			};
		} catch (error) {
			attributeLogger.error('Error getting attribute stats:', error);
			throw new Error('Error al obtener estadísticas de atributos');
		}
	},
};

export const attributeService = AttributeService;

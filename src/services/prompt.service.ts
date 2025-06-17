import type { Prisma, Prompt } from '@prisma/client';
import type { PromptCreate } from '@/app/actions/prompts/prompt.actions';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { type EventType, emit } from '@/lib/server/events.server';

const promptLogger = serverLogger.withContext('PromptService');

// Constantes para los tipos de eventos
const EVENTS = {
	PROMPT_CREATED: 'prompt:created',
	PROMPT_UPDATED: 'prompt:updated',
	PROMPT_DELETED: 'prompt:deleted',
	PROMPTS_CHANGED: 'prompts:changed',
};

// Mapeo de eventos a EventType
const EVENT_TYPE_MAPPING: Record<string, EventType> = {
	[EVENTS.PROMPT_CREATED]: 'prompts:modified',
	[EVENTS.PROMPT_UPDATED]: 'prompts:modified',
	[EVENTS.PROMPT_DELETED]: 'prompts:modified',
	[EVENTS.PROMPTS_CHANGED]: 'prompts:modified',
};

interface PromptFilters {
	category?: string;
	search?: string;
	tags?: string[];
	sortBy?: 'createdAt' | 'name' | 'category';
	sortOrder?: 'asc' | 'desc';
	page?: number;
	pageSize?: number;
}

interface PromptStats {
	total: number;
	byCategory: Record<string, number>;
	byTag: Record<string, number>;
}

interface PromptResults {
	items: Prompt[];
	total: number;
	page: number;
	pageSize: number;
	stats: PromptStats;
}

/**
 * Servicio para gestionar los prompts
 * Migrado a usar serverEvents en lugar de EventEmitter
 */
export const PromptService = {
	async createPrompt(data: PromptCreate): Promise<Prompt> {
		try {
			const prompt = await prisma.prompt.create({
				data,
			});

			// Emitir eventos con el nuevo sistema
			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.PROMPT_CREATED],
				data: { action: 'create', entity: prompt, eventType: EVENTS.PROMPT_CREATED },
			});

			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.PROMPTS_CHANGED],
				data: { action: 'change', eventType: EVENTS.PROMPTS_CHANGED },
			});

			return prompt;
		} catch (error) {
			promptLogger.error('Error creating prompt:', { data, error });
			throw new Error('Error al crear prompt');
		}
	},

	async updatePrompt(id: string, data: Partial<PromptCreate>): Promise<Prompt> {
		try {
			const prompt = await prisma.prompt.update({
				where: { id },
				data,
			});

			// Emitir eventos con el nuevo sistema
			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.PROMPT_UPDATED],
				data: { action: 'update', entity: prompt, eventType: EVENTS.PROMPT_UPDATED },
			});

			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.PROMPTS_CHANGED],
				data: { action: 'change', eventType: EVENTS.PROMPTS_CHANGED },
			});

			return prompt;
		} catch (error) {
			promptLogger.error('Error updating prompt:', { id, data, error });
			throw new Error('Error al actualizar prompt');
		}
	},

	async deletePrompt(id: string): Promise<void> {
		try {
			const prompt = await prisma.prompt.delete({
				where: { id },
			});

			// Emitir eventos con el nuevo sistema
			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.PROMPT_DELETED],
				data: { action: 'delete', entity: prompt, eventType: EVENTS.PROMPT_DELETED },
			});

			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.PROMPTS_CHANGED],
				data: { action: 'change', eventType: EVENTS.PROMPTS_CHANGED },
			});
		} catch (error) {
			promptLogger.error('Error deleting prompt:', { id, error });
			throw new Error('Error al eliminar prompt');
		}
	},

	async getPrompt(id: string): Promise<Prompt | null> {
		try {
			return await prisma.prompt.findUnique({
				where: { id },
			});
		} catch (error) {
			promptLogger.error('Error getting prompt:', { id, error });
			throw new Error('Error al obtener prompt');
		}
	},

	async getPrompts(filters: PromptFilters = {}): Promise<PromptResults> {
		try {
			const { category, search, tags, sortBy = 'createdAt', sortOrder = 'desc', page = 0, pageSize = 50 } = filters;

			// Construir where
			const where: Prisma.PromptWhereInput = {};
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
			if (tags && tags.length > 0) {
				// Convertimos el array a un string JSON para compararlo con la columna tags
				const tagsJson = JSON.stringify(tags);
				where.tags = {
					contains: tagsJson.substring(1, tagsJson.length - 1), // Quitamos los corchetes
				};
			}

			// Obtener total
			const total = await prisma.prompt.count({ where });

			// Obtener prompts
			const prompts = await prisma.prompt.findMany({
				where,
				orderBy: {
					[sortBy]: sortOrder,
				},
				skip: page * pageSize,
				take: pageSize,
			});

			// Obtener estadísticas
			const stats = await this.getPromptStats();

			return {
				items: prompts,
				total,
				page,
				pageSize,
				stats,
			};
		} catch (error) {
			promptLogger.error('Error getting prompts:', { filters, error });
			throw new Error('Error al obtener prompts');
		}
	},

	async getPromptStats(): Promise<PromptStats> {
		try {
			const total = await prisma.prompt.count();

			// Agrupar por categoría
			const byCategory = await prisma.prompt.groupBy({
				by: ['category'],
				_count: true,
			});

			// Obtener todos los tags únicos y su conteo
			const prompts = await prisma.prompt.findMany({
				select: {
					tags: true,
				},
			});

			const tagCounts: Record<string, number> = {};
			for (const prompt of prompts) {
				const tags = JSON.parse(prompt.tags || '[]') as string[];
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
			promptLogger.error('Error getting prompt stats:', error);
			throw new Error('Error al obtener estadísticas de prompts');
		}
	},
};

export const promptService = PromptService;

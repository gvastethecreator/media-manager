'use server';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { type ServerImage, convertServerImageToFileItem } from '@/services/image-converter.service';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { FileItem } from '@/types/file-item';
import type { Prompt as PrismaPrompt } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const promptLogger = logger.withContext('PromptActions');

const REVALIDATE_PATHS = ['/settings', '/prompts', '/prompts/[id]'] as const;

const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	promptLogger.info('🔄 Rutas revalidadas');
};

class PromptError extends Error {
	constructor(
		message: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'PromptError';
	}
}

export interface PromptCreate {
	name: string;
	emoji?: string;
	description?: string | null;
	color?: string;
	content?: string;
	category?: string;
	parameters?: string;
	tags?: string;
	featuredImage?: string | null;
}

export interface PromptUpdate extends Partial<PromptCreate> {
	id: string;
}

export interface Prompt extends PrismaPrompt {
	count?: number;
}

export interface PromptWithStats extends PrismaPrompt {
	_count: {
		concepts: number;
		notes: number;
		characters: number;
		places: number;
		objects: number;
	};
	lastUpdated: Date;
}

export interface PromptWithImages extends PrismaPrompt {
	images: FileItem[];
}

export interface ExtendedPrompt extends PrismaPrompt {
	images: PrismaPrompt[];
}

export async function getPrompts(): Promise<PromptWithStats[]> {
	try {
		promptLogger.info('🎯 Obteniendo prompts con estadísticas');

		// Obtener prompts con conteos y estadísticas
		const prompts = await prisma.prompt.findMany({
			include: {
				_count: {
					select: {
						concepts: true,
						notes: true,
						characters: true,
						places: true,
						objects: true,
					},
				},
			},
			orderBy: [
				{
					name: 'asc',
				},
			],
		});

		// Mapear prompts a formato con estadísticas
		const promptsWithStats = prompts.map((prompt) => ({
			...prompt,
			_count: prompt._count,
			lastUpdated: prompt.updatedAt,
		}));

		promptLogger.info('✅ Prompts obtenidos', { count: prompts.length });
		return promptsWithStats;
	} catch (error) {
		promptLogger.error('❌ Error al obtener prompts', error);
		throw new PromptError('No se pudieron obtener los prompts');
	}
}

export async function getPrompt(id: string): Promise<Prompt> {
	try {
		promptLogger.info('🔍 Obteniendo prompt:', id);
		const prompt = await prisma.prompt.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						concepts: true,
						notes: true,
						characters: true,
						places: true,
						objects: true,
					},
				},
			},
		});

		if (!prompt) {
			throw new PromptError('Prompt no encontrado');
		}

		promptLogger.info('✅ Prompt obtenido:', prompt.name);
		return {
			...prompt,
			count: Object.values(prompt._count).reduce((acc, count) => acc + count, 0),
		};
	} catch (error) {
		promptLogger.error('❌ Error al obtener prompt:', error);
		if (error instanceof PromptError) {
			throw error;
		}
		throw new PromptError('No se pudo obtener el prompt', error);
	}
}

export async function createPrompt(data: PromptCreate): Promise<Prompt> {
	try {
		promptLogger.info('📝 Creando prompt:', data.name);
		const prompt = await prisma.prompt.create({
			data: {
				name: data.name,
				emoji: data.emoji || '🎯',
				description: data.description || null,
				color: data.color || '#3b82f6',
				content: data.content || '',
				category: data.category || 'general',
				parameters: data.parameters || '{}',
				tags: data.tags || '[]',
				featuredImage: data.featuredImage || null,
			},
		});

		// Emitir eventos
		await emit({
			type: 'prompts:modified',
			data: { action: 'create', prompt },
		});
		statsEventEmitter.emit(STATS_EVENTS.PROMPT_CHANGE);

		promptLogger.info('✅ Prompt creado:', prompt.name);
		await revalidateAllPaths();
		return prompt;
	} catch (error) {
		promptLogger.error('❌ Error al crear prompt:', error);
		throw new PromptError('No se pudo crear el prompt', error);
	}
}

export async function updatePrompt(id: string, data: PromptUpdate): Promise<Prompt> {
	try {
		promptLogger.info('📝 Actualizando prompt:', id);
		const prompt = await prisma.prompt.update({
			where: { id },
			data,
		});

		// Emitir eventos
		await emit({
			type: 'prompts:modified',
			id,
			data: { action: 'update', prompt },
		});
		statsEventEmitter.emit(STATS_EVENTS.PROMPT_CHANGE);

		promptLogger.info('✅ Prompt actualizado:', prompt.name);
		await revalidateAllPaths();
		return prompt;
	} catch (error) {
		promptLogger.error('❌ Error al actualizar prompt:', error);
		throw new PromptError('No se pudo actualizar el prompt', error);
	}
}

export async function deletePrompt(id: string): Promise<void> {
	try {
		promptLogger.info('🗑️ Eliminando prompt:', id);
		await prisma.prompt.delete({
			where: { id },
		});

		// Emitir eventos
		await emit({
			type: 'prompts:modified',
			id,
			data: { action: 'delete', id },
		});
		statsEventEmitter.emit(STATS_EVENTS.PROMPT_CHANGE);

		promptLogger.info('✅ Prompt eliminado');
		await revalidateAllPaths();
	} catch (error) {
		promptLogger.error('❌ Error al eliminar prompt:', error);
		throw new PromptError('No se pudo eliminar el prompt', error);
	}
}

export async function getPromptImages(id: string) {
	try {
		promptLogger.info('🖼️ Obteniendo imágenes del prompt:', id);
		const prompt = await prisma.prompt.findUnique({
			where: { id },
		});

		if (!prompt) {
			throw new PromptError('Prompt no encontrado');
		}

		const images: FileItem[] = [];
		promptLogger.info(`✅ ${images.length} imágenes obtenidas`);
		return images;
	} catch (error) {
		promptLogger.error('❌ Error al obtener imágenes del prompt:', error);
		throw new PromptError('No se pudieron obtener las imágenes del prompt', error);
	}
}

'use server';

import { logger } from '@/lib/logger/logger';
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

enum PromptErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
}

const createPromptError = (
	message: string,
	code: PromptErrorCode = PromptErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	const error = new Error(message);
	error.name = 'PromptError';
	Object.assign(error, { code, cause });
	return error;
};

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
	};
	lastUpdated: Date;
}

export interface PromptWithImages extends PrismaPrompt {
	images: FileItem[];
}

export interface ExtendedPrompt extends PrismaPrompt {
	concepts?: { id: string; name: string }[];
	notes?: { id: string; title: string }[];
	characters?: { id: string; name: string }[];
	places?: { id: string; name: string }[];
}

export async function getPrompts(): Promise<PromptWithStats[]> {
	try {
		promptLogger.info('🎯 Obteniendo prompts con estadísticas');

		const prompts = await prisma.prompt.findMany({
			include: {
				_count: {
					select: {
						concepts: true,
						notes: true,
						characters: true,
						places: true,
					},
				},
			},
			orderBy: [
				{
					name: 'asc',
				},
			],
		});

		const promptsWithStats = prompts.map((prompt) => ({
			...prompt,
			_count: prompt._count,
			lastUpdated: prompt.updatedAt,
		}));

		promptLogger.info('✅ Prompts obtenidos', { count: prompts.length });
		return promptsWithStats as PromptWithStats[];
	} catch (error) {
		promptLogger.error('❌ Error al obtener prompts', error);
		throw createPromptError('No se pudieron obtener los prompts', PromptErrorCode.OPERATION_FAILED, error);
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
					},
				},
			},
		});

		if (!prompt) {
			throw createPromptError('Prompt no encontrado', PromptErrorCode.NOT_FOUND);
		}

		promptLogger.info('✅ Prompt obtenido:', prompt.name);
		return prompt as Prompt;
	} catch (error) {
		promptLogger.error('❌ Error al obtener prompt:', error);
		if (error instanceof Error && error.name === 'PromptError') {
			throw error;
		}
		throw createPromptError('No se pudo obtener el prompt', PromptErrorCode.OPERATION_FAILED, error);
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
		throw createPromptError('No se pudo crear el prompt', PromptErrorCode.OPERATION_FAILED, error);
	}
}

export async function updatePrompt(id: string, data: PromptUpdate): Promise<Prompt> {
	try {
		promptLogger.info('📝 Actualizando prompt:', id);
		const prompt = await prisma.prompt.update({
			where: { id },
			data,
		});

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
		throw createPromptError('No se pudo actualizar el prompt', PromptErrorCode.OPERATION_FAILED, error);
	}
}

export async function deletePrompt(id: string): Promise<void> {
	try {
		promptLogger.info('🗑️ Eliminando prompt:', id);
		await prisma.prompt.delete({
			where: { id },
		});

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
		throw createPromptError('No se pudo eliminar el prompt', PromptErrorCode.OPERATION_FAILED, error);
	}
}

export async function getPromptImages(id: string): Promise<FileItem[]> {
	try {
		promptLogger.info('🖼️ Obteniendo imágenes relacionadas con el prompt:', id);

		const promptWithRelations = await prisma.prompt.findUnique({
			where: { id },
			include: {
				characters: {
					include: {
						images: true,
					},
				},
				places: {
					include: {
						images: true,
					},
				},
				worldItems: {
					include: {
						images: true,
					},
				},
			},
		});

		if (!promptWithRelations) {
			throw createPromptError('Prompt no encontrado', PromptErrorCode.NOT_FOUND);
		}

		const allImages = new Set<string>();
		const imagesArray: { id: string }[] = [];

		for (const character of promptWithRelations.characters) {
			for (const image of character.images) {
				if (!allImages.has(image.id)) {
					allImages.add(image.id);
					imagesArray.push(image);
				}
			}
		}

		for (const place of promptWithRelations.places) {
			for (const image of place.images) {
				if (!allImages.has(image.id)) {
					allImages.add(image.id);
					imagesArray.push(image);
				}
			}
		}

		for (const item of promptWithRelations.worldItems) {
			for (const image of item.images) {
				if (!allImages.has(image.id)) {
					allImages.add(image.id);
					imagesArray.push(image);
				}
			}
		}

		const fileItems = imagesArray.map((img) => convertServerImageToFileItem(img as unknown as ServerImage));

		promptLogger.info(`✅ ${fileItems.length} imágenes obtenidas`);
		return fileItems;
	} catch (error) {
		promptLogger.error('❌ Error al obtener imágenes del prompt:', error);
		throw createPromptError('No se pudieron obtener las imágenes del prompt', PromptErrorCode.OPERATION_FAILED, error);
	}
}

export async function addPromptToImage(promptId: string, imageId: string): Promise<void> {
	try {
		promptLogger.info('➕ Esta funcionalidad necesita reimplementación según el esquema actual');

		await emit({
			type: 'prompts:modified',
			id: promptId,
			imageId,
			data: { action: 'addImage' },
		});
		statsEventEmitter.emit(STATS_EVENTS.PROMPT_CHANGE);

		promptLogger.info('✅ Por favor, revisa la implementación según el esquema de datos');
		await revalidateAllPaths();
	} catch (error) {
		promptLogger.error('❌ Error:', error);
		throw createPromptError('Operación no implementada correctamente', PromptErrorCode.OPERATION_FAILED, error);
	}
}

export async function removePromptFromImage(promptId: string, imageId: string): Promise<void> {
	try {
		promptLogger.info('➖ Esta funcionalidad necesita reimplementación según el esquema actual');

		await emit({
			type: 'prompts:modified',
			id: promptId,
			imageId,
			data: { action: 'removeImage' },
		});
		statsEventEmitter.emit(STATS_EVENTS.PROMPT_CHANGE);

		promptLogger.info('✅ Por favor, revisa la implementación según el esquema de datos');
		await revalidateAllPaths();
	} catch (error) {
		promptLogger.error('❌ Error:', error);
		throw createPromptError('Operación no implementada correctamente', PromptErrorCode.OPERATION_FAILED, error);
	}
}

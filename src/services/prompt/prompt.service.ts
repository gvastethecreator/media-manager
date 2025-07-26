/**
 * @file Servicio para la gestión de prompts
 * @module services/prompt
 */

import * as crypto from 'crypto';
import { and, asc, count, desc, eq, inArray, like, or } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { prompts } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import { fromDrizzlePrompt } from '@/transformers/prompt/transformer';
import type {
	PromptCreateInput,
	PromptSearchResult,
	PromptUpdateInput,
	PromptWithStats,
} from '@/types/entities/prompt/types';

// Logger específico para el servicio de prompts
const logger = serverLogger.withContext('PromptService');

// Códigos de error
export enum PromptErrorCode {
	NOT_FOUND = 'PROMPT_NOT_FOUND',
	ALREADY_EXISTS = 'PROMPT_ALREADY_EXISTS',
	INVALID_DATA = 'PROMPT_INVALID_DATA',
	OPERATION_FAILED = 'PROMPT_OPERATION_FAILED',
	PERMISSION_DENIED = 'PROMPT_PERMISSION_DENIED',
}

// Constructor de errores para prompts
export const createPromptError = (
	message: string,
	code: PromptErrorCode = PromptErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	const error = new Error(message);
	error.name = 'PromptServiceError';
	Object.assign(error, { code, cause });
	return error;
};

// Eventos del servicio
export const PROMPT_EVENTS = {
	CREATED: 'prompt:created',
	UPDATED: 'prompt:updated',
	DELETED: 'prompt:deleted',
	STATS_UPDATED: 'prompt:stats:updated',
} as const;

// Notificación de cambios en prompts
export const notifyPromptChange = async (
	action: 'create' | 'update' | 'delete',
	prompt: PromptWithStats | { id: string }
) => {
	// Usar EventType válido del sistema central
	const eventType = 'update'; // Tipo válido para prompts según EventType

	// Emitir evento
	await emit({
		type: eventType,
		data: { action, prompt },
	});

	// Notificar a estadísticas
	statsEventEmitter.emit(STATS_EVENTS.PROMPT_CHANGE);

	logger.info(`🔔 Notificado cambio en prompt: ${action}`, { promptId: prompt.id });
};

/**
 * Obtiene un prompt por su ID con estadísticas
 */
export const getPromptService = async (id: string): Promise<PromptWithStats | null> => {
	try {
		logger.info(`🔍 Buscando prompt con ID: ${id}`);

		// Buscar prompt base
		const promptResult = await db.select().from(prompts).where(eq(prompts.id, id)).limit(1);

		if (promptResult.length === 0) {
			logger.warn(`⚠️ Prompt no encontrado: ${id}`);
			return null;
		}

		const prompt = promptResult[0];

		// Agregar _count vacío para el transformer
		const promptWithCounts = {
			...prompt,
			_count: {
				images: 0,
				videos: 0,
				albums: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			},
		};

		// Usar el transformer
		const promptWithStats = fromDrizzlePrompt(promptWithCounts);

		logger.info(`✅ Prompt encontrado: ${prompt.name}`);
		return promptWithStats;
	} catch (error) {
		logger.error('❌ Error al obtener prompt por ID', { error, promptId: id });
		throw createPromptError(
			`Error al obtener prompt: ${error instanceof Error ? error.message : String(error)}`,
			PromptErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Obtiene múltiples prompts por sus IDs
 */
export const getPromptsByIdsService = async (ids: string[]): Promise<PromptWithStats[]> => {
	try {
		logger.info(`🔍 Buscando prompts por IDs, cantidad: ${ids.length}`);

		if (ids.length === 0) {
			return [];
		}

		// Buscar prompts base
		const promptsResult = await db.select().from(prompts).where(inArray(prompts.id, ids));

		// Transformar cada prompt usando el transformer
		const promptsWithStats = promptsResult.map((prompt: typeof promptsResult[0]) => {
			// Agregar _count vacío para el transformer
			const promptWithCounts = {
				...prompt,
				_count: {
					images: 0,
					videos: 0,
					albums: 0,
					collections: 0,
					tags: 0,
					characters: 0,
					places: 0,
					worldItems: 0,
					concepts: 0,
					notes: 0,
					wildcards: 0,
					properties: 0,
					groups: 0,
				},
			};

			// Usar el transformer
			return fromDrizzlePrompt(promptWithCounts);
		});

		logger.info(`✅ Prompts encontrados: ${promptsWithStats.length}`);
		return promptsWithStats;
	} catch (error) {
		logger.error('❌ Error al obtener prompts por IDs', { error, ids });
		throw createPromptError(
			`Error al obtener prompts: ${error instanceof Error ? error.message : String(error)}`,
			PromptErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Busca prompts según criterios específicos
 */
export const searchPromptsService = async (
	filters: Record<string, any> = {},
	options: {
		page?: number;
		pageSize?: number;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
		includeInactive?: boolean;
	} = {}
): Promise<PromptSearchResult> => {
	try {
		logger.info('🔍 Buscando prompts con filtros');

		// Configurar paginación
		const page = options.page || 1;
		const pageSize = options.pageSize || 20;
		const offset = (page - 1) * pageSize;

		// Construir condiciones WHERE
		const conditions = [];

		if (filters.search) {
			conditions.push(
				or(
					like(prompts.name, `%${filters.search}%`),
					like(prompts.description, `%${filters.search}%`),
					like(prompts.content, `%${filters.search}%`)
				)
			);
		}

		if (filters.category) {
			conditions.push(eq(prompts.category, filters.category));
		}

		if (filters.isPublic !== undefined) {
			conditions.push(eq(prompts.isPublic, filters.isPublic));
		}

		if (filters.isFavorite !== undefined) {
			conditions.push(eq(prompts.isFavorite, filters.isFavorite));
		}

		if (filters.type) {
			conditions.push(eq(prompts.type, filters.type));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Configurar orden
		const sortBy = options.sortBy || 'name';
		const sortOrder = options.sortOrder || 'asc';
		const orderByClause =
			sortOrder === 'desc'
				? desc(prompts[sortBy as keyof typeof prompts] as any)
				: asc(prompts[sortBy as keyof typeof prompts] as any);

		// Ejecutar consultas en paralelo
		const [promptsResult, totalCount] = await Promise.all([
			db.select().from(prompts).where(whereClause).orderBy(orderByClause).limit(pageSize).offset(offset),
			db
				.select({ count: count() })
				.from(prompts)
				.where(whereClause)
				.then((res) => res[0]?.count || 0),
		]);

		// Transformar cada prompt usando el transformer
		const promptsWithStats = promptsResult.map((prompt: typeof promptsResult[0]) => {
			// Agregar _count vacío para el transformer
			const promptWithCounts = {
				...prompt,
				_count: {
					images: 0,
					videos: 0,
					albums: 0,
					collections: 0,
					tags: 0,
					characters: 0,
					places: 0,
					worldItems: 0,
					concepts: 0,
					notes: 0,
					wildcards: 0,
					properties: 0,
					groups: 0,
				},
			};

			// Usar el transformer
			return fromDrizzlePrompt(promptWithCounts);
		});

		const result: PromptSearchResult = {
			data: promptsWithStats,
			total: totalCount,
			page,
			pageSize,
			totalPages: Math.ceil(totalCount / pageSize),
			hasNext: page * pageSize < totalCount,
			hasPrevious: page > 1,
		};

		logger.info(`✅ Búsqueda completada, encontrados ${result.total} prompts`);
		return result;
	} catch (error) {
		logger.error('❌ Error al buscar prompts', { error, filters, options });
		throw createPromptError(
			`Error al buscar prompts: ${error instanceof Error ? error.message : String(error)}`,
			PromptErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Crea un nuevo prompt
 */
export const createPromptService = async (data: PromptCreateInput): Promise<PromptWithStats> => {
	try {
		logger.info('✨ Creando nuevo prompt', { name: data.name });

		// Verificar si ya existe un prompt con el mismo nombre
		if (data.name) {
			const existingPrompt = await db.select().from(prompts).where(eq(prompts.name, data.name)).limit(1);
			if (existingPrompt.length > 0) {
				throw createPromptError(`Ya existe un prompt con el nombre "${data.name}"`, PromptErrorCode.ALREADY_EXISTS);
			}
		}

		// Crear prompt usando Drizzle
		const newPrompt = await db
			.insert(prompts)
			.values({
				id: crypto.randomUUID(),
				name: data.name,
				description: data.description,
				emoji: data.emoji,
				color: data.color,
				category: data.category,
				isPublic: data.isPublic || false,
				isFavorite: data.isFavorite || false,
				type: data.type,
				content: data.content,
				parameters: data.parameters,
				style: data.style,
				mood: data.mood,
				lighting: data.lighting,
				composition: data.composition,
				technique: data.technique,
				inspiration: data.inspiration,
				notes: data.notes,
				featuredImage: data.featuredImage,
				parentId: data.parentId,
				totalImages: 0,
				totalVideos: 0,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		// Agregar _count vacío para el transformer
		const promptWithCounts = {
			...newPrompt[0],
			_count: {
				images: 0,
				videos: 0,
				albums: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			},
		};

		// Usar el transformer
		const promptWithStats = fromDrizzlePrompt(promptWithCounts);

		// Notificar creación
		await notifyPromptChange('create', promptWithStats);
		logger.info(`✅ Prompt creado: ${promptWithStats.name}`, { promptId: promptWithStats.id });
		return promptWithStats;
	} catch (error) {
		logger.error('❌ Error al crear prompt', { error, data });

		if (error instanceof Error && error.name === 'PromptServiceError') {
			throw error;
		}

		throw createPromptError(
			`Error al crear prompt: ${error instanceof Error ? error.message : String(error)}`,
			PromptErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Actualiza un prompt existente
 */
export const updatePromptService = async (id: string, data: PromptUpdateInput): Promise<PromptWithStats> => {
	try {
		logger.info(`📝 Actualizando prompt: ${id}`);

		// Verificar que el prompt existe
		const existingPrompt = await db.select().from(prompts).where(eq(prompts.id, id)).limit(1);

		if (existingPrompt.length === 0) {
			throw createPromptError(`No se encontró el prompt con ID: ${id}`, PromptErrorCode.NOT_FOUND);
		}

		// Verificar nombre único si se está actualizando
		if (data.name && data.name !== existingPrompt[0].name) {
			const promptWithSameName = await db
				.select()
				.from(prompts)
				.where(and(eq(prompts.name, data.name), eq(prompts.id, id)))
				.limit(1);

			if (promptWithSameName.length > 0) {
				throw createPromptError(`Ya existe un prompt con el nombre "${data.name}"`, PromptErrorCode.ALREADY_EXISTS);
			}
		}

		// Preparar datos de actualización
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
		if (data.type !== undefined) updateData.type = data.type;
		if (data.content !== undefined) updateData.content = data.content;
		if (data.parameters !== undefined) updateData.parameters = data.parameters;
		if (data.style !== undefined) updateData.style = data.style;
		if (data.mood !== undefined) updateData.mood = data.mood;
		if (data.lighting !== undefined) updateData.lighting = data.lighting;
		if (data.composition !== undefined) updateData.composition = data.composition;
		if (data.technique !== undefined) updateData.technique = data.technique;
		if (data.inspiration !== undefined) updateData.inspiration = data.inspiration;
		if (data.notes !== undefined) updateData.notes = data.notes;
		if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
		if (data.parentId !== undefined) updateData.parentId = data.parentId;

		// Actualizar prompt usando Drizzle
		const updatedPrompt = await db.update(prompts).set(updateData).where(eq(prompts.id, id)).returning();

		// Agregar _count vacío para el transformer
		const promptWithCounts = {
			...updatedPrompt[0],
			_count: {
				images: 0,
				videos: 0,
				albums: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			},
		};

		// Usar el transformer
		const promptWithStats = fromDrizzlePrompt(promptWithCounts);

		// Notificar actualización
		await notifyPromptChange('update', promptWithStats);

		logger.info(`✅ Prompt actualizado: ${promptWithStats.name}`, { promptId: promptWithStats.id });
		return promptWithStats;
	} catch (error) {
		logger.error('❌ Error al actualizar prompt', { error, promptId: id, data });

		if (error instanceof Error && error.name === 'PromptServiceError') {
			throw error;
		}

		throw createPromptError(
			`Error al actualizar prompt: ${error instanceof Error ? error.message : String(error)}`,
			PromptErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Elimina un prompt
 */
export const deletePromptService = async (id: string): Promise<void> => {
	try {
		logger.info(`🗑️ Eliminando prompt: ${id}`);

		// Verificar que el prompt existe
		const existingPrompt = await db.select().from(prompts).where(eq(prompts.id, id)).limit(1);

		if (existingPrompt.length === 0) {
			throw createPromptError(`No se encontró el prompt con ID: ${id}`, PromptErrorCode.NOT_FOUND);
		}

		// Notificar antes de eliminar
		await notifyPromptChange('delete', { id });

		// Eliminar usando Drizzle
		await db.delete(prompts).where(eq(prompts.id, id));

		logger.info(`✅ Prompt eliminado: ${id}`);
	} catch (error) {
		logger.error('❌ Error al eliminar prompt', { error, promptId: id });

		if (error instanceof Error && error.name === 'PromptServiceError') {
			throw error;
		}

		throw createPromptError(
			`Error al eliminar prompt: ${error instanceof Error ? error.message : String(error)}`,
			PromptErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Verifica si un prompt existe
 */
export const promptExistsService = async (id: string): Promise<boolean> => {
	try {
		const result = await db.select({ count: count() }).from(prompts).where(eq(prompts.id, id));
		return (result[0]?.count || 0) > 0;
	} catch (error) {
		logger.error('❌ Error al verificar existencia de prompt', { error, promptId: id });
		throw createPromptError(
			`Error al verificar prompt: ${error instanceof Error ? error.message : String(error)}`,
			PromptErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Obtiene el conteo total de prompts
 */
export const getPromptCountService = async (): Promise<number> => {
	try {
		const result = await db.select({ count: count() }).from(prompts);
		return result[0]?.count || 0;
	} catch (error) {
		logger.error('❌ Error al obtener conteo de prompts', { error });
		throw createPromptError(
			`Error al obtener conteo: ${error instanceof Error ? error.message : String(error)}`,
			PromptErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Obtiene las imágenes asociadas a un prompt
 */
export const getPromptImagesService = async (promptId: string) => {
	try {
		logger.info(`🖼️ Obteniendo imágenes del prompt: ${promptId}`);

		// TODO: Implementar cuando existan las tablas de relación
		// Por ahora retornamos array vacío
		logger.warn('⚠️ getPromptImages no implementado - falta tabla de relación');
		return [];
	} catch (error) {
		logger.error('❌ Error al obtener imágenes del prompt', { error, promptId });
		throw createPromptError(
			`Error al obtener imágenes: ${error instanceof Error ? error.message : String(error)}`,
			PromptErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Obtiene las imágenes recientes de un prompt
 */
export const getRecentPromptImagesService = async (promptId: string, _limit = 6) => {
	try {
		logger.info(`🖼️ Obteniendo imágenes recientes del prompt: ${promptId}`);

		// TODO: Implementar cuando existan las tablas de relación
		// Por ahora retornamos array vacío
		logger.warn('⚠️ getRecentPromptImages no implementado - falta tabla de relación');
		return [];
	} catch (error) {
		logger.error('❌ Error al obtener imágenes recientes del prompt', { error, promptId });
		throw createPromptError(
			`Error al obtener imágenes recientes: ${error instanceof Error ? error.message : String(error)}`,
			PromptErrorCode.OPERATION_FAILED,
			error
		);
	}
};

// Clase PromptService para compatibilidad con el código existente
export class PromptService {
	async getPromptImages(promptId: string) {
		return getPromptImagesService(promptId);
	}

	async getRecentPromptImages(promptId: string, limit = 6) {
		return getRecentPromptImagesService(promptId, limit);
	}
}

// Exportación de objetos agrupados para una interfaz más limpia
export const promptService = {
	// Operaciones principales
	get: getPromptService,
	getMany: getPromptsByIdsService,
	create: createPromptService,
	update: updatePromptService,
	delete: deletePromptService,
	search: searchPromptsService,
	// Operaciones auxiliares
	exists: promptExistsService,
	getCount: getPromptCountService,
	getImages: getPromptImagesService,
	getRecentImages: getRecentPromptImagesService,
};

// Permitir el uso como importación predeterminada para mayor flexibilidad
export default promptService;

// Exportaciones funcionales para compatibilidad
export const getPrompts = searchPromptsService;
export const getPrompt = getPromptService;
export const createPrompt = createPromptService;
export const updatePrompt = updatePromptService;
export const deletePrompt = deletePromptService;
export const promptExists = promptExistsService;
export const getPromptCount = getPromptCountService;
export const getPromptImages = getPromptImagesService;
export const getRecentPromptImages = getRecentPromptImagesService;

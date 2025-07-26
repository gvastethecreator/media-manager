/**
 * @file Servicio de gestión de wildcards
 * @module services/wildcard/wildcard.service
 * @description Servicio centralizado para operaciones CRUD y lógica de negocio de wildcards con jerarquías
 * @updated 2025-01-27
 */

import { and, asc, count, desc, eq, isNull, like, or } from 'drizzle-orm';
// Drizzle imports
import { db } from '@/lib/drizzle';
import { wildcards } from '@/lib/drizzle/schema/index';
import { createEntityErrorObject, EntityErrorCode } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { revalidatePath } from '@/lib/server/revalidate';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import { fromDrizzleWildcard } from '@/transformers/wildcard/transformer';
import type { WildcardCreateInput, WildcardUpdateInput, WildcardWithStats } from '@/types/entities/wildcard';

// Logger específico para el servicio
const logger = serverLogger.withContext('WildcardService');

// Constantes del servicio
const REVALIDATE_PATHS = ['/wildcards', '/settings/wildcards', '/dashboard/wildcards', '/api/wildcards'];

// Eventos del servicio de wildcards
export const WILDCARD_EVENTS = {
	CREATED: 'wildcard:created',
	UPDATED: 'wildcard:updated',
	DELETED: 'wildcard:deleted',
	MOVED: 'wildcard:moved',
	STATS_UPDATED: 'wildcard:stats:updated',
} as const;

// Función auxiliar para crear errores
const createWildcardError = (
	message: string,
	code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	return createEntityErrorObject('WildcardError', message, code, cause);
};

// Tipos de entrada
export interface GetWildcardsOptions {
	search?: string;
	orderBy?: 'name' | 'createdAt' | 'updatedAt';
	orderDirection?: 'asc' | 'desc';
	onlyFavorites?: boolean;
	parentId?: string | null;
}

export interface GetWildcardsResult {
	wildcards: WildcardWithStats[];
	total: number;
}

/**
 * Clase de error personalizada para operaciones de Wildcard
 */
export class WildcardServiceError extends Error {
	constructor(
		message: string,
		public code?: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'WildcardServiceError';
	}
}

/**
 * Notifica cambios en los wildcards a través del sistema de eventos
 */
export const notifyWildcardChange = async (
	action: 'create' | 'update' | 'delete' | 'move',
	wildcard: WildcardWithStats | { id: string }
): Promise<void> => {
	try {
		let eventType: string;
		switch (action) {
			case 'create':
				eventType = WILDCARD_EVENTS.CREATED;
				break;
			case 'update':
				eventType = WILDCARD_EVENTS.UPDATED;
				break;
			case 'delete':
				eventType = WILDCARD_EVENTS.DELETED;
				break;
			case 'move':
				eventType = WILDCARD_EVENTS.MOVED;
				break;
			default:
				eventType = 'wildcard:modified';
		}

		// Emitir evento al sistema central
		await emit({
			type: 'wildcards:modified',
			data: { action, wildcard },
		});

		// Notificar a estadísticas
		statsEventEmitter.emit(STATS_EVENTS.WILDCARD_CHANGE);

		logger.info(`🔔 Notificado cambio en wildcard: ${action}`, { wildcardId: wildcard.id });
	} catch (error) {
		logger.error(`❌ Error al notificar cambio en wildcard: ${action}`, { error, wildcardId: wildcard.id });
	}
};

/**
 * Revalida las rutas de caché relacionadas con los wildcards
 */
const revalidateWildcardPaths = async (): Promise<void> => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
};

/**
 * Obtiene un wildcard por su ID
 */
export async function getWildcard(id: string): Promise<WildcardWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo wildcard por ID: ${id}`);

		const drizzleWildcard = await db
			.select({
				id: wildcards.id,
				name: wildcards.name,
				description: wildcards.description,
				emoji: wildcards.emoji,
				color: wildcards.color,
				category: wildcards.category,
				shortcut: wildcards.shortcut,
				children: wildcards.children,
				featuredImage: wildcards.featuredImage,
				isFavorite: wildcards.isFavorite,
				parentId: wildcards.parentId,
				createdAt: wildcards.createdAt,
				updatedAt: wildcards.updatedAt,
			})
			.from(wildcards)
			.where(eq(wildcards.id, id))
			.limit(1);

		if (drizzleWildcard.length === 0) {
			logger.warn(`Wildcard no encontrado: ${id}`);
			return null;
		}

		// Agregar _count vacío para el transformer
		const wildcardWithCounts = {
			...drizzleWildcard[0],
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
				prompts: 0,
				notes: 0,
				properties: 0,
				groups: 0,
			},
		};

		// Usar el transformer
		const result = fromDrizzleWildcard(wildcardWithCounts);
		if (result) {
			logger.info(`✅ Wildcard obtenido: ${result.name}`);
		}
		return result;
	} catch (error) {
		logger.error('❌ Error al obtener wildcard:', { id, error });
		throw createWildcardError('No se pudo obtener el wildcard', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene wildcards con opciones de filtrado
 */
export async function getWildcards(options: GetWildcardsOptions = {}): Promise<GetWildcardsResult> {
	try {
		const { search, orderBy = 'name', orderDirection = 'asc', onlyFavorites = false, parentId } = options;

		logger.info('🔍 Obteniendo wildcards', { options });

		// Construir filtros dinámicamente
		const conditions: Array<any> = [];

		if (onlyFavorites) {
			conditions.push(eq(wildcards.isFavorite, true));
		}

		if (parentId !== undefined) {
			if (parentId === null) {
				conditions.push(isNull(wildcards.parentId));
			} else {
				conditions.push(eq(wildcards.parentId, parentId));
			}
		}

		if (search) {
			conditions.push(or(like(wildcards.name, `%${search}%`), like(wildcards.description, `%${search}%`)));
		}

		// Aplicar filtros
		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Configurar ordenamiento
		const orderByClause = (() => {
			const direction = orderDirection === 'desc' ? desc : asc;
			switch (orderBy) {
				case 'createdAt':
					return direction(wildcards.createdAt);
				case 'updatedAt':
					return direction(wildcards.updatedAt);
				default:
					// Para name, primero favoritos luego por nombre
					return orderDirection === 'desc'
						? [desc(wildcards.isFavorite), desc(wildcards.name)]
						: [desc(wildcards.isFavorite), asc(wildcards.name)];
			}
		})();

		// Ejecutar consultas en paralelo
		const [drizzleWildcards, totalCount] = await Promise.all([
			db
				.select({
					id: wildcards.id,
					name: wildcards.name,
					description: wildcards.description,
					emoji: wildcards.emoji,
					color: wildcards.color,
					category: wildcards.category,
					shortcut: wildcards.shortcut,
					children: wildcards.children,
					featuredImage: wildcards.featuredImage,
					isFavorite: wildcards.isFavorite,
					parentId: wildcards.parentId,
					createdAt: wildcards.createdAt,
					updatedAt: wildcards.updatedAt,
				})
				.from(wildcards)
				.where(whereClause)
				.orderBy(...(Array.isArray(orderByClause) ? orderByClause : [orderByClause])),
			db
				.select({ count: count() })
				.from(wildcards)
				.where(whereClause)
				.then((result: any) => result[0]?.count || 0),
		]);

		// Transformar a formato WildcardWithStats usando el transformer
		const result = drizzleWildcards.map((wildcard: any) => {
			// Agregar _count vacío para el transformer
			const wildcardWithCounts = {
				...wildcard,
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
					prompts: 0,
					notes: 0,
					properties: 0,
					groups: 0,
				},
			};
			return fromDrizzleWildcard(wildcardWithCounts);
		});

		logger.info(`✅ ${result.length} wildcards obtenidos`);
		return {
			wildcards: result,
			total: totalCount,
		};
	} catch (error) {
		logger.error('❌ Error al obtener wildcards', { error, options });
		throw createWildcardError(
			`Error al obtener wildcards: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			EntityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Obtiene los wildcards raíz (sin padre)
 */
export async function getRootWildcards(): Promise<WildcardWithStats[]> {
	try {
		logger.info('🌳 Obteniendo wildcards raíz');
		const result = await getWildcards({ parentId: null });
		return result.wildcards;
	} catch (error) {
		logger.error('❌ Error al obtener wildcards raíz', { error });
		throw new WildcardServiceError(
			`Error al obtener wildcards raíz: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'GET_ROOT_WILDCARDS_FAILED',
			error
		);
	}
}

/**
 * Crea un nuevo wildcard
 */
export async function createWildcard(data: WildcardCreateInput): Promise<WildcardWithStats> {
	try {
		logger.info('📝 Creando nuevo wildcard', { name: data.name });

		// Validar que el padre existe si se especifica
		if (data.parentId) {
			const parentExists = await db
				.select({ id: wildcards.id })
				.from(wildcards)
				.where(eq(wildcards.id, data.parentId))
				.limit(1);

			if (parentExists.length === 0) {
				throw createWildcardError('El padre especificado no existe', EntityErrorCode.ENTITY_NOT_FOUND);
			}
		}

		const [newWildcard] = await db
			.insert(wildcards)
			.values({
				id: crypto.randomUUID(),
				name: data.name,
				description: data.description || null,
				emoji: data.emoji || null,
				color: data.color || null,
				category: data.category || null,
				shortcut: data.shortcut || null,
				children: data.children || null,
				featuredImage: data.featuredImage || null,
				isFavorite: Boolean(data.isFavorite) || false,
				parentId: data.parentId || null,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		// Revalidar rutas
		await revalidateWildcardPaths();

		// Agregar _count vacío para el transformer
		const wildcardWithCounts = {
			...newWildcard,
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
				prompts: 0,
				notes: 0,
				properties: 0,
				groups: 0,
			},
		};

		// Transformar resultado
		const result = fromDrizzleWildcard(wildcardWithCounts);
		if (!result) {
			throw createWildcardError('Error al transformar wildcard creado', EntityErrorCode.OPERATION_FAILED);
		}

		// Notificar creación
		await notifyWildcardChange('create', result);

		logger.info(`✅ Wildcard creado exitosamente: ${result.name}`, { id: result.id });
		return result;
	} catch (error) {
		logger.error('❌ Error al crear wildcard', { error, data });
		throw createWildcardError(
			`Error al crear wildcard: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			EntityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Actualiza un wildcard existente
 */
export async function updateWildcard(id: string, data: WildcardUpdateInput): Promise<WildcardWithStats> {
	try {
		logger.info(`📝 Actualizando wildcard: ${id}`, { changes: Object.keys(data) });

		// Verificar si el wildcard existe
		const existingWildcard = await db.select({ id: wildcards.id }).from(wildcards).where(eq(wildcards.id, id)).limit(1);

		if (existingWildcard.length === 0) {
			throw createWildcardError('Wildcard no encontrado', EntityErrorCode.ENTITY_NOT_FOUND);
		}

		// Validar que el nuevo padre existe si se especifica
		if (data.parentId) {
			const parentExists = await db
				.select({ id: wildcards.id })
				.from(wildcards)
				.where(eq(wildcards.id, data.parentId))
				.limit(1);

			if (parentExists.length === 0) {
				throw createWildcardError('El padre especificado no existe', EntityErrorCode.ENTITY_NOT_FOUND);
			}
		}

		// Construir datos de actualización
		const updateData: any = {
			updatedAt: new Date(),
		};

		if (data.name !== undefined) updateData.name = data.name;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.emoji !== undefined) updateData.emoji = data.emoji;
		if (data.color !== undefined) updateData.color = data.color;
		if (data.category !== undefined) updateData.category = data.category;
		if (data.shortcut !== undefined) updateData.shortcut = data.shortcut;
		if (data.children !== undefined) updateData.children = data.children;
		if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
		if (data.isFavorite !== undefined) updateData.isFavorite = Boolean(data.isFavorite);
		if (data.parentId !== undefined) updateData.parentId = data.parentId;

		const [updatedWildcard] = await db.update(wildcards).set(updateData).where(eq(wildcards.id, id)).returning();

		// Revalidar rutas
		await revalidateWildcardPaths();

		// Agregar _count vacío para el transformer
		const wildcardWithCounts = {
			...updatedWildcard,
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
				prompts: 0,
				notes: 0,
				properties: 0,
				groups: 0,
			},
		};

		// Transformar resultado
		const result = fromDrizzleWildcard(wildcardWithCounts);
		if (!result) {
			throw createWildcardError('Error al transformar wildcard actualizado', EntityErrorCode.OPERATION_FAILED);
		}

		// Notificar actualización
		await notifyWildcardChange('update', result);

		logger.info(`✅ Wildcard actualizado exitosamente: ${result.name}`, { id });
		return result;
	} catch (error) {
		logger.error(`❌ Error al actualizar wildcard ${id}`, { error, data });
		throw createWildcardError(
			`Error al actualizar wildcard: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			EntityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Elimina un wildcard
 * Asegura que los hijos (si los hay) se reasignan al abuelo o se convierten en raíz
 */
export async function deleteWildcard(id: string): Promise<void> {
	try {
		logger.warn(`🗑️ Eliminando wildcard: ${id}`);

		// Usar una transacción para asegurar la atomicidad de la operación
		await db.transaction(async (tx: any) => {
			// Obtener información del wildcard a eliminar
			const wildcard = await tx
				.select({
					id: wildcards.id,
					parentId: wildcards.parentId,
				})
				.from(wildcards)
				.where(eq(wildcards.id, id))
				.limit(1);

			if (wildcard.length === 0) {
				logger.warn(`Wildcard a eliminar no encontrado: ${id}`);
				return;
			}

			const wildcardData = wildcard[0];

			// Obtener hijos del wildcard a eliminar
			const children = await tx.select({ id: wildcards.id }).from(wildcards).where(eq(wildcards.parentId, id));

			// Reasignar hijos al padre del wildcard eliminado (o null para convertirlos en raíz)
			if (children.length > 0) {
				await tx.update(wildcards).set({ parentId: wildcardData.parentId }).where(eq(wildcards.parentId, id));

				logger.info(`📋 Reasignados ${children.length} hijos al padre: ${wildcardData.parentId || 'raíz'}`);
			}

			// Eliminar el wildcard
			await tx.delete(wildcards).where(eq(wildcards.id, id));
		});

		// Revalidar rutas
		await revalidateWildcardPaths();

		// Notificar eliminación
		await notifyWildcardChange('delete', { id });

		logger.info(`✅ Wildcard eliminado exitosamente: ${id}`);
	} catch (error) {
		logger.error(`❌ Error al eliminar wildcard ${id}`, { error });
		throw createWildcardError(
			`Error al eliminar wildcard: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			EntityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Mueve un wildcard a un nuevo padre
 */
export async function moveWildcard(id: string, newParentId: string | null): Promise<WildcardWithStats> {
	try {
		logger.info(`🔄 Moviendo wildcard ${id} a nuevo padre: ${newParentId || 'raíz'}`);

		// Validar que no se cree un ciclo
		if (newParentId) {
			// Verificar que el nuevo padre existe
			const newParent = await db
				.select({
					id: wildcards.id,
					parentId: wildcards.parentId,
				})
				.from(wildcards)
				.where(eq(wildcards.id, newParentId))
				.limit(1);

			if (newParent.length === 0) {
				throw createWildcardError('El padre especificado no existe', EntityErrorCode.ENTITY_NOT_FOUND);
			}

			// Verificar que el nuevo padre no sea descendiente del wildcard a mover
			let currentParent = newParent[0];
			while (currentParent?.parentId) {
				if (currentParent.parentId === id) {
					throw createWildcardError(
						'No se puede mover un wildcard a uno de sus descendientes',
						EntityErrorCode.OPERATION_FAILED
					);
				}

				// Obtener el siguiente padre en la jerarquía
				const nextParent = await db
					.select({
						id: wildcards.id,
						parentId: wildcards.parentId,
					})
					.from(wildcards)
					.where(eq(wildcards.id, currentParent.parentId))
					.limit(1);

				currentParent = nextParent.length > 0 ? nextParent[0] : null;
			}
		}

		// Actualizar el parentId del wildcard
		await db
			.update(wildcards)
			.set({
				parentId: newParentId,
				updatedAt: new Date(),
			})
			.where(eq(wildcards.id, id));

		// Revalidar rutas
		await revalidateWildcardPaths();

		// Obtener el wildcard movido con estadísticas
		const result = await getWildcard(id);
		if (!result) {
			throw createWildcardError('No se pudo recuperar el wildcard movido', EntityErrorCode.ENTITY_NOT_FOUND);
		}

		// Notificar movimiento
		await notifyWildcardChange('move', result);

		logger.info(`✅ Wildcard movido exitosamente: ${id} -> ${newParentId || 'raíz'}`);
		return result;
	} catch (error) {
		logger.error(`❌ Error al mover wildcard ${id}`, { error, newParentId });
		throw createWildcardError(
			`Error al mover wildcard: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			EntityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Cambia el estado de favorito de un wildcard
 */
export async function toggleWildcardFavorite(id: string): Promise<WildcardWithStats> {
	try {
		logger.info(`⭐ Cambiando estado de favorito del wildcard: ${id}`);

		// Obtener estado actual
		const currentWildcard = await db
			.select({ isFavorite: wildcards.isFavorite })
			.from(wildcards)
			.where(eq(wildcards.id, id))
			.limit(1);

		if (currentWildcard.length === 0) {
			throw createWildcardError('Wildcard no encontrado', EntityErrorCode.ENTITY_NOT_FOUND);
		}

		const newFavoriteState = !currentWildcard[0].isFavorite;

		// Actualizar el estado de favorito
		await db
			.update(wildcards)
			.set({
				isFavorite: newFavoriteState,
				updatedAt: new Date(),
			})
			.where(eq(wildcards.id, id));

		// Revalidar rutas
		await revalidateWildcardPaths();

		// Obtener el wildcard actualizado
		const result = await getWildcard(id);
		if (!result) {
			throw createWildcardError('No se pudo recuperar el wildcard actualizado', EntityErrorCode.ENTITY_NOT_FOUND);
		}

		// Notificar actualización
		await notifyWildcardChange('update', result);

		logger.info(`✅ Estado de favorito cambiado: ${id} -> ${result.isFavorite}`);
		return result;
	} catch (error) {
		logger.error(`❌ Error al cambiar estado de favorito del wildcard ${id}`, { error });
		throw createWildcardError(
			`Error al cambiar estado de favorito: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			EntityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Busca wildcards por nombre, descripción o contenido
 */
export async function searchWildcards(query: string): Promise<WildcardWithStats[]> {
	try {
		logger.info(`🔍 Buscando wildcards: "${query}"`);
		const result = await getWildcards({ search: query });
		logger.info(`✅ ${result.wildcards.length} wildcards encontrados para "${query}"`);
		return result.wildcards;
	} catch (error) {
		logger.error(`❌ Error al buscar wildcards: "${query}"`, { error });
		throw new WildcardServiceError(
			`Error al buscar wildcards: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'SEARCH_WILDCARDS_FAILED',
			error
		);
	}
}

// Servicio principal
const wildcardService = {
	getWildcard,
	getWildcards,
	getRootWildcards,
	createWildcard,
	updateWildcard,
	deleteWildcard,
	moveWildcard,
	toggleWildcardFavorite,
	searchWildcards,
	notifyWildcardChange,
	WILDCARD_EVENTS,
	WildcardServiceError,
};

export default wildcardService;

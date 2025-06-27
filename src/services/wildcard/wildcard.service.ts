/**
 * @file Servicio de gestión de wildcards
 * @module services/wildcard/wildcard.service
 * @description Servicio centralizado para operaciones CRUD y lógica de negocio de wildcards con jerarquías
 * @updated 2025-01-27
 */

import { getPrismaClient } from '@/lib/database/db';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import {
	mapCreateWildcardDataToPrisma,
	mapUpdateWildcardDataToPrisma,
	toWildcardWithStats,
} from '@/transformers/wildcard';
import type { WildcardCreateInput, WildcardUpdateInput, WildcardWithStats } from '@/types/entities/wildcard';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

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

// Payload para incluir los conteos necesarios para las estadísticas
const wildcardIncludeWithCounts = {
	tags: true, // Incluimos tags para verlos en la UI si es necesario
	_count: {
		select: {
			tags: true,
			images: true,
			characters: true,
			places: true,
			notes: true,
		},
	},
} satisfies Prisma.WildcardInclude;

type PrismaWildcardWithData = Prisma.WildcardGetPayload<{
	include: typeof wildcardIncludeWithCounts;
}>;

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
		const prisma = await getPrismaClient();

		const wildcard = await prisma.wildcard.findUnique({
			where: { id },
			include: wildcardIncludeWithCounts,
		});

		if (!wildcard) {
			logger.warn(`Wildcard no encontrado: ${id}`);
			return null;
		}

		const result = toWildcardWithStats(wildcard as PrismaWildcardWithData);
		logger.info(`✅ Wildcard encontrado: ${result.name}`);
		return result;
	} catch (error) {
		logger.error(`❌ Error al obtener wildcard ${id}`, { error });
		throw new WildcardServiceError(
			`Error al obtener wildcard: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'GET_WILDCARD_FAILED',
			error
		);
	}
}

/**
 * Obtiene wildcards con opciones de filtrado
 */
export async function getWildcards(options: GetWildcardsOptions = {}): Promise<GetWildcardsResult> {
	try {
		const { search, orderBy = 'name', orderDirection = 'asc', onlyFavorites = false, parentId } = options;

		logger.info('🔍 Obteniendo wildcards', { options });
		const prisma = await getPrismaClient();

		// Construir filtros
		const where: Prisma.WildcardWhereInput = {};

		if (onlyFavorites) {
			where.isFavorite = true;
		}

		if (parentId !== undefined) {
			where.parentId = parentId;
		}

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ description: { contains: search, mode: 'insensitive' } },
				{ content: { contains: search, mode: 'insensitive' } },
			];
		}

		// Obtener wildcards
		const [wildcards, total] = await Promise.all([
			prisma.wildcard.findMany({
				where,
				include: wildcardIncludeWithCounts,
				orderBy:
					orderBy === 'name' ? [{ isFavorite: 'desc' }, { name: orderDirection }] : { [orderBy]: orderDirection },
			}),
			prisma.wildcard.count({ where }),
		]);

		const transformedWildcards = wildcards.map((w) => toWildcardWithStats(w as PrismaWildcardWithData));

		logger.info(`✅ ${transformedWildcards.length} wildcards obtenidos`);
		return {
			wildcards: transformedWildcards,
			total,
		};
	} catch (error) {
		logger.error('❌ Error al obtener wildcards', { error, options });
		throw new WildcardServiceError(
			`Error al obtener wildcards: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'GET_WILDCARDS_FAILED',
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
		const prisma = await getPrismaClient();

		const prismaData = mapCreateWildcardDataToPrisma(data);

		const newWildcard = await prisma.wildcard.create({
			data: prismaData,
		});

		// Revalidar rutas
		await revalidateWildcardPaths();

		// Obtener el wildcard con estadísticas
		const result = await getWildcard(newWildcard.id);
		if (!result) {
			throw new WildcardServiceError('No se pudo recuperar el wildcard recién creado', 'WILDCARD_NOT_FOUND');
		}

		// Notificar creación
		await notifyWildcardChange('create', result);

		logger.info(`✅ Wildcard creado exitosamente: ${result.name}`, { id: result.id });
		return result;
	} catch (error) {
		logger.error('❌ Error al crear wildcard', { error, data });
		throw new WildcardServiceError(
			`Error al crear wildcard: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'CREATE_WILDCARD_FAILED',
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
		const prisma = await getPrismaClient();

		// Verificar si el wildcard existe
		const existingWildcard = await prisma.wildcard.findUnique({
			where: { id },
			select: { id: true },
		});

		if (!existingWildcard) {
			throw new WildcardServiceError('Wildcard no encontrado', 'WILDCARD_NOT_FOUND');
		}

		const prismaData = mapUpdateWildcardDataToPrisma(data);

		await prisma.wildcard.update({
			where: { id },
			data: prismaData,
		});

		// Revalidar rutas
		await revalidateWildcardPaths();

		// Obtener el wildcard actualizado con estadísticas
		const result = await getWildcard(id);
		if (!result) {
			throw new WildcardServiceError('No se pudo recuperar el wildcard actualizado', 'WILDCARD_NOT_FOUND');
		}

		// Notificar actualización
		await notifyWildcardChange('update', result);

		logger.info(`✅ Wildcard actualizado exitosamente: ${result.name}`, { id });
		return result;
	} catch (error) {
		logger.error(`❌ Error al actualizar wildcard ${id}`, { error, data });
		throw new WildcardServiceError(
			`Error al actualizar wildcard: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'UPDATE_WILDCARD_FAILED',
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
		const prisma = await getPrismaClient();

		// Usar una transacción para asegurar la atomicidad de la operación
		await prisma.$transaction(async (tx) => {
			const wildcard = await tx.wildcard.findUnique({
				where: { id },
				select: { parentId: true, childWildcards: { select: { id: true } } },
			});

			if (!wildcard) {
				logger.warn(`Wildcard a eliminar no encontrado: ${id}`);
				return;
			}

			// Reasignar hijos al padre del wildcard eliminado
			if (wildcard.childWildcards.length > 0) {
				await tx.wildcard.updateMany({
					where: { parentId: id },
					data: { parentId: wildcard.parentId },
				});
			}

			await tx.wildcard.delete({ where: { id } });
		});

		// Revalidar rutas
		await revalidateWildcardPaths();

		// Notificar eliminación
		await notifyWildcardChange('delete', { id });

		logger.info(`✅ Wildcard eliminado exitosamente: ${id}`);
	} catch (error) {
		logger.error(`❌ Error al eliminar wildcard ${id}`, { error });
		throw new WildcardServiceError(
			`Error al eliminar wildcard: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'DELETE_WILDCARD_FAILED',
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
		const prisma = await getPrismaClient();

		// Validar que no se cree un ciclo
		if (newParentId) {
			const newParent: any = await prisma.wildcard.findUnique({
				where: { id: newParentId },
				select: { id: true, parentId: true },
			});

			if (!newParent) {
				throw new WildcardServiceError('El padre especificado no existe', 'PARENT_NOT_FOUND');
			}

			// Verificar que el nuevo padre no sea descendiente del wildcard a mover
			let currentParent = newParent;
			while (currentParent?.parentId) {
				if (currentParent.parentId === id) {
					throw new WildcardServiceError(
						'No se puede mover un wildcard a uno de sus descendientes',
						'CIRCULAR_HIERARCHY'
					);
				}
				currentParent = await prisma.wildcard.findUnique({
					where: { id: currentParent.parentId },
					select: { id: true, parentId: true },
				});
			}
		}

		await prisma.wildcard.update({
			where: { id },
			data: { parentId: newParentId },
		});

		// Revalidar rutas
		await revalidateWildcardPaths();

		// Obtener el wildcard movido con estadísticas
		const result = await getWildcard(id);
		if (!result) {
			throw new WildcardServiceError('No se pudo recuperar el wildcard movido', 'WILDCARD_NOT_FOUND');
		}

		// Notificar movimiento
		await notifyWildcardChange('move', result);

		logger.info(`✅ Wildcard movido exitosamente: ${id} -> ${newParentId || 'raíz'}`);
		return result;
	} catch (error) {
		logger.error(`❌ Error al mover wildcard ${id}`, { error, newParentId });
		throw new WildcardServiceError(
			`Error al mover wildcard: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'MOVE_WILDCARD_FAILED',
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
		const prisma = await getPrismaClient();

		// Obtener estado actual
		const currentWildcard = await prisma.wildcard.findUnique({
			where: { id },
			select: { isFavorite: true },
		});

		if (!currentWildcard) {
			throw new WildcardServiceError('Wildcard no encontrado', 'WILDCARD_NOT_FOUND');
		}

		await prisma.wildcard.update({
			where: { id },
			data: { isFavorite: !currentWildcard.isFavorite },
		});

		// Revalidar rutas
		await revalidateWildcardPaths();

		// Obtener el wildcard actualizado
		const result = await getWildcard(id);
		if (!result) {
			throw new WildcardServiceError('No se pudo recuperar el wildcard actualizado', 'WILDCARD_NOT_FOUND');
		}

		// Notificar actualización
		await notifyWildcardChange('update', result);

		logger.info(`✅ Estado de favorito cambiado: ${id} -> ${result.isFavorite}`);
		return result;
	} catch (error) {
		logger.error(`❌ Error al cambiar estado de favorito del wildcard ${id}`, { error });
		throw new WildcardServiceError(
			`Error al cambiar estado de favorito: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'TOGGLE_FAVORITE_FAILED',
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

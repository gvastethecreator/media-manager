'use server';

/**
 * @file Server Actions para la entidad Wildcard
 * @module app/actions/wildcards/wildcard.actions
 * @description Controladores delgados que llaman al servicio de wildcards
 * @updated 2025-01-27
 */

import { serverLogger } from '@/lib/logger/server-logger';
import wildcardService, { type GetWildcardsOptions } from '@/services/wildcard/wildcard.service';
import type { WildcardCreateInput, WildcardUpdateInput, WildcardWithStats } from '@/types/entities/wildcard';

const logger = serverLogger.withContext('WildcardActions');

/**
 * Obtiene todos los wildcards del sistema
 */
export async function getWildcards(options?: GetWildcardsOptions): Promise<WildcardWithStats[]> {
	try {
		logger.info('📋 Obteniendo wildcards via action', { options });
		const result = await wildcardService.getWildcards(options);
		return result.wildcards;
	} catch (error) {
		logger.error('❌ Error en action getWildcards', { error, options });
		throw error;
	}
}

/**
 * Obtiene un único wildcard por su ID
 */
export async function getWildcard(id: string): Promise<WildcardWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo wildcard ${id} via action`);
		return await wildcardService.getWildcard(id);
	} catch (error) {
		logger.error(`❌ Error en action getWildcard: ${id}`, { error });
		throw error;
	}
}

/**
 * Obtiene los wildcards raíz (sin padre)
 */
export async function getRootWildcards(): Promise<WildcardWithStats[]> {
	try {
		logger.info('🌳 Obteniendo wildcards raíz via action');
		return await wildcardService.getRootWildcards();
	} catch (error) {
		logger.error('❌ Error en action getRootWildcards', { error });
		throw error;
	}
}

/**
 * Crea un nuevo wildcard
 */
export async function createWildcard(data: WildcardCreateInput): Promise<WildcardWithStats> {
	try {
		logger.info('📝 Creando wildcard via action', { name: data.name });
		return await wildcardService.createWildcard(data);
	} catch (error) {
		logger.error('❌ Error en action createWildcard', { error, data });
		throw error;
	}
}

/**
 * Actualiza un wildcard existente
 */
export async function updateWildcard(id: string, data: WildcardUpdateInput): Promise<WildcardWithStats> {
	try {
		logger.info(`📝 Actualizando wildcard ${id} via action`, { changes: Object.keys(data) });
		return await wildcardService.updateWildcard(id, data);
	} catch (error) {
		logger.error(`❌ Error en action updateWildcard: ${id}`, { error, data });
		throw error;
	}
}

/**
 * Elimina un wildcard
 * Asegura que los hijos (si los hay) se reasignan al abuelo o se convierten en raíz
 */
export async function deleteWildcard(id: string): Promise<void> {
	try {
		logger.info(`🗑️ Eliminando wildcard ${id} via action`);
		await wildcardService.deleteWildcard(id);
	} catch (error) {
		logger.error(`❌ Error en action deleteWildcard: ${id}`, { error });
		throw error;
	}
}

/**
 * Mueve un wildcard a un nuevo padre
 */
export async function moveWildcard(id: string, newParentId: string | null): Promise<WildcardWithStats> {
	try {
		logger.info(`🔄 Moviendo wildcard ${id} a nuevo padre: ${newParentId || 'raíz'} via action`);
		return await wildcardService.moveWildcard(id, newParentId);
	} catch (error) {
		logger.error(`❌ Error en action moveWildcard: ${id}`, { error, newParentId });
		throw error;
	}
}

/**
 * Cambia el estado de favorito de un wildcard
 */
export async function toggleWildcardFavorite(id: string): Promise<WildcardWithStats> {
	try {
		logger.info(`⭐ Cambiando favorito de wildcard ${id} via action`);
		return await wildcardService.toggleWildcardFavorite(id);
	} catch (error) {
		logger.error(`❌ Error en action toggleWildcardFavorite: ${id}`, { error });
		throw error;
	}
}

/**
 * Busca wildcards por nombre, descripción o contenido
 */
export async function searchWildcards(query: string): Promise<WildcardWithStats[]> {
	try {
		logger.info(`🔍 Buscando wildcards "${query}" via action`);
		return await wildcardService.searchWildcards(query);
	} catch (error) {
		logger.error(`❌ Error en action searchWildcards: "${query}"`, { error });
		throw error;
	}
}

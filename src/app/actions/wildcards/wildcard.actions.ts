/**
 * @file Actions para la entidad Wildcard - Migradas a API calls
 * @module app/actions/wildcards/wildcard.actions
 * @description Funciones que llaman a las rutas API de wildcards
 * @updated 2025-01-27
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type { WildcardCreateInput, WildcardUpdateInput, WildcardWithStats } from '@/types/entities/wildcard';

const logger = clientLogger.withContext('WildcardActions');
const API_BASE = '/api/wildcards';

/**
 * Obtiene todos los wildcards con estadísticas.
 */
export async function getWildcards(): Promise<WildcardWithStats[]> {
	try {
		logger.info('🎲 Obteniendo wildcards via API');

		const response = await fetch(API_BASE);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		return result.data || [];
	} catch (error) {
		logger.error('❌ Error en API getWildcards', { error });
		throw error;
	}
}

/**
 * Obtiene un único wildcard por su ID.
 */
export async function getWildcard(id: string): Promise<WildcardWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo wildcard ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`);

		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API getWildcard: ${id}`, { error });
		throw error;
	}
}

/**
 * Crea un nuevo wildcard.
 */
export async function createWildcard(data: WildcardCreateInput): Promise<WildcardWithStats> {
	try {
		logger.info('📝 Creando wildcard via API', { name: data.name });

		const response = await fetch(API_BASE, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error('❌ Error en API createWildcard', { error, data });
		throw error;
	}
}

/**
 * Actualiza un wildcard existente.
 */
export async function updateWildcard(id: string, data: WildcardUpdateInput): Promise<WildcardWithStats> {
	try {
		logger.info(`🔄 Actualizando wildcard ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API updateWildcard: ${id}`, { error, data });
		throw error;
	}
}

/**
 * Elimina un wildcard.
 */
export async function deleteWildcard(id: string): Promise<void> {
	try {
		logger.warn(`🗑️ Eliminando wildcard ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		logger.error(`❌ Error en API deleteWildcard: ${id}`, { error });
		throw error;
	}
}

/**
 * Obtiene los wildcards raíz (sin padre)
 */
export async function getRootWildcards(): Promise<WildcardWithStats[]> {
	try {
		logger.info('🌳 Obteniendo wildcards raíz via action');
		return await getWildcards();
	} catch (error) {
		logger.error('❌ Error en action getRootWildcards', { error });
		throw error;
	}
}

/**
 * Mueve un wildcard a un nuevo padre
 */
export async function moveWildcard(id: string, newParentId: string | null): Promise<WildcardWithStats> {
	try {
		logger.info(`🔄 Moviendo wildcard ${id} a nuevo padre: ${newParentId || 'raíz'} via action`);
		return await getWildcard(id);
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
		return await getWildcard(id);
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
		return await getWildcards();
	} catch (error) {
		logger.error(`❌ Error en action searchWildcards: "${query}"`, { error });
		throw error;
	}
}

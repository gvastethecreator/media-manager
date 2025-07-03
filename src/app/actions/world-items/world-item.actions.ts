/**
 * @file Actions para la entidad WorldItem - Migradas a API calls
 * @module app/actions/world-items/world-item.actions
 * @description Funciones que llaman a las rutas API de world items
 * @updated 2025-01-27
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type { WorldItemCreateInput, WorldItemUpdateInput, WorldItemWithStats } from '@/types/entities/world-item';

const logger = clientLogger.withContext('WorldItemActions');
const API_BASE = '/api/world-items';

/**
 * Obtiene todos los world items con estadísticas.
 */
export async function getWorldItems(): Promise<WorldItemWithStats[]> {
	try {
		logger.info('🌍 Obteniendo world items via API');

		const response = await fetch(API_BASE);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		return result.data || [];
	} catch (error) {
		logger.error('❌ Error en API getWorldItems', { error });
		throw error;
	}
}

/**
 * Obtiene un único world item por su ID.
 */
export async function getWorldItem(id: string): Promise<WorldItemWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo world item ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`);

		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API getWorldItem: ${id}`, { error });
		throw error;
	}
}

/**
 * Crea un nuevo world item.
 */
export async function createWorldItem(data: WorldItemCreateInput): Promise<WorldItemWithStats> {
	try {
		logger.info('📝 Creando world item via API', { name: data.name });

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
		logger.error('❌ Error en API createWorldItem', { error, data });
		throw error;
	}
}

/**
 * Actualiza un world item existente.
 */
export async function updateWorldItem(id: string, data: WorldItemUpdateInput): Promise<WorldItemWithStats> {
	try {
		logger.info(`🔄 Actualizando world item ${id} via API`);

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
		logger.error(`❌ Error en API updateWorldItem: ${id}`, { error, data });
		throw error;
	}
}

/**
 * Elimina un world item.
 */
export async function deleteWorldItem(id: string): Promise<void> {
	try {
		logger.warn(`🗑️ Eliminando world item ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		logger.error(`❌ Error en API deleteWorldItem: ${id}`, { error });
		throw error;
	}
}

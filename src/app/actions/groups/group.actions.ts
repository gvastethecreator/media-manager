/**
 * @file Actions para la entidad Group - Migradas a API calls
 * @module app/actions/groups/group.actions
 * @description Funciones que llaman a las rutas API de grupos
 * @updated 2025-01-27
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type { GroupCreateInput, GroupUpdateInput, GroupWithStats } from '@/types/entities/group';

const logger = clientLogger.withContext('GroupActions');
const API_BASE = '/api/groups';

/**
 * Obtiene todos los grupos con estadísticas.
 */
export async function getGroups(): Promise<GroupWithStats[]> {
	try {
		logger.info('👥 Obteniendo grupos via API');

		const response = await fetch(API_BASE);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		return result.data || [];
	} catch (error) {
		logger.error('❌ Error en API getGroups', { error });
		throw error;
	}
}

/**
 * Obtiene un único grupo por su ID.
 */
export async function getGroup(id: string): Promise<GroupWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo grupo ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`);

		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API getGroup: ${id}`, { error });
		throw error;
	}
}

/**
 * Crea un nuevo grupo.
 */
export async function createGroup(data: GroupCreateInput): Promise<GroupWithStats> {
	try {
		logger.info('📝 Creando grupo via API', { name: data.name });

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
		logger.error('❌ Error en API createGroup', { error, data });
		throw error;
	}
}

/**
 * Actualiza un grupo existente.
 */
export async function updateGroup(id: string, data: GroupUpdateInput): Promise<GroupWithStats> {
	try {
		logger.info(`🔄 Actualizando grupo ${id} via API`);

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
		logger.error(`❌ Error en API updateGroup: ${id}`, { error, data });
		throw error;
	}
}

/**
 * Elimina un grupo.
 */
export async function deleteGroup(id: string): Promise<void> {
	try {
		logger.warn(`🗑️ Eliminando grupo ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		logger.error(`❌ Error en API deleteGroup: ${id}`, { error });
		throw error;
	}
}

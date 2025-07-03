/**
 * @file Actions para la entidad Place - Migradas a API calls
 * @module app/actions/places/place.actions
 * @description Funciones que llaman a las rutas API de lugares
 * @updated 2025-01-27
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type { PlaceCreateInput, PlaceUpdateInput, PlaceWithStats } from '@/types/entities/place';

const logger = clientLogger.withContext('PlaceActions');
const API_BASE = '/api/places';

/**
 * Obtiene todos los lugares con estadísticas.
 */
export async function getPlaces(): Promise<PlaceWithStats[]> {
	try {
		logger.info('📍 Obteniendo lugares via API');

		const response = await fetch(API_BASE);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		return result.data || [];
	} catch (error) {
		logger.error('❌ Error en API getPlaces', { error });
		throw error;
	}
}

/**
 * Obtiene un único lugar por su ID.
 */
export async function getPlace(id: string): Promise<PlaceWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo lugar ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`);

		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API getPlace: ${id}`, { error });
		throw error;
	}
}

/**
 * Crea un nuevo lugar.
 */
export async function createPlace(data: PlaceCreateInput): Promise<PlaceWithStats> {
	try {
		logger.info('📝 Creando lugar via API', { name: data.name });

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
		logger.error('❌ Error en API createPlace', { error, data });
		throw error;
	}
}

/**
 * Actualiza un lugar existente.
 */
export async function updatePlace(id: string, data: PlaceUpdateInput): Promise<PlaceWithStats> {
	try {
		logger.info(`🔄 Actualizando lugar ${id} via API`);

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
		logger.error(`❌ Error en API updatePlace: ${id}`, { error, data });
		throw error;
	}
}

/**
 * Elimina un lugar.
 */
export async function deletePlace(id: string): Promise<void> {
	try {
		logger.warn(`🗑️ Eliminando lugar ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		logger.error(`❌ Error en API deletePlace: ${id}`, { error });
		throw error;
	}
}

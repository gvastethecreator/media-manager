/**
 * @file Actions para la entidad Property - Migradas a API calls
 * @module app/actions/properties/property.actions
 * @description Funciones que llaman a las rutas API de propiedades
 * @updated 2025-01-27
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type { PropertyCreateInput, PropertyUpdateInput, PropertyWithStats } from '@/types/entities/property';

const logger = clientLogger.withContext('PropertyActions');
const API_BASE = '/api/properties';

/**
 * Obtiene todas las propiedades con estadísticas.
 */
export async function getProperties(): Promise<PropertyWithStats[]> {
	try {
		logger.info('🏷️ Obteniendo propiedades via API');

		const response = await fetch(API_BASE);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		return result.data || [];
	} catch (error) {
		logger.error('❌ Error en API getProperties', { error });
		throw error;
	}
}

/**
 * Obtiene una única propiedad por su ID.
 */
export async function getProperty(id: string): Promise<PropertyWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo propiedad ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`);

		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API getProperty: ${id}`, { error });
		throw error;
	}
}

/**
 * Crea una nueva propiedad.
 */
export async function createProperty(data: PropertyCreateInput): Promise<PropertyWithStats> {
	try {
		logger.info('📝 Creando propiedad via API', { name: data.name });

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
		logger.error('❌ Error en API createProperty', { error, data });
		throw error;
	}
}

/**
 * Actualiza una propiedad existente.
 */
export async function updateProperty(id: string, data: PropertyUpdateInput): Promise<PropertyWithStats> {
	try {
		logger.info(`🔄 Actualizando propiedad ${id} via API`);

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
		logger.error(`❌ Error en API updateProperty: ${id}`, { error, data });
		throw error;
	}
}

/**
 * Elimina una propiedad.
 */
export async function deleteProperty(id: string): Promise<void> {
	try {
		logger.warn(`🗑️ Eliminando propiedad ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		logger.error(`❌ Error en API deleteProperty: ${id}`, { error });
		throw error;
	}
}

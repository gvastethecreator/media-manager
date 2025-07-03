/**
 * @file Actions para la entidad Concept - Migradas a API calls
 * @module app/actions/concepts/concept.actions
 * @description Funciones que llaman a las rutas API de conceptos
 * @updated 2025-01-27
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type { ConceptCreateInput, ConceptUpdateInput, ConceptWithStats } from '@/types/entities/concept';

const logger = clientLogger.withContext('ConceptActions');
const API_BASE = '/api/concepts';

/**
 * Obtiene todos los conceptos con estadísticas.
 */
export async function getConcepts(): Promise<ConceptWithStats[]> {
	try {
		logger.info('💡 Obteniendo conceptos via API');

		const response = await fetch(API_BASE);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		return result.data || [];
	} catch (error) {
		logger.error('❌ Error en API getConcepts', { error });
		throw error;
	}
}

/**
 * Obtiene un único concepto por su ID.
 */
export async function getConcept(id: string): Promise<ConceptWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo concepto ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`);

		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API getConcept: ${id}`, { error });
		throw error;
	}
}

/**
 * Crea un nuevo concepto.
 */
export async function createConcept(data: ConceptCreateInput): Promise<ConceptWithStats> {
	try {
		logger.info('📝 Creando concepto via API', { name: data.name });

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
		logger.error('❌ Error en API createConcept', { error, data });
		throw error;
	}
}

/**
 * Actualiza un concepto existente.
 */
export async function updateConcept(id: string, data: ConceptUpdateInput): Promise<ConceptWithStats> {
	try {
		logger.info(`🔄 Actualizando concepto ${id} via API`);

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
		logger.error(`❌ Error en API updateConcept: ${id}`, { error, data });
		throw error;
	}
}

/**
 * Elimina un concepto.
 */
export async function deleteConcept(id: string): Promise<void> {
	try {
		logger.warn(`🗑️ Eliminando concepto ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		logger.error(`❌ Error en API deleteConcept: ${id}`, { error });
		throw error;
	}
}

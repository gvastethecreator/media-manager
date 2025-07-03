/**
 * @file Actions para la entidad Prompt - Migradas a API calls
 * @module app/actions/prompts/prompt.actions
 * @description Funciones que llaman a las rutas API de prompts
 * @updated 2025-01-27
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type { PromptCreateInput, PromptUpdateInput, PromptWithStats } from '@/types/entities/prompt';

const logger = clientLogger.withContext('PromptActions');
const API_BASE = '/api/prompts';

/**
 * Obtiene todos los prompts con estadísticas.
 */
export async function getPrompts(): Promise<PromptWithStats[]> {
	try {
		logger.info('🎨 Obteniendo prompts via API');

		const response = await fetch(API_BASE);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		return result.data || [];
	} catch (error) {
		logger.error('❌ Error en API getPrompts', { error });
		throw error;
	}
}

/**
 * Obtiene un único prompt por su ID.
 */
export async function getPrompt(id: string): Promise<PromptWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo prompt ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`);

		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API getPrompt: ${id}`, { error });
		throw error;
	}
}

/**
 * Crea un nuevo prompt.
 */
export async function createPrompt(data: PromptCreateInput): Promise<PromptWithStats> {
	try {
		logger.info('📝 Creando prompt via API', { name: data.name });

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
		logger.error('❌ Error en API createPrompt', { error, data });
		throw error;
	}
}

/**
 * Actualiza un prompt existente.
 */
export async function updatePrompt(id: string, data: PromptUpdateInput): Promise<PromptWithStats> {
	try {
		logger.info(`🔄 Actualizando prompt ${id} via API`);

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
		logger.error(`❌ Error en API updatePrompt: ${id}`, { error, data });
		throw error;
	}
}

/**
 * Elimina un prompt.
 */
export async function deletePrompt(id: string): Promise<void> {
	try {
		logger.warn(`🗑️ Eliminando prompt ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		logger.error(`❌ Error en API deletePrompt: ${id}`, { error });
		throw error;
	}
}

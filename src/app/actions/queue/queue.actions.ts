/**
 * @file Cliente de API para la entidad QueueJob
 * @module app/actions/queue/queue.actions
 * @description Funciones que llaman a las rutas API de trabajos en cola
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type {
	CreateQueueJobInput,
	PaginatedQueueJobs,
	QueueJobExtended,
	QueueJobFilters,
	QueueJobPaginationOptions,
	QueueStats,
	UpdateQueueJobInput,
} from '@/types/entities/queue-job';

const logger = clientLogger.withContext('QueueActions');
const API_BASE = '/api/queue';

/**
 * Obtiene una lista paginada de trabajos en cola.
 */
export async function getQueueJobs(
	filters: QueueJobFilters = {},
	pagnation: QueueJobPaginationOptions = {}
): Promise<PaginatedQueueJobs> {
	try {
		logger.info('🔍 Obteniendo trabajos en cola via API', { filters, pagnation });
		const searchParams = new URLSearchParams();
		// Añadir filtros
		for (const [key, value] of Object.entries(filters)) {
			if (value !== undefined && value !== null) {
				searchParams.append(`filters.${key}`, String(value));
			}
		}
		// Añadir paginación
		for (const [key, value] of Object.entries(pagnation)) {
			if (value !== undefined && value !== null) {
				searchParams.append(`pagination.${key}`, String(value));
			}
		}

		const url = searchParams.toString() ? `${API_BASE}?${searchParams}` : API_BASE;
		const response = await fetch(url);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return await response.json();
	} catch (error) {
		logger.error('❌ Error en API getQueueJobs', { error, filters, pagnation });
		throw error;
	}
}

/**
 * Crea un nuevo trabajo en cola.
 */
export async function createQueueJob(data: CreateQueueJobInput): Promise<QueueJobExtended> {
	try {
		logger.info('➕ Creando trabajo en cola via API', { queue: data.queue });
		const response = await fetch(API_BASE, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return await response.json();
	} catch (error) {
		logger.error('❌ Error en API createQueueJob', { error, data });
		throw error;
	}
}

/**
 * Actualiza un trabajo en cola existente.
 */
export async function updateQueueJob(id: string, data: UpdateQueueJobInput): Promise<QueueJobExtended> {
	try {
		logger.info(`✏️ Actualizando trabajo en cola ${id} via API`);
		const response = await fetch(`${API_BASE}/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API updateQueueJob: ${id}`, { error, data });
		throw error;
	}
}

/**
 * Elimina un trabajo en cola.
 */
export async function deleteQueueJob(id: string): Promise<void> {
	try {
		logger.warn(`🗑️ Eliminando trabajo en cola ${id} via API`);
		const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
	} catch (error) {
		logger.error(`❌ Error en API deleteQueueJob: ${id}`, { error });
		throw error;
	}
}

/**
 * Obtiene un trabajo en cola por ID.
 */
export async function getQueueJobById(id: string): Promise<QueueJobExtended | null> {
	try {
		logger.info(`🔍 Buscando trabajo en cola por ID ${id} via API`);
		const response = await fetch(`${API_BASE}/${id}`);
		if (!response.ok) {
			if (response.status === 404) return null;
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API getQueueJobById: ${id}`, { error });
		throw error;
	}
}

/**
 * Cancela un trabajo en cola pendiente.
 */
export async function cancelQueueJob(id: string): Promise<QueueJobExtended> {
	try {
		logger.info(`🚫 Cancelando trabajo en cola ${id} via API`);
		const response = await fetch(`${API_BASE}/${id}/cancel`, { method: 'POST' });
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API cancelQueueJob: ${id}`, { error });
		throw error;
	}
}

/**
 * Reintenta un trabajo en cola fallido.
 */
export async function retryQueueJob(id: string): Promise<QueueJobExtended> {
	try {
		logger.info(`🔄 Reintentando trabajo en cola ${id} via API`);
		const response = await fetch(`${API_BASE}/${id}/retry`, { method: 'POST' });
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API retryQueueJob: ${id}`, { error });
		throw error;
	}
}

/**
 * Obtiene estadísticas de la cola de trabajos.
 */
export async function getQueueStats(): Promise<QueueStats> {
	try {
		logger.info('📊 Obteniendo estadísticas de la cola via API');
		const response = await fetch(`${API_BASE}/stats`);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return await response.json();
	} catch (error) {
		logger.error('❌ Error en API getQueueStats', { error });
		throw error;
	}
}

/**
 * Busca trabajos recientes, limitados por cantidad.
 */
export async function findRecentQueueJobs(limit = 5): Promise<QueueJobExtended[]> {
	try {
		logger.info('🕒 Buscando trabajos recientes via API', { limit });
		const response = await fetch(`${API_BASE}/recent?limit=${limit}`);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return await response.json();
	} catch (error) {
		logger.error('❌ Error en API findRecentQueueJobs', { error });
		throw error;
	}
}

/**
 * Busca trabajos por estado, limitados por cantidad.
 */
export async function findQueueJobsByStatus(status: string, limit = 10): Promise<QueueJobExtended[]> {
	try {
		logger.info('🔍 Buscando trabajos por estado via API', { status, limit });
		const response = await fetch(`${API_BASE}/status/${status}?limit=${limit}`);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return await response.json();
	} catch (error) {
		logger.error('❌ Error en API findQueueJobsByStatus', { error });
		throw error;
	}
}

/**
 * Obtiene estadísticas para una cola específica.
 */
export async function getQueueStatsByQueue(queue: string): Promise<QueueStats> {
	try {
		logger.info('📊 Obteniendo estadísticas para cola específica via API', { queue });
		const response = await fetch(`${API_BASE}/stats/${queue}`);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return await response.json();
	} catch (error) {
		logger.error('❌ Error en API getQueueStatsByQueue', { error });
		throw error;
	}
}

/**
 * Cuenta los trabajos completados después de una fecha determinada.
 */
export async function countCompletedJobs(since: Date): Promise<number> {
	try {
		logger.info('🔢 Contando trabajos completados via API', { since });
		const response = await fetch(`${API_BASE}/count/completed?since=${since.toISOString()}`);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		const result = await response.json();
		return result.count;
	} catch (error) {
		logger.error('❌ Error en API countCompletedJobs', { error });
		throw error;
	}
}

/**
 * Cuenta los trabajos fallidos después de una fecha determinada.
 */
export async function countFailedJobs(since: Date): Promise<number> {
	try {
		logger.info('🔢 Contando trabajos fallidos via API', { since });
		const response = await fetch(`${API_BASE}/count/failed?since=${since.toISOString()}`);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		const result = await response.json();
		return result.count;
	} catch (error) {
		logger.error('❌ Error en API countFailedJobs', { error });
		throw error;
	}
}

/**
 * Cuenta el total de trabajos después de una fecha determinada.
 */
export async function countTotalJobs(since: Date): Promise<number> {
	try {
		logger.info('🔢 Contando total de trabajos via API', { since });
		const response = await fetch(`${API_BASE}/count/total?since=${since.toISOString()}`);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		const result = await response.json();
		return result.count;
	} catch (error) {
		logger.error('❌ Error en API countTotalJobs', { error });
		throw error;
	}
}

/**
 * Busca los tiempos de procesamiento de trabajos completados después de una fecha determinada.
 */
export async function findProcessingTimes(since: Date): Promise<number[]> {
	try {
		logger.info('⏱️ Buscando tiempos de procesamiento via API', { since });
		const response = await fetch(`${API_BASE}/processing-times?since=${since.toISOString()}`);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return await response.json();
	} catch (error) {
		logger.error('❌ Error en API findProcessingTimes', { error });
		throw error;
	}
}

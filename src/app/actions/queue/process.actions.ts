/**
 * @file Acciones de proceso para trabajos en cola
 * @module app/actions/queue/process
 */

'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import {
	cancelQueueJob as cancelQueueJobService,
	retryQueueJob as retryQueueJobService,
} from '@/services/queue-job/queue-job.service';
import type { QueueJobExtended } from '@/types/entities/queue-job';
import { revalidatePath } from '@/lib/server/revalidate';

const logger = serverLogger.withContext('QueueActions:process');

/**
 * Reintenta un trabajo fallido
 * @param id - ID del trabajo
 * @returns Trabajo actualizado
 */
export async function retryQueueJob(id: string): Promise<QueueJobExtended> {
	try {
		logger.debug('🔄 Reintentando trabajo en cola', { id });

		// Reintentar trabajo
		const job = await retryQueueJobService(id);

		// Revalidar rutas
		revalidatePath('/queue');
		revalidatePath('/dashboard');
		revalidatePath(`/queue/${id}`);

		return job;
	} catch (error) {
		logger.error('❌ Error reintentando trabajo en cola:', error);
		throw error;
	}
}

/**
 * Cancela un trabajo pendiente
 * @param id - ID del trabajo
 * @returns Trabajo actualizado
 */
export async function cancelQueueJob(id: string): Promise<QueueJobExtended> {
	try {
		logger.debug('⏹️ Cancelando trabajo en cola', { id });

		// Cancelar trabajo
		const job = await cancelQueueJobService(id);

		// Revalidar rutas
		revalidatePath('/queue');
		revalidatePath('/dashboard');
		revalidatePath(`/queue/${id}`);

		return job;
	} catch (error) {
		logger.error('❌ Error cancelando trabajo en cola:', error);
		throw error;
	}
}

'use server';

/**
 * @file Acciones de control para trabajos en cola
 * @module app/actions/queue/control.actions
 */

import { revalidatePath } from 'next/cache';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import * as QueueJobService from '@/services/queue-job.service';
import { type QueueJobExtended } from '@/types/entities/queue-job';
import { QueueJobStatus } from '@/types/entities/queue-job/schema';

// Logger específico para acciones de control
const logger = serverLogger.withContext('QueueActions:control');

// Rutas que deben ser revalidadas cuando cambia el estado de la cola
const REVALIDATE_PATHS = ['/queue', '/dashboard'] as const;

/**
 * Revalida todas las rutas relevantes cuando cambia el estado de la cola
 */
const revalidateQueuePaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	logger.info('🔄 Rutas de cola revalidadas');
};

/**
 * Interfaz para errores de acciones de control
 */
export interface QueueControlErrorData {
	name: string;
	message: string;
	code?: string;
	cause?: unknown;
}

/**
 * Función para crear errores de acciones de control (enfoque funcional)
 */
function _createQueueControlError(message: string, code?: string, cause?: unknown): QueueControlErrorData {
	return {
		name: 'QueueControlError',
		message,
		code,
		cause,
	};
}

/**
 * Pausa una cola específica
 * @param queue - Nombre de la cola a pausar
 * @returns true si se pausó correctamente
 */
export async function pauseQueue(queue: string): Promise<boolean> {
	try {
		logger.debug('⏸️ Pausando cola', { queue });

		// Actualizar todos los trabajos pendientes de la cola
		await prisma.queueJob.updateMany({
			where: {
				queue,
				status: QueueJobStatus.PENDING,
			},
			data: {
				status: QueueJobStatus.PAUSED,
			},
		});

		// Revalidar rutas
		await revalidateQueuePaths();

		logger.info('✅ Cola pausada:', { queue });
		return true;
	} catch (error) {
		logger.error('❌ Error al pausar cola:', error);
		throw error;
	}
}

/**
 * Reanuda una cola pausada
 * @param queue - Nombre de la cola a reanudar
 * @returns true si se reanudó correctamente
 */
export async function resumeQueue(queue: string): Promise<boolean> {
	try {
		logger.debug('▶️ Reanudando cola', { queue });

		// Actualizar todos los trabajos pausados de la cola
		await prisma.queueJob.updateMany({
			where: {
				queue,
				status: QueueJobStatus.PAUSED,
			},
			data: {
				status: QueueJobStatus.PENDING,
			},
		});

		// Revalidar rutas
		await revalidateQueuePaths();

		logger.info('✅ Cola reanudada:', { queue });
		return true;
	} catch (error) {
		logger.error('❌ Error al reanudar cola:', error);
		throw error;
	}
}

/**
 * Limpia una cola (elimina trabajos completados y fallidos)
 * @param queue - Nombre de la cola a limpiar
 * @returns Número de trabajos eliminados
 */
export async function clearQueue(queue: string): Promise<number> {
	try {
		logger.debug('🧹 Limpiando cola', { queue });

		// Eliminar trabajos completados y fallidos
		const result = await prisma.queueJob.deleteMany({
			where: {
				queue,
				status: {
					in: [QueueJobStatus.COMPLETED, QueueJobStatus.FAILED],
				},
			},
		});

		// Revalidar rutas
		await revalidateQueuePaths();

		logger.info('✅ Cola limpiada:', { queue, deletedCount: result.count });
		return result.count;
	} catch (error) {
		logger.error('❌ Error al limpiar cola:', error);
		throw error;
	}
}

/**
 * Reintenta un trabajo fallido
 * @param id - ID del trabajo a reintentar
 * @returns El trabajo actualizado
 */
export async function retryQueueJob(id: string): Promise<QueueJobExtended> {
	try {
		logger.debug('🔄 Reintentando trabajo en cola', { id });

		// Reintentar trabajo
		const job = await QueueJobService.retryQueueJob(id);

		// Revalidar rutas
		await revalidateQueuePaths();
		revalidatePath(`/queue/${id}`);

		return job;
	} catch (error) {
		logger.error('❌ Error al reintentar trabajo en cola:', error);
		throw error;
	}
}

/**
 * Cancela un trabajo en cola pendiente
 * @param id - ID del trabajo a cancelar
 * @returns El trabajo actualizado
 */
export async function cancelQueueJob(id: string): Promise<QueueJobExtended> {
	try {
		logger.debug('⏹️ Cancelando trabajo en cola', { id });

		// Cancelar trabajo
		const job = await QueueJobService.cancelQueueJob(id);

		// Revalidar rutas
		await revalidateQueuePaths();
		revalidatePath(`/queue/${id}`);

		return job;
	} catch (error) {
		logger.error('❌ Error al cancelar trabajo en cola:', error);
		throw error;
	}
}

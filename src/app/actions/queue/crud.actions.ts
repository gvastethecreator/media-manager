'use server';

/**
 * @file Acciones CRUD para trabajos en cola
 * @module app/actions/queue/crud
 */

import { serverLogger } from '@/lib/logger/server-logger';
import {
    createQueueJob as createQueueJobService,
    deleteQueueJob as deleteQueueJobService,
    findQueueJobs,
    updateQueueJob as updateQueueJobService
} from '@/services/queue-job/queue-job.service';
import { serializeQueueJobMetadata } from '@/transformers/queue-job';
import {
    type CreateQueueJobInput,
    type PaginatedQueueJobs,
    type QueueJobExtended,
    type QueueJobFilters,
    type QueueJobPaginationOptions,
    type UpdateQueueJobInput,
} from '@/types/entities/queue-job';
import {
    createQueueJobSchema,
    queueJobFiltersSchema,
    queueJobPaginationSchema,
    updateQueueJobSchema,
} from '@/types/entities/queue-job/schema';
import { revalidatePath } from 'next/cache';

const logger = serverLogger.withContext('QueueActions:crud');

/**
 * Obtiene una lista paginada de trabajos
 * @param filters - Filtros a aplicar
 * @param pagination - Opciones de paginación
 * @returns Lista paginada de trabajos
 */
export async function getQueueJobs(
	filters: QueueJobFilters = {},
	pagination: QueueJobPaginationOptions = {}
): Promise<PaginatedQueueJobs> {
	try {
		logger.debug('🔍 Obteniendo trabajos en cola', { filters, pagination });

		// Validar parámetros
		const validatedFilters = queueJobFiltersSchema.parse(filters);
		const validatedPagination = queueJobPaginationSchema.parse(pagination);

		// Obtener trabajos
		const result = await findQueueJobs(validatedFilters, validatedPagination);

		// Revalidar rutas
		revalidatePath('/queue');
		revalidatePath('/dashboard');

		return result;
	} catch (error) {
		logger.error('❌ Error obteniendo trabajos en cola:', error);
		throw error;
	}
}

/**
 * Crea un nuevo trabajo
 * @param input - Datos del trabajo
 * @returns Trabajo creado
 */
export async function createQueueJob(input: CreateQueueJobInput): Promise<QueueJobExtended> {
	try {
		logger.debug('➕ Creando trabajo en cola', input);

		// Validar input
                const validatedInput = createQueueJobSchema.parse(input);

                // Crear trabajo (serializando metadata si existe)
                const job = await createQueueJobService({
                        ...validatedInput,
                        metadata: validatedInput.metadata
                                ? serializeQueueJobMetadata(validatedInput.metadata)
                                : undefined,
                });

		// Revalidar rutas
		revalidatePath('/queue');
		revalidatePath('/dashboard');

		return job;
	} catch (error) {
		logger.error('❌ Error creando trabajo en cola:', error);
		throw error;
	}
}

/**
 * Actualiza un trabajo existente
 * @param id - ID del trabajo
 * @param input - Datos a actualizar
 * @returns Trabajo actualizado
 */
export async function updateQueueJob(id: string, input: UpdateQueueJobInput): Promise<QueueJobExtended> {
	try {
		logger.debug('✏️ Actualizando trabajo en cola', { id, input });

		// Validar input
                const validatedInput = updateQueueJobSchema.parse(input);

                // Actualizar trabajo
                const job = await updateQueueJobService(id, {
                        ...validatedInput,
                        metadata: validatedInput.metadata
                                ? serializeQueueJobMetadata(validatedInput.metadata)
                                : undefined,
                });

		// Revalidar rutas
		revalidatePath('/queue');
		revalidatePath('/dashboard');
		revalidatePath(`/queue/${id}`);

		return job;
	} catch (error) {
		logger.error('❌ Error actualizando trabajo en cola:', error);
		throw error;
	}
}

/**
 * Elimina un trabajo
 * @param id - ID del trabajo
 */
export async function deleteQueueJob(id: string): Promise<void> {
	try {
		logger.debug('🗑️ Eliminando trabajo en cola', { id });

		// Eliminar trabajo
		await deleteQueueJobService(id);

		// Revalidar rutas
		revalidatePath('/queue');
		revalidatePath('/dashboard');
	} catch (error) {
		logger.error('❌ Error eliminando trabajo en cola:', error);
		throw error;
	}
}

'use server';

/**
 * @file Acciones de consulta para tareas programadas
 * @module app/actions/tasks/query.actions
 */

import { unstable_cache } from 'next/cache';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { type ScheduledTask, type TaskStatus, type TaskType } from '@/types/tasks';

// Logger específico para acciones de consulta
const taskLogger = serverLogger.withContext('TaskQueryActions');

// Tiempo de caché en segundos
const CACHE_REVALIDATE_SECONDS = 30;

/**
 * Interfaz para errores de consulta de tareas
 */
export interface TaskQueryErrorData {
	name: string;
	message: string;
	code?: string;
	cause?: unknown;
}

/**
 * Función para crear errores de consulta de tareas (enfoque funcional)
 */
function createTaskQueryError(message: string, code?: string, cause?: unknown): TaskQueryErrorData {
	return {
		name: 'TaskQueryError',
		message,
		code,
		cause,
	};
}

/**
 * Obtiene una tarea específica por ID
 */
export async function getTask(id: string): Promise<ScheduledTask | null> {
	try {
		taskLogger.info('🔍 Buscando tarea por ID:', id);

		const task = await prisma.scheduledTask.findUnique({
			where: { id },
		});

		if (!task) {
			taskLogger.warn('⚠️ Tarea no encontrada:', id);
			return null;
		}

		taskLogger.info('✅ Tarea encontrada:', { id });
		return task;
	} catch (error) {
		taskLogger.error('❌ Error al buscar tarea:', error);
		throw createTaskQueryError('No se pudo obtener la tarea', 'GET_FAILED', error);
	}
}

/**
 * Obtiene todas las tareas con filtros opcionales
 */
export async function getTasks(filters?: {
	type?: TaskType;
	status?: TaskStatus;
	priority?: string;
	tags?: string[];
}): Promise<ScheduledTask[]> {
	const getCachedTasks = unstable_cache(
		async () => {
			try {
				taskLogger.info('📋 Obteniendo lista de tareas:', filters);

				// Construir condiciones de filtrado
				const where = {
					...(filters?.type && { type: filters.type }),
					...(filters?.status && { status: filters.status }),
					...(filters?.priority && { priority: filters.priority }),
					...(filters?.tags && { tags: { hasEvery: filters.tags } }),
				};

				const tasks = await prisma.scheduledTask.findMany({
					where,
					orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
				});

				taskLogger.info('✅ Lista de tareas obtenida:', { count: tasks.length });
				return tasks;
			} catch (error) {
				taskLogger.error('❌ Error al obtener lista de tareas:', error);
				throw createTaskQueryError('No se pudo obtener la lista de tareas', 'LIST_FAILED', error);
			}
		},
		['tasks-list', JSON.stringify(filters)],
		{
			revalidate: CACHE_REVALIDATE_SECONDS,
			tags: ['tasks'],
		}
	);

	return getCachedTasks();
}

/**
 * Obtiene tareas pendientes de ejecución
 */
export async function getPendingTasks(): Promise<ScheduledTask[]> {
	const getCachedPendingTasks = unstable_cache(
		async () => {
			try {
				taskLogger.info('📋 Obteniendo tareas pendientes');

				const tasks = await prisma.scheduledTask.findMany({
					where: {
						status: 'SCHEDULED',
						nextRunAt: {
							lte: new Date(),
						},
					},
					orderBy: [{ priority: 'desc' }, { nextRunAt: 'asc' }],
				});

				taskLogger.info('✅ Tareas pendientes obtenidas:', { count: tasks.length });
				return tasks;
			} catch (error) {
				taskLogger.error('❌ Error al obtener tareas pendientes:', error);
				throw createTaskQueryError('No se pudo obtener la lista de tareas pendientes', 'PENDING_FAILED', error);
			}
		},
		['tasks-pending'],
		{
			revalidate: CACHE_REVALIDATE_SECONDS,
			tags: ['tasks'],
		}
	);

	return getCachedPendingTasks();
}

/**
 * Obtiene tareas por tipo
 */
export async function getTasksByType(type: TaskType): Promise<ScheduledTask[]> {
	const getCachedTasksByType = unstable_cache(
		async () => {
			try {
				taskLogger.info('🔍 Buscando tareas por tipo:', type);

				const tasks = await prisma.scheduledTask.findMany({
					where: { type },
					orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
				});

				taskLogger.info('✅ Tareas encontradas:', { type, count: tasks.length });
				return tasks;
			} catch (error) {
				taskLogger.error('❌ Error al buscar tareas por tipo:', error);
				throw createTaskQueryError('No se pudo obtener la lista de tareas por tipo', 'TYPE_FAILED', error);
			}
		},
		['tasks-by-type', type],
		{
			revalidate: CACHE_REVALIDATE_SECONDS,
			tags: ['tasks'],
		}
	);

	return getCachedTasksByType();
}

/**
 * Busca tareas por nombre o descripción
 */
export async function searchTasks(query: string): Promise<ScheduledTask[]> {
	try {
		taskLogger.info('🔍 Buscando tareas:', query);

		const tasks = await prisma.scheduledTask.findMany({
			where: {
				OR: [
					{ name: { contains: query, mode: 'insensitive' } },
					{ description: { contains: query, mode: 'insensitive' } },
				],
			},
			orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
		});

		taskLogger.info('✅ Tareas encontradas:', { query, count: tasks.length });
		return tasks;
	} catch (error) {
		taskLogger.error('❌ Error al buscar tareas:', error);
		throw createTaskQueryError('No se pudo realizar la búsqueda de tareas', 'SEARCH_FAILED', error);
	}
}

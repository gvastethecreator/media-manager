'use server';

/**
 * @file Acciones CRUD para tareas programadas
 * @module app/actions/tasks/crud.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { type ScheduledTask } from '@/types/tasks';
import { revalidatePath } from 'next/cache';

// Logger específico para acciones de tareas
const taskLogger = serverLogger.withContext('TaskCrudActions');

// Rutas que deben ser revalidadas cuando cambian las tareas
const REVALIDATE_PATHS = ['/tasks', '/dashboard', '/api/tasks'] as const;

/**
 * Revalida todas las rutas relevantes cuando cambian las tareas
 */
async function revalidateTaskPaths() {
	taskLogger.info('🔄 Revalidando rutas de tareas');
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
}

/**
 * Interfaz para errores de acciones de tareas
 */
export interface TaskErrorData {
	name: string;
	message: string;
	code?: string;
	cause?: unknown;
}

/**
 * Función para crear errores de acciones de tareas (enfoque funcional)
 */
function createTaskError(message: string, code?: string, cause?: unknown): TaskErrorData {
	return {
		name: 'TaskError',
		message,
		code,
		cause,
	};
}

/**
 * Crea una nueva tarea programada
 */
export async function createTask(data: Omit<ScheduledTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduledTask> {
	try {
		taskLogger.info('📝 Creando nueva tarea:', data);

		// Crear la tarea en la base de datos
		const task = await prisma.scheduledTask.create({
			data: {
				type: data.type,
				name: data.name,
				description: data.description,
				priority: data.priority,
				status: data.status,
				schedule: data.schedule,
				handler: data.handler,
				params: data.params,
				timeout: data.timeout,
				retryPolicy: data.retryPolicy,
				dependencies: data.dependencies,
				tags: data.tags,
			},
		});

		// Revalidar rutas
		await revalidateTaskPaths();

		taskLogger.info('✅ Tarea creada:', { id: task.id, name: task.name });
		return task;
	} catch (error) {
		taskLogger.error('❌ Error al crear tarea:', error);
		throw createTaskError('No se pudo crear la tarea', 'CREATE_FAILED', error);
	}
}

/**
 * Actualiza una tarea existente
 */
export async function updateTask(id: string, data: Partial<ScheduledTask>): Promise<ScheduledTask> {
	try {
		taskLogger.info('📝 Actualizando tarea:', { id, data });

		// Verificar que la tarea existe
		const existingTask = await prisma.scheduledTask.findUnique({
			where: { id },
		});

		if (!existingTask) {
			throw createTaskError('Tarea no encontrada', 'NOT_FOUND');
		}

		// Actualizar la tarea
		const task = await prisma.scheduledTask.update({
			where: { id },
			data: {
				type: data.type,
				name: data.name,
				description: data.description,
				priority: data.priority,
				status: data.status,
				schedule: data.schedule,
				handler: data.handler,
				params: data.params,
				timeout: data.timeout,
				retryPolicy: data.retryPolicy,
				dependencies: data.dependencies,
				tags: data.tags,
			},
		});

		// Revalidar rutas
		await revalidateTaskPaths();

		taskLogger.info('✅ Tarea actualizada:', { id: task.id, name: task.name });
		return task;
	} catch (error) {
		taskLogger.error('❌ Error al actualizar tarea:', error);

		// Reenviar el error si ya es un TaskError
		if (error && typeof error === 'object' && 'name' in error && error.name === 'TaskError') {
			throw error;
		}

		throw createTaskError('No se pudo actualizar la tarea', 'UPDATE_FAILED', error);
	}
}

/**
 * Elimina una tarea
 */
export async function deleteTask(id: string): Promise<boolean> {
	try {
		taskLogger.info('🗑️ Eliminando tarea:', id);

		// Verificar que la tarea existe
		const task = await prisma.scheduledTask.findUnique({
			where: { id },
		});

		if (!task) {
			throw createTaskError('Tarea no encontrada', 'NOT_FOUND');
		}

		// Verificar que la tarea no está en ejecución
		if (task.status === 'RUNNING') {
			throw createTaskError('No se puede eliminar una tarea en ejecución', 'TASK_RUNNING');
		}

		// Eliminar la tarea
		await prisma.scheduledTask.delete({
			where: { id },
		});

		// Revalidar rutas
		await revalidateTaskPaths();

		taskLogger.info('✅ Tarea eliminada:', { id });
		return true;
	} catch (error) {
		taskLogger.error('❌ Error al eliminar tarea:', error);

		// Reenviar el error si ya es un TaskError
		if (error && typeof error === 'object' && 'name' in error && error.name === 'TaskError') {
			throw error;
		}

		throw createTaskError('No se pudo eliminar la tarea', 'DELETE_FAILED', error);
	}
}

/**
 * Elimina múltiples tareas
 */
export async function deleteTasks(ids: string[]): Promise<boolean> {
	try {
		taskLogger.info('🗑️ Eliminando múltiples tareas:', ids);

		// Verificar que ninguna tarea está en ejecución
		const runningTasks = await prisma.scheduledTask.findMany({
			where: {
				id: { in: ids },
				status: 'RUNNING',
			},
		});

		if (runningTasks.length > 0) {
			throw createTaskError('No se pueden eliminar tareas en ejecución', 'TASKS_RUNNING', {
				runningTaskIds: runningTasks.map((t) => t.id),
			});
		}

		// Eliminar las tareas
		await prisma.scheduledTask.deleteMany({
			where: {
				id: { in: ids },
			},
		});

		// Revalidar rutas
		await revalidateTaskPaths();

		taskLogger.info('✅ Tareas eliminadas:', { count: ids.length });
		return true;
	} catch (error) {
		taskLogger.error('❌ Error al eliminar tareas:', error);

		// Reenviar el error si ya es un TaskError
		if (error && typeof error === 'object' && 'name' in error && error.name === 'TaskError') {
			throw error;
		}

		throw createTaskError('No se pudieron eliminar las tareas', 'DELETE_MULTIPLE_FAILED', error);
	}
}

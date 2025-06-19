/**
 * @file Servicio funcional para la entidad Task
 * @module services/task
 */

import { createTask, deleteTask, updateTask } from '@/app/actions/tasks/crud.actions';
import { cancelTask, executeTask, pauseTask, resumeTask } from '@/app/actions/tasks/process.actions';
import { getTaskById, getTasks, getTasksByStatus } from '@/app/actions/tasks/query.actions';
import { getTaskStats } from '@/app/actions/tasks/stats.actions';
import { serverLogger } from '@/lib/logger/server-logger';
import { transformTask, transformTasks } from '@/transformers/task';
import type { TaskCreateInput, TaskUpdateInput } from '@/types/entities/task';
import { TaskPriority, TaskStatus, TaskType } from '@/types/entities/task/enums';

// Logger específico para este servicio
const logger = serverLogger.child({ module: 'TaskService' });

/**
 * Obtiene todas las tareas con filtros opcionales
 */
export async function getAllTasks(filters?: {
	status?: TaskStatus[];
	type?: TaskType[];
	priority?: TaskPriority[];
	search?: string;
}) {
	try {
		logger.info('📥 Obteniendo todas las tareas');

		const tasksData = await getTasks(filters);
		const tasks = transformTasks(tasksData as any);

		logger.info('✅ Tareas obtenidas correctamente', { count: tasks.length });
		return tasks;
	} catch (error) {
		logger.error('❌ Error al obtener tareas:', error);
		throw error;
	}
}

/**
 * Obtiene una tarea por su ID
 */
export async function getTask(id: string) {
	try {
		logger.info('📥 Obteniendo tarea por ID:', id);

		const taskData = await getTaskById(id);
		if (!taskData) {
			logger.error('❌ Tarea no encontrada:', id);
			throw new Error(`Tarea con ID ${id} no encontrada`);
		}

		const task = transformTask(taskData as any);

		logger.info('✅ Tarea obtenida correctamente:', { id });
		return task;
	} catch (error) {
		logger.error('❌ Error al obtener tarea:', { id, error });
		throw error;
	}
}

/**
 * Obtiene tareas por estado
 */
export async function getTasksByStatusFilter(status: TaskStatus) {
	try {
		logger.info('📥 Obteniendo tareas por estado:', status);

		const tasksData = await getTasksByStatus(status);
		const tasks = transformTasks(tasksData as any);

		logger.info('✅ Tareas por estado obtenidas correctamente', {
			status,
			count: tasks.length,
		});

		return tasks;
	} catch (error) {
		logger.error('❌ Error al obtener tareas por estado:', { status, error });
		throw error;
	}
}

/**
 * Crea una nueva tarea
 */
export async function createNewTask(taskData: TaskCreateInput) {
	try {
		logger.info('➕ Creando nueva tarea:', taskData);

		const taskResult = await createTask(taskData);
		const task = transformTask(taskResult as any);

		logger.info('✅ Tarea creada correctamente', { id: task.id });
		return task;
	} catch (error) {
		logger.error('❌ Error al crear tarea:', error);
		throw error;
	}
}

/**
 * Actualiza una tarea existente
 */
export async function updateExistingTask(id: string, taskData: TaskUpdateInput) {
	try {
		logger.info('📝 Actualizando tarea:', { id, data: taskData });

		const taskResult = await updateTask(id, taskData);
		const task = transformTask(taskResult as any);

		logger.info('✅ Tarea actualizada correctamente', { id: task.id });
		return task;
	} catch (error) {
		logger.error('❌ Error al actualizar tarea:', { id, error });
		throw error;
	}
}

/**
 * Elimina una tarea
 */
export async function removeTask(id: string) {
	try {
		logger.info('🗑️ Eliminando tarea:', id);

		const result = await deleteTask(id);

		logger.info('✅ Tarea eliminada correctamente', { id, success: result });
		return result;
	} catch (error) {
		logger.error('❌ Error al eliminar tarea:', { id, error });
		throw error;
	}
}

/**
 * Ejecuta una tarea
 */
export async function runTask(id: string, params?: Record<string, any>) {
	try {
		logger.info('▶️ Ejecutando tarea:', { id, params });

		const taskResult = await executeTask(id, params);
		const task = transformTask(taskResult as any);

		logger.info('✅ Tarea iniciada correctamente', { id: task.id });
		return task;
	} catch (error) {
		logger.error('❌ Error al ejecutar tarea:', { id, error });
		throw error;
	}
}

/**
 * Pausa una tarea en ejecución
 */
export async function pauseRunningTask(id: string) {
	try {
		logger.info('⏸️ Pausando tarea:', id);

		const taskResult = await pauseTask(id);
		const task = transformTask(taskResult as any);

		logger.info('✅ Tarea pausada correctamente', { id: task.id });
		return task;
	} catch (error) {
		logger.error('❌ Error al pausar tarea:', { id, error });
		throw error;
	}
}

/**
 * Reanuda una tarea pausada
 */
export async function resumePausedTask(id: string) {
	try {
		logger.info('▶️ Reanudando tarea:', id);

		const taskResult = await resumeTask(id);
		const task = transformTask(taskResult as any);

		logger.info('✅ Tarea reanudada correctamente', { id: task.id });
		return task;
	} catch (error) {
		logger.error('❌ Error al reanudar tarea:', { id, error });
		throw error;
	}
}

/**
 * Cancela una tarea
 */
export async function cancelRunningTask(id: string) {
	try {
		logger.info('⏹️ Cancelando tarea:', id);

		const taskResult = await cancelTask(id);
		const task = transformTask(taskResult as any);

		logger.info('✅ Tarea cancelada correctamente', { id: task.id });
		return task;
	} catch (error) {
		logger.error('❌ Error al cancelar tarea:', { id, error });
		throw error;
	}
}

/**
 * Obtiene estadísticas de tareas
 */
export async function getTaskStatistics() {
	try {
		logger.info('📊 Obteniendo estadísticas de tareas');

		const stats = await getTaskStats();

		logger.info('✅ Estadísticas de tareas obtenidas');
		return stats;
	} catch (error) {
		logger.error('❌ Error al obtener estadísticas de tareas:', error);
		throw error;
	}
}

// Exportar el servicio como objeto único para API consistente
export const taskService = {
	getAllTasks,
	getTask,
	getTasksByStatusFilter,
	createNewTask,
	updateExistingTask,
	removeTask,
	runTask,
	pauseRunningTask,
	resumePausedTask,
	cancelRunningTask,
	getTaskStatistics,
};

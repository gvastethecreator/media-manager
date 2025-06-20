'use server';

/**
 * @file Task actions exports - DESHABILITADO
 * @module app/actions/tasks
 * @description Este archivo expone las funciones asíncronas para compatibilidad con 'use server'
 *
 * ⚠️ FUNCIONALIDAD DESHABILITADA - El modelo 'scheduledTask' no existe en el esquema de Prisma
 * TODO: Crear el modelo ScheduledTask en prisma/schema.prisma o eliminar esta funcionalidad
 */

import type { TaskBase, TaskCreateInput, TaskUpdateInput } from '@/types/entities/task/types';

// Importar funciones específicas en lugar de hacer exportaciones directas
import * as controlActions from './control.actions';
import * as crudActions from './crud.actions';
import * as processActions from './process.actions';
import * as queryActions from './query.actions';
import * as statsActions from './stats.actions';

// Tipo para estadísticas de tareas
export type TaskStats = {
	total: number;
	pending: number;
	running: number;
	completed: number;
	failed: number;
};

// Re-exportar las funciones de control como asíncronas
export async function startTask(taskId: string): Promise<void> {
	// Ignorar parámetro ya que las funciones mock no los aceptan
	return controlActions.startTask();
}

export async function pauseTask(taskId: string): Promise<void> {
	// Ignorar parámetro ya que las funciones mock no los aceptan
	return controlActions.pauseTask();
}

export async function cancelTask(taskId: string): Promise<{ success: boolean }> {
	// Ignorar parámetro ya que las funciones mock no los aceptan
	try {
		await controlActions.cancelTask();
		return { success: true };
	} catch (error) {
		throw error;
	}
}

export async function resumeTask(taskId: string): Promise<void> {
	// Ignorar parámetro ya que las funciones mock no los aceptan
	return controlActions.resumeTask();
}

// Re-exportar las funciones de CRUD como asíncronas
export async function createTask(data: TaskCreateInput): Promise<TaskBase> {
	// Ignorar parámetro ya que las funciones mock no los aceptan
	try {
		await crudActions.createTask();
		// Como es mock, nunca llegará aquí, pero TypeScript necesita el tipo
		throw new Error('Task functionality disabled');
	} catch (error) {
		throw error;
	}
}

export async function updateTask(taskId: string, data: TaskUpdateInput): Promise<TaskBase> {
	// Ignorar parámetros ya que las funciones mock no los aceptan
	try {
		await crudActions.updateTask();
		// Como es mock, nunca llegará aquí, pero TypeScript necesita el tipo
		throw new Error('Task functionality disabled');
	} catch (error) {
		throw error;
	}
}

export async function deleteTask(taskId: string): Promise<{ success: boolean }> {
	// Ignorar parámetro ya que las funciones mock no los aceptan
	try {
		await crudActions.deleteTask();
		return { success: true };
	} catch (error) {
		throw error;
	}
}

// Re-exportar las funciones de proceso como asíncronas
export async function processNextTask(): Promise<void> {
	return processActions.processNextTask();
}

export async function processTaskById(taskId: string): Promise<void> {
	// Ignorar parámetro ya que las funciones mock no los aceptan
	return processActions.processTaskById();
}

// Re-exportar las funciones de consulta como asíncronas
export async function getTasks(filters?: Record<string, any>): Promise<TaskBase[]> {
	// Ignorar parámetro ya que las funciones mock no los aceptan
	try {
		await queryActions.getTasks();
		return [];
	} catch (error) {
		throw error;
	}
}

export async function getTaskById(taskId: string): Promise<TaskBase | null> {
	// Ignorar parámetro ya que las funciones mock no los aceptan
	try {
		await queryActions.getTaskById();
		return null;
	} catch (error) {
		throw error;
	}
}

export async function getPendingTasks(): Promise<TaskBase[]> {
	try {
		await queryActions.getPendingTasks();
		return [];
	} catch (error) {
		throw error;
	}
}

// Re-exportar las funciones de estadísticas como asíncronas
export async function getTaskStats(): Promise<TaskStats> {
	try {
		await statsActions.getTaskStats();
		return {
			total: 0,
			pending: 0,
			running: 0,
			completed: 0,
			failed: 0,
		};
	} catch (error) {
		throw error;
	}
}

export async function getTaskCounts(): Promise<TaskStats> {
	try {
		await statsActions.getTaskCounts();
		return {
			total: 0,
			pending: 0,
			running: 0,
			completed: 0,
			failed: 0,
		};
	} catch (error) {
		throw error;
	}
}

// Nota: Se eliminaron las exportaciones directas que no son compatibles con 'use server'
// export * from './control.actions';
// export * from './crud.actions';
// export * from './process.actions';
// export * from './query.actions';
// export * from './stats.actions';

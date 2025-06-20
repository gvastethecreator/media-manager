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
export async function startTask(_taskId: string): Promise<void> {
	// Ignorar parámetro ya que las funciones mock no los aceptan
	return controlActions.startTask();
}

export async function pauseTask(_taskId: string): Promise<void> {
	// Ignorar parámetro ya que las funciones mock no los aceptan
	return controlActions.pauseTask();
}

export async function cancelTask(_taskId: string): Promise<{ success: boolean }> {
	// Ignorar parámetro ya que las funciones mock no los aceptan
	await controlActions.cancelTask();
	return { success: true };
}

export async function resumeTask(_taskId: string): Promise<void> {
	// Ignorar parámetro ya que las funciones mock no los aceptan
	return controlActions.resumeTask();
}

// Re-exportar las funciones de CRUD como asíncronas
export async function createTask(_data: TaskCreateInput): Promise<TaskBase> {
	// Ignorar parámetro ya que las funciones mock no los aceptan
	await crudActions.createTask();
	// Como es mock, nunca llegará aquí, pero TypeScript necesita el tipo
	throw new Error('Task functionality disabled');
}

export async function updateTask(taskId: string, _data: TaskUpdateInput): Promise<TaskBase> {
	// Ignorar parámetros ya que las funciones mock no los aceptan
	await crudActions.updateTask();
	// Como es mock, nunca llegará aquí, pero TypeScript necesita el tipo
	throw new Error('Task functionality disabled');
}

export async function deleteTask(_taskId: string): Promise<{ success: boolean }> {
	// Ignorar parámetro ya que las funciones mock no los aceptan
	await crudActions.deleteTask();
	return { success: true };
}

// Re-exportar las funciones de proceso como asíncronas
export async function processNextTask(): Promise<void> {
	return processActions.processNextTask();
}

export async function processTaskById(_taskId: string): Promise<void> {
	// Ignorar parámetro ya que las funciones mock no los aceptan
	return processActions.processTaskById();
}

// Re-exportar las funciones de consulta como asíncronas
export async function getTasks(_filters?: Record<string, any>): Promise<TaskBase[]> {
	// Ignorar parámetro ya que las funciones mock no los aceptan
	await queryActions.getTasks();
	return [];
}

export async function getTaskById(_taskId: string): Promise<TaskBase | null> {
	// Ignorar parámetro ya que las funciones mock no los aceptan
	await queryActions.getTaskById();
	return null;
}

export async function getPendingTasks(): Promise<TaskBase[]> {
	await queryActions.getPendingTasks();
	return [];
}

// Re-exportar las funciones de estadísticas como asíncronas
export async function getTaskStats(): Promise<TaskStats> {
	await statsActions.getTaskStats();
	return {
		total: 0,
		pending: 0,
		running: 0,
		completed: 0,
		failed: 0,
	};
}

export async function getTaskCounts(): Promise<TaskStats> {
	await statsActions.getTaskCounts();
	return {
		total: 0,
		pending: 0,
		running: 0,
		completed: 0,
		failed: 0,
	};
}

// Nota: Se eliminaron las exportaciones directas que no son compatibles con 'use server'
// export * from './control.actions';
// export * from './crud.actions';
// export * from './process.actions';
// export * from './query.actions';
// export * from './stats.actions';

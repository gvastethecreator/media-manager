'use server';

/**
 * @file Task actions exports
 * @module app/actions/tasks
 * @description Este archivo expone las funciones asíncronas para compatibilidad con 'use server'
 */

// Importar funciones específicas en lugar de hacer exportaciones directas
import * as controlActions from './control.actions';
import * as crudActions from './crud.actions';
import * as processActions from './process.actions';
import * as queryActions from './query.actions';
import * as statsActions from './stats.actions';

// Definir tipos básicos para las tareas
export interface TaskBase {
	id: string;
	status: string;
	[key: string]: any;
}

export interface TaskCreateInput {
	[key: string]: any;
}

export interface TaskUpdateInput {
	[key: string]: any;
}

export interface TaskFilters {
	[key: string]: any;
}

export interface TaskStats {
	[key: string]: any;
}

export interface TaskCounts {
	[key: string]: number;
}

// Re-exportar las funciones de control como asíncronas
export async function startTask(taskId: string): Promise<TaskBase> {
	return controlActions.startTask(taskId);
}

export async function pauseTask(taskId: string): Promise<TaskBase> {
	return controlActions.pauseTask(taskId);
}

export async function cancelTask(taskId: string): Promise<TaskBase> {
	return controlActions.cancelTask(taskId);
}

export async function resumeTask(taskId: string): Promise<TaskBase> {
	return controlActions.resumeTask(taskId);
}

// Re-exportar las funciones de CRUD como asíncronas
export async function createTask(data: TaskCreateInput): Promise<TaskBase> {
	return crudActions.createTask(data) as Promise<TaskBase>;
}

export async function updateTask(taskId: string, data: TaskUpdateInput): Promise<TaskBase> {
	return crudActions.updateTask(taskId, data) as Promise<TaskBase>;
}

export async function deleteTask(taskId: string): Promise<{ success: boolean }> {
	return crudActions.deleteTask(taskId) as Promise<{ success: boolean }>;
}

// Re-exportar las funciones de proceso como asíncronas
export async function processNextTask(): Promise<TaskBase | null> {
	return processActions.processNextTask();
}

export async function processTaskById(taskId: string): Promise<TaskBase> {
	return processActions.processTaskById(taskId);
}

// Re-exportar las funciones de consulta como asíncronas
export async function getTasks(filters?: TaskFilters): Promise<TaskBase[]> {
	return queryActions.getTasks(filters) as Promise<TaskBase[]>;
}

export async function getTaskById(taskId: string): Promise<TaskBase | null> {
	return queryActions.getTaskById(taskId) as Promise<TaskBase | null>;
}

export async function getPendingTasks(): Promise<TaskBase[]> {
	return queryActions.getPendingTasks() as Promise<TaskBase[]>;
}

// Re-exportar las funciones de estadísticas como asíncronas
export async function getTaskStats(): Promise<TaskStats> {
	return statsActions.getTaskStats() as Promise<TaskStats>;
}

export async function getTaskCounts(): Promise<TaskCounts> {
	return statsActions.getTaskCounts() as Promise<TaskCounts>;
}

// Nota: Se eliminaron las exportaciones directas que no son compatibles con 'use server'
// export * from './control.actions';
// export * from './crud.actions';
// export * from './process.actions';
// export * from './query.actions';
// export * from './stats.actions';

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

// Re-exportar las funciones de control como asíncronas
export async function startTask(taskId: string) {
	return controlActions.startTask(taskId);
}

export async function pauseTask(taskId: string) {
	return controlActions.pauseTask(taskId);
}

export async function cancelTask(taskId: string) {
	return controlActions.cancelTask(taskId);
}

export async function resumeTask(taskId: string) {
	return controlActions.resumeTask(taskId);
}

// Re-exportar las funciones de CRUD como asíncronas
export async function createTask(data: any) {
	return crudActions.createTask(data);
}

export async function updateTask(taskId: string, data: any) {
	return crudActions.updateTask(taskId, data);
}

export async function deleteTask(taskId: string) {
	return crudActions.deleteTask(taskId);
}

// Re-exportar las funciones de proceso como asíncronas
export async function processNextTask() {
	return processActions.processNextTask();
}

export async function processTaskById(taskId: string) {
	return processActions.processTaskById(taskId);
}

// Re-exportar las funciones de consulta como asíncronas
export async function getTasks(filters?: any) {
	return queryActions.getTasks(filters);
}

export async function getTaskById(taskId: string) {
	return queryActions.getTaskById(taskId);
}

export async function getPendingTasks() {
	return queryActions.getPendingTasks();
}

// Re-exportar las funciones de estadísticas como asíncronas
export async function getTaskStats() {
	return statsActions.getTaskStats();
}

export async function getTaskCounts() {
	return statsActions.getTaskCounts();
}

// Nota: Se eliminaron las exportaciones directas que no son compatibles con 'use server'
// export * from './control.actions';
// export * from './crud.actions';
// export * from './process.actions';
// export * from './query.actions';
// export * from './stats.actions';

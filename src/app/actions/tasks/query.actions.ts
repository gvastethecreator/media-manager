'use server';

/**
 * @file Acciones de consulta para tareas programadas - DESHABILITADO
 * @module app/actions/tasks/query.actions
 *
 * ⚠️ ARCHIVO DESHABILITADO - El modelo 'scheduledTask' no existe en el esquema de Prisma
 * TODO: Crear el modelo ScheduledTask en prisma/schema.prisma o eliminar esta funcionalidad
 */

// Funciones mock temporales para evitar errores de importación
export async function getTaskById() {
	throw new Error('Task functionality disabled - ScheduledTask model not implemented');
}

export async function searchTasks() {
	throw new Error('Task functionality disabled - ScheduledTask model not implemented');
}

export async function getTasksByStatus() {
	throw new Error('Task functionality disabled - ScheduledTask model not implemented');
}

export async function getTasksByType() {
	throw new Error('Task functionality disabled - ScheduledTask model not implemented');
}

export async function getTaskHistory() {
	throw new Error('Task functionality disabled - ScheduledTask model not implemented');
}

export async function getTasks() {
	throw new Error('Task functionality disabled - ScheduledTask model not implemented');
}

export async function getPendingTasks() {
	throw new Error('Task functionality disabled - ScheduledTask model not implemented');
}

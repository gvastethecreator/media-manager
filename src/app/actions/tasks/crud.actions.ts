'use server';

/**
 * @file Acciones CRUD para tareas programadas - DESHABILITADO
 * @module app/actions/tasks/crud.actions
 *
 * ⚠️ ARCHIVO DESHABILITADO - El modelo 'scheduledTask' no existe en el esquema de Prisma
 * TODO: Crear el modelo ScheduledTask en prisma/schema.prisma o eliminar esta funcionalidad
 */

// Funciones mock temporales para evitar errores de importación
export async function createTask() {
	throw new Error('Task functionality disabled - ScheduledTask model not implemented');
}

export async function updateTask() {
	throw new Error('Task functionality disabled - ScheduledTask model not implemented');
}

export async function deleteTask() {
	throw new Error('Task functionality disabled - ScheduledTask model not implemented');
}

export async function deleteTasks() {
	throw new Error('Task functionality disabled - ScheduledTask model not implemented');
}

export async function getTasks() {
	throw new Error('Task functionality disabled - ScheduledTask model not implemented');
}

export async function getTask() {
	throw new Error('Task functionality disabled - ScheduledTask model not implemented');
}

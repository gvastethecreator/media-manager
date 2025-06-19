'use server';

/**
 * @file Acciones de procesamiento para tareas programadas - DESHABILITADO
 * @module app/actions/tasks/process.actions
 *
 * ⚠️ ARCHIVO DESHABILITADO - El modelo 'scheduledTask' no existe en el esquema de Prisma
 * TODO: Crear el modelo ScheduledTask en prisma/schema.prisma o eliminar esta funcionalidad
 */

// Funciones mock temporales para evitar errores de importación
export async function startTask() {
	throw new Error('Task functionality disabled - ScheduledTask model not implemented');
}

export async function stopTask() {
	throw new Error('Task functionality disabled - ScheduledTask model not implemented');
}

export async function pauseTask() {
	throw new Error('Task functionality disabled - ScheduledTask model not implemented');
}

export async function resumeTask() {
	throw new Error('Task functionality disabled - ScheduledTask model not implemented');
}

export async function retryTask() {
	throw new Error('Task functionality disabled - ScheduledTask model not implemented');
}

export async function executeTask() {
	throw new Error('Task functionality disabled - ScheduledTask model not implemented');
}
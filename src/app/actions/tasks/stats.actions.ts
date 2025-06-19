'use server';

/**
 * @file Acciones de estadísticas para tareas programadas - DESHABILITADO
 * @module app/actions/tasks/stats.actions
 *
 * ⚠️ ARCHIVO DESHABILITADO - El modelo 'scheduledTask' no existe en el esquema de Prisma
 * TODO: Crear el modelo ScheduledTask en prisma/schema.prisma o eliminar esta funcionalidad
 */

// Funciones mock temporales para evitar errores de importación
export async function getTaskStats() {
	throw new Error('Task functionality disabled - ScheduledTask model not implemented');
}

export async function getTaskMetrics() {
	throw new Error('Task functionality disabled - ScheduledTask model not implemented');
}

export async function getTaskPerformance() {
	throw new Error('Task functionality disabled - ScheduledTask model not implemented');
}
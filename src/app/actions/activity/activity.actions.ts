'use server';

/**
 * @file Acciones principales para la entidad Activity
 * @module app/actions/activity/activity.actions
 * @description Este archivo expone las funciones asíncronas para compatibilidad con 'use server'
 */

// Ya no exportamos directamente los módulos, ahora importamos y re-exportamos las funciones individuales
// Importamos acciones de eliminación
import {
	cleanupOldActivities as cleanupOldActivitiesImpl,
	deleteActivity as deleteActivityImpl,
} from './delete.actions';

// Importamos acciones de registro
import { createActivity as createActivityImpl, logActivity as logActivityImpl } from './log.actions';

// Importamos acciones de consulta
import {
	getActivitiesByImage as getActivitiesByImageImpl,
	getActivitiesByType as getActivitiesByTypeImpl,
	getActivityById as getActivityByIdImpl,
	getFilteredActivities as getFilteredActivitiesImpl,
	getRecentActivities as getRecentActivitiesImpl,
} from './query.actions';

// Re-exportamos cada función como asíncrona para cumplir con las restricciones de 'use server'
export async function deleteActivity(id: string) {
	return deleteActivityImpl(id);
}

export async function cleanupOldActivities(olderThanDays = 30, types?: any[]) {
	return cleanupOldActivitiesImpl(olderThanDays, types);
}

export async function logActivity(data: any) {
	return logActivityImpl(data);
}

export async function createActivity(type: string, metadata: Record<string, any> = {}, imageId?: string) {
	return createActivityImpl(type, metadata, imageId);
}

export async function getRecentActivities(limit = 10) {
	return getRecentActivitiesImpl(limit);
}

export async function getActivitiesByType(type: string, limit = 10) {
	return getActivitiesByTypeImpl(type, limit);
}

export async function getActivitiesByImage(imageId: string, limit = 10) {
	return getActivitiesByImageImpl(imageId, limit);
}

export async function getFilteredActivities(filters: any) {
	return getFilteredActivitiesImpl(filters);
}

export async function getActivityById(id: string) {
	return getActivityByIdImpl(id);
}

// Nota: Se eliminaron las exportaciones directas:
// export * from './delete.actions';
// export * from './log.actions';
// export * from './query.actions';

// Ya no necesitamos el código anterior que estaba en este archivo,
// ya que ahora solo es un wrapper de las implementaciones reales

'use server';

/**
 * @file Exporta todas las acciones de sistema
 * @module app/actions/system
 */

import type { Settings } from '@prisma/client';
import * as SettingsActions from './settings.actions';
import type { SystemResponse, SystemStats } from './system.actions';
import * as SystemActions from './system.actions';
import type { SystemErrorData } from './system.errors';
import * as SystemErrors from './system.errors';

// Re-exportamos cada función como asíncrona para cumplir con las restricciones de 'use server'
export async function getSystemSettings(...args: Parameters<typeof SettingsActions.getSystemSettings>) {
	return SettingsActions.getSystemSettings(...args);
}
export async function updateSystemSettings(...args: Parameters<typeof SettingsActions.updateSystemSettings>) {
	return SettingsActions.updateSystemSettings(...args);
}
export async function resetSystemSettings(...args: Parameters<typeof SettingsActions.resetSystemSettings>) {
	return SettingsActions.resetSystemSettings(...args);
}
export async function getProfileSettings(...args: Parameters<typeof SettingsActions.getProfileSettings>) {
	return SettingsActions.getProfileSettings(...args);
}
export async function updateProfileSettings(...args: Parameters<typeof SettingsActions.updateProfileSettings>) {
	return SettingsActions.updateProfileSettings(...args);
}
export async function resetProfileSettings(...args: Parameters<typeof SettingsActions.resetProfileSettings>) {
	return SettingsActions.resetProfileSettings(...args);
}
export async function createDefaultSettingsData(...args: Parameters<typeof SettingsActions.createDefaultSettingsData>) {
	return SettingsActions.createDefaultSettingsData(...args);
}

// Exportaciones de system.actions
export async function getSystemStats(...args: Parameters<typeof SystemActions.getSystemStats>) {
	return SystemActions.getSystemStats(...args);
}
export async function getSystemVersion(...args: Parameters<typeof SystemActions.getSystemVersion>) {
	return SystemActions.getSystemVersion(...args);
}
export async function repairSystem(...args: Parameters<typeof SystemActions.repairSystem>) {
	return SystemActions.repairSystem(...args);
}
export async function resetDatabase(...args: Parameters<typeof SystemActions.resetDatabase>) {
        return SystemActions.resetDatabase(...args);
}

// Inicialización del servidor
export async function initServer(...args: Parameters<typeof import('./init.actions').initServer>) {
        const mod = await import('./init.actions');
        return mod.initServer(...args);
}

// Exportaciones de errores
export async function createSystemError(...args: Parameters<typeof SystemErrors.createSystemError>) {
	return SystemErrors.createSystemError(...args);
}

// Exportar tipos relevantes (no necesitan ser async)
export type { Settings, SystemErrorData, SystemResponse, SystemStats };

// TODO: Considerar exportar funciones de system.actions.ts si son necesarias

/**
 * @file Acciones del servidor para gestionar la configuración del sistema
 * @module app/actions/system/settings
 */

'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { settingsService } from '@/services/settings';
import type { Settings } from '@/types/settings';
import { createSettingsError, isSettingsError } from './settings.errors';

// Logger específico para acciones de configuración
const logger = serverLogger.withContext('SettingsActions');

/**
 * Respuesta estándar para operaciones de configuración
 */
export interface SettingsResponse {
	success: boolean;
	message: string;
	data?: Settings;
}

/**
 * Obtiene la configuración global del sistema
 */
export async function getSystemSettings(): Promise<Settings> {
	logger.debug('📤 Action: Obteniendo configuración global del sistema');

	try {
		return await settingsService.getSystemSettings();
	} catch (error) {
		logger.error('❌ Error en action getSystemSettings:', error);
		if (isSettingsError(error)) {
			throw error;
		}
		throw createSettingsError('No se pudo obtener la configuración del sistema', 'GET_FAILED', error);
	}
}

/**
 * Actualiza la configuración global del sistema
 */
export async function updateSystemSettings(data: Partial<Settings>): Promise<Settings> {
	logger.debug('📥 Action: Actualizando configuración global del sistema', { data });

	try {
		return await settingsService.updateSystemSettings(data);
	} catch (error) {
		logger.error('❌ Error en action updateSystemSettings:', error);
		if (isSettingsError(error)) {
			throw error;
		}
		throw createSettingsError('No se pudo actualizar la configuración del sistema', 'UPDATE_FAILED', error);
	}
}

/**
 * Resetea la configuración global a valores predeterminados
 */
export async function resetSystemSettings(): Promise<Settings> {
	logger.debug('🔄 Action: Reseteando configuración global a valores predeterminados');

	try {
		return await settingsService.resetSystemSettings();
	} catch (error) {
		logger.error('❌ Error en action resetSystemSettings:', error);
		if (isSettingsError(error)) {
			throw error;
		}
		throw createSettingsError('No se pudo resetear la configuración del sistema', 'RESET_FAILED', error);
	}
}

/**
 * Obtiene la configuración de un perfil específico
 */
export async function getProfileSettings(profileId: string): Promise<Settings | null> {
	logger.debug(`📤 Action: Obteniendo configuración del perfil: ${profileId}`);

	try {
		return await settingsService.getProfileSettings(profileId);
	} catch (error) {
		logger.error(`❌ Error en action getProfileSettings para perfil ${profileId}:`, error);
		if (isSettingsError(error)) {
			throw error;
		}
		throw createSettingsError('No se pudo obtener la configuración del perfil', 'GET_PROFILE_FAILED', error);
	}
}

/**
 * Actualiza la configuración de un perfil específico
 */
export async function updateProfileSettings(profileId: string, data: Partial<Settings>): Promise<Settings> {
	logger.debug(`📥 Action: Actualizando configuración del perfil: ${profileId}`, { data });

	try {
		return await settingsService.updateProfileSettings(profileId, data);
	} catch (error) {
		logger.error(`❌ Error en action updateProfileSettings para perfil ${profileId}:`, error);
		if (isSettingsError(error)) {
			throw error;
		}
		throw createSettingsError('No se pudo actualizar la configuración del perfil', 'UPDATE_PROFILE_FAILED', error);
	}
}

/**
 * Resetea la configuración de un perfil a los valores globales
 */
export async function resetProfileSettings(profileId: string): Promise<void> {
	logger.debug(`🔄 Action: Reseteando configuración del perfil: ${profileId}`);

	try {
		return await settingsService.resetProfileSettings(profileId);
	} catch (error) {
		logger.error(`❌ Error en action resetProfileSettings para perfil ${profileId}:`, error);
		if (isSettingsError(error)) {
			throw error;
		}
		throw createSettingsError('No se pudo resetear la configuración del perfil', 'RESET_PROFILE_FAILED', error);
	}
}

/**
 * Crear datos de configuración por defecto
 */
export async function createDefaultSettingsData(): Promise<Settings> {
	logger.info('📝 Creando configuración por defecto');

	try {
		// Retornar configuración por defecto
		const defaultSettings: Settings = {
			appearance: {
				theme: 'system',
				fontSize: 16,
				language: 'es',
				reducedAnimations: false,
				highContrast: false,
			},
			notifications: {
				enabled: true,
				email: false,
				desktop: true,
				frequency: 'daily',
			},
			privacy: {
				shareUsageData: false,
				storeCookies: true,
				storeHistory: true,
			},
			advanced: {
				apiKey: null,
				devMode: false,
				experimentalFeatures: false,
			},
		};

		return defaultSettings;
	} catch (error) {
		logger.error('❌ Error creando configuración por defecto:', error);
		throw createSettingsError('CREATE_DEFAULT_FAILED', 'Error al crear configuración por defecto');
	}
}

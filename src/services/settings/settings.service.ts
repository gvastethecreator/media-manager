/**
 * @file Servicio para operaciones con configuración
 * @module services/settings
 */

import {
	getProfileSettings,
	getSystemSettings,
	resetProfileSettings,
	resetSystemSettings,
	updateProfileSettings,
	updateSystemSettings,
} from '@/app/actions/system';
import type { Settings } from '@/types/settings';

/**
 * Interfaz para operaciones de configuración global
 */
export interface SettingsService {
	/**
	 * Obtiene la configuración global del sistema
	 */
	getSystemSettings(): Promise<Settings>;

	/**
	 * Actualiza la configuración global del sistema
	 */
	updateSystemSettings(data: Partial<Settings>): Promise<Settings>;

	/**
	 * Resetea la configuración global a valores predeterminados
	 */
	resetSystemSettings(): Promise<Settings>;

	/**
	 * Obtiene la configuración de un perfil específico
	 */
	getProfileSettings(profileId: string): Promise<Settings | null>;

	/**
	 * Actualiza la configuración de un perfil específico
	 */
	updateProfileSettings(profileId: string, data: Partial<Settings>): Promise<Settings>;

	/**
	 * Resetea la configuración de un perfil a los valores globales
	 */
	resetProfileSettings(profileId: string): Promise<void>;
}

/**
 * Implementación del servicio de configuración
 */
export const settingsService: SettingsService = {
	/**
	 * Obtiene la configuración global del sistema
	 */
	async getSystemSettings(): Promise<Settings> {
		try {
			return await getSystemSettings();
		} catch (error) {
			console.error('Error en getSystemSettings:', error);
			throw error;
		}
	},

	/**
	 * Actualiza la configuración global del sistema
	 */
	async updateSystemSettings(data: Partial<Settings>): Promise<Settings> {
		try {
			return await updateSystemSettings(data);
		} catch (error) {
			console.error('Error en updateSystemSettings:', error);
			throw error;
		}
	},

	/**
	 * Resetea la configuración global a valores predeterminados
	 */
	async resetSystemSettings(): Promise<Settings> {
		try {
			return await resetSystemSettings();
		} catch (error) {
			console.error('Error en resetSystemSettings:', error);
			throw error;
		}
	},

	/**
	 * Obtiene la configuración de un perfil específico
	 */
	async getProfileSettings(profileId: string): Promise<Settings | null> {
		try {
			return await getProfileSettings(profileId);
		} catch (error) {
			console.error('Error en getProfileSettings:', error);
			throw error;
		}
	},

	/**
	 * Actualiza la configuración de un perfil específico
	 */
	async updateProfileSettings(profileId: string, data: Partial<Settings>): Promise<Settings> {
		try {
			return await updateProfileSettings(profileId, data);
		} catch (error) {
			console.error('Error en updateProfileSettings:', error);
			throw error;
		}
	},

	/**
	 * Resetea la configuración de un perfil a los valores globales
	 */
	async resetProfileSettings(profileId: string): Promise<void> {
		try {
			await resetProfileSettings(profileId);
		} catch (error) {
			console.error('Error en resetProfileSettings:', error);
			throw error;
		}
	},
};

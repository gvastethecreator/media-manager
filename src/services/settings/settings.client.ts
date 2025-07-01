/**
 * @file Cliente de configuración para uso en el navegador
 * @module services/settings/client
 */

import type { Settings } from '@/types/settings';

/**
 * Cliente de configuración que se ejecuta en el navegador
 * y hace llamadas a las Server Actions
 */
export class SettingsClient {
	/**
	 * Obtiene la configuración global del sistema
	 */
	async getSystemSettings(): Promise<Settings> {
		// Importación dinámica para evitar problemas de bundling
		const { getSystemSettings } = await import('@/app/actions/system/settings.actions');
		return getSystemSettings();
	}

	/**
	 * Actualiza la configuración global del sistema
	 */
	async updateSystemSettings(data: Partial<Settings>): Promise<Settings> {
		const { updateSystemSettings } = await import('@/app/actions/system/settings.actions');
		return updateSystemSettings(data);
	}

	/**
	 * Resetea la configuración global a valores predeterminados
	 */
	async resetSystemSettings(): Promise<Settings> {
		const { resetSystemSettings } = await import('@/app/actions/system/settings.actions');
		return resetSystemSettings();
	}

	/**
	 * Obtiene la configuración de un perfil específico
	 */
	async getProfileSettings(profileId: string): Promise<Settings | null> {
		const { getProfileSettings } = await import('@/app/actions/system/settings.actions');
		return getProfileSettings(profileId);
	}

	/**
	 * Actualiza la configuración de un perfil específico
	 */
	async updateProfileSettings(profileId: string, data: Partial<Settings>): Promise<Settings> {
		const { updateProfileSettings } = await import('@/app/actions/system/settings.actions');
		return updateProfileSettings(profileId, data);
	}

	/**
	 * Resetea la configuración de un perfil a los valores globales
	 */
	async resetProfileSettings(profileId: string): Promise<void> {
		const { resetProfileSettings } = await import('@/app/actions/system/settings.actions');
		return resetProfileSettings(profileId);
	}
}

/**
 * Instancia singleton del cliente de configuración
 */
export const settingsClient = new SettingsClient();

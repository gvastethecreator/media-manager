/**
 * @file Cliente de configuración para uso en el navegador
 * @module services/settings/client
 */

import type { Settings } from '@/types/settings';

/**
 * Cliente de configuración que se ejecuta en el navegador
 * y hace llamadas a la API REST
 */
export class SettingsClient {
	/**
	 * Obtiene la configuración global del sistema
	 */
	async getSystemSettings(): Promise<Settings> {
		const response = await fetch('/api/settings/system');
		if (!response.ok) {
			throw new Error('Error al obtener configuración del sistema');
		}
		return response.json();
	}

	/**
	 * Actualiza la configuración global del sistema
	 */
	async updateSystemSettings(data: Partial<Settings>): Promise<Settings> {
		const response = await fetch('/api/settings/system', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		if (!response.ok) {
			throw new Error('Error al actualizar configuración del sistema');
		}
		return response.json();
	}

	/**
	 * Resetea la configuración global a valores predeterminados
	 */
	async resetSystemSettings(): Promise<Settings> {
		const response = await fetch('/api/settings/system/reset', {
			method: 'POST',
		});
		if (!response.ok) {
			throw new Error('Error al resetear configuración del sistema');
		}
		return response.json();
	}

	/**
	 * Obtiene la configuración de un perfil específico
	 */
	async getProfileSettings(profileId: string): Promise<Settings | null> {
		const response = await fetch(`/api/settings/profile/${profileId}`);
		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			throw new Error('Error al obtener configuración del perfil');
		}
		return response.json();
	}

	/**
	 * Actualiza la configuración de un perfil específico
	 */
	async updateProfileSettings(profileId: string, data: Partial<Settings>): Promise<Settings> {
		const response = await fetch(`/api/settings/profile/${profileId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		if (!response.ok) {
			throw new Error('Error al actualizar configuración del perfil');
		}
		return response.json();
	}

	/**
	 * Resetea la configuración de un perfil a los valores globales
	 */
	async resetProfileSettings(profileId: string): Promise<void> {
		const response = await fetch(`/api/settings/profile/${profileId}/reset`, {
			method: 'POST',
		});
		if (!response.ok) {
			throw new Error('Error al resetear configuración del perfil');
		}
	}
}

/**
 * Instancia singleton del cliente de configuración
 */
export const settingsClient = new SettingsClient();

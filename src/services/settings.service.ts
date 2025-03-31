/**
 * @file Servicio para operaciones con configuración
 * @module services/settings
 */

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
      const response = await fetch('/api/system/settings');
      if (!response.ok) {
        throw new Error('Error al obtener la configuración del sistema');
      }
      return response.json();
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
      const response = await fetch('/api/system/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la configuración del sistema');
      }

      return response.json();
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
      const response = await fetch('/api/system/settings/reset', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error al resetear la configuración del sistema');
      }

      return response.json();
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
      const response = await fetch(`/api/profiles/${profileId}/settings`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Error al obtener la configuración del perfil ${profileId}`);
      }

      return response.json();
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
      const response = await fetch(`/api/profiles/${profileId}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Error al actualizar la configuración del perfil ${profileId}`);
      }

      return response.json();
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
      const response = await fetch(`/api/profiles/${profileId}/settings/reset`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Error al resetear la configuración del perfil ${profileId}`);
      }
    } catch (error) {
      console.error('Error en resetProfileSettings:', error);
      throw error;
    }
  },
};
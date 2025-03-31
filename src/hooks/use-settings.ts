/**
 * @file Hook para acceso a la configuración
 * @module hooks/use-settings
 */

import { useSettingsStore } from '@/store/settings.store';
import { useEffect } from 'react';

/**
 * Hook personalizado que proporciona acceso a la configuración global
 * y funciones para manipularla
 */
export function useSettings() {
	const {
		settings,
		isLoading,
		isSaving,
		error,
		isInitialized,
		activeProfileId,
		initialize,
		loadSystemSettings,
		loadProfileSettings,
		updateSettings,
		resetSettings,
		setActiveProfile,
		setError,
	} = useSettingsStore;

	// Inicializar la configuración al montar el componente
	useEffect(() => {
		if (!isInitialized) {
			initialize();
		}
	}, [isInitialized, initialize]);

	// Funciones de utilidad para trabajar con secciones específicas
	const updateAppearance = (appearance: Record<string, unknown>) => {
		updateSettings({ appearance });
	};

	const updateNotifications = (notifications: Record<string, unknown>) => {
		updateSettings({ notifications });
	};

	const updatePrivacy = (privacy: Record<string, unknown>) => {
		updateSettings({ privacy });
	};

	const updateAdvanced = (advanced: Record<string, unknown>) => {
		updateSettings({ advanced });
	};

	return {
		// Estado
		settings,
		isLoading,
		isSaving,
		error,
		isInitialized,
		activeProfileId,

		// Secciones de configuración
		appearance: settings?.appearance,
		notifications: settings?.notifications,
		privacy: settings?.privacy,
		advanced: settings?.advanced,

		// Acciones para toda la configuración
		loadSystemSettings,
		loadProfileSettings,
		updateSettings,
		resetSettings,
		setActiveProfile,

		// Acciones para secciones específicas
		updateAppearance,
		updateNotifications,
		updatePrivacy,
		updateAdvanced,

		// Utilidades
		setError,

		// Valores específicos con fallback
		theme: settings?.appearance?.theme || 'system',
		language: settings?.appearance?.language || 'es',
	};
}

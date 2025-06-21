/**
 * @file Hook para acceso a la configuración
 * @module hooks/use-settings
 */

import { selectActiveProfileId, selectAdvanced, selectAppearance, selectError, selectIsInitialized, selectIsLoading, selectIsSaving, selectLanguage, selectNotifications, selectPrivacy, selectSettings, selectTheme, useSettingsStore } from '@/store/settings.store';
import { useEffect } from 'react';

/**
 * Hook personalizado que proporciona acceso a la configuración global
 * y funciones para manipularla
 */
export function useSettings() {
	// Selectors for state
	const settings = useSettingsStore(selectSettings);
	const isLoading = useSettingsStore(selectIsLoading);
	const isSaving = useSettingsStore(selectIsSaving);
	const error = useSettingsStore(selectError);
	const isInitialized = useSettingsStore(selectIsInitialized);
	const activeProfileId = useSettingsStore(selectActiveProfileId);

	// Selectors for derived state
	const appearance = useSettingsStore(selectAppearance);
	const notifications = useSettingsStore(selectNotifications);
	const privacy = useSettingsStore(selectPrivacy);
	const advanced = useSettingsStore(selectAdvanced);
	const theme = useSettingsStore(selectTheme);
	const language = useSettingsStore(selectLanguage);

	// Actions
	const {
		initialize,
		loadSystemSettings,
		loadProfileSettings,
		updateSettings,
		resetSettings,
		setActiveProfile,
		setError,
	} = useSettingsStore.getState();

	// Inicializar la configuración al montar el componente
	useEffect(() => {
		if (!isInitialized) {
			initialize();
		}
	}, [isInitialized, initialize]);

	// Funciones de utilidad para trabajar con secciones específicas
	const updateAppearance = (newAppearance: Record<string, unknown>) => {
		updateSettings({ appearance: { ...appearance, ...newAppearance } });
	};

	const updateNotifications = (newNotifications: Record<string, unknown>) => {
		updateSettings({ notifications: { ...notifications, ...newNotifications } });
	};

	const updatePrivacy = (newPrivacy: Record<string, unknown>) => {
		updateSettings({ privacy: { ...privacy, ...newPrivacy } });
	};

	const updateAdvanced = (newAdvanced: Record<string, unknown>) => {
		updateSettings({ advanced: { ...advanced, ...newAdvanced } });
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
		appearance,
		notifications,
		privacy,
		advanced,

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
		theme,
		language,
	};
}

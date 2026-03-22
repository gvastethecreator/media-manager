/**
 * @file Hook para acceso a configuración global
 * @module hooks/use-settings
 * @description Wrapper hook que proporciona acceso fácil al store de settings
 */

import { useSettingsStore } from '@/store/settings.store';
import type { Settings, SettingsUpdate } from '@/types/settings';

interface UseSettingsReturn {
	/** Perfil activo */
	activeProfileId: string | null;
	/** Error actual */
	error: string | null;
	/** Inicializar configuración */
	initialize: () => Promise<void>;
	/** Si está inicializado */
	isInitialized: boolean;
	/** Estado de carga */
	isLoading: boolean;
	/** Si está guardando */
	isSaving: boolean;
	/** Cargar configuración de perfil */
	loadProfileSettings: (profileId: string) => Promise<void>;
	/** Cargar configuración del sistema */
	loadSystemSettings: () => Promise<void>;
	/** Resetear configuración */
	resetSettings: () => Promise<void>;
	/** Establecer perfil activo */
	setActiveProfile: (profileId: string | null) => void;
	/** Establecer error */
	setError: (error: string | null) => void;
	/** Configuración actual */
	settings: Settings | null;
	/** Actualizar configuración */
	updateSettings: (updates: SettingsUpdate) => Promise<void>;
}

/**
 * Hook para acceder y gestionar la configuración global
 */
export function useSettings(): UseSettingsReturn {
	const store = useSettingsStore();

	return {
		settings: store.settings,
		isLoading: store.isLoading,
		error: store.error,
		isSaving: store.isSaving,
		isInitialized: store.isInitialized,
		activeProfileId: store.activeProfileId,
		initialize: store.initialize,
		updateSettings: store.updateSettings,
		resetSettings: store.resetSettings,
		loadSystemSettings: store.loadSystemSettings,
		loadProfileSettings: store.loadProfileSettings,
		setActiveProfile: store.setActiveProfile,
		setError: store.setError,
	};
}

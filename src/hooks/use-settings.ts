/**
 * @file Hook para acceso a configuración global
 * @module hooks/use-settings
 * @description Wrapper hook que proporciona acceso fácil al store de settings
 */

import { useSettingsStore } from '@/store/settings.store';
import type { Settings, SettingsUpdate } from '@/types/settings';

interface UseSettingsReturn {
  /** Configuración actual */
  settings: Settings | null;
  /** Estado de carga */
  isLoading: boolean;
  /** Error actual */
  error: string | null;
  /** Si está guardando */
  isSaving: boolean;
  /** Si está inicializado */
  isInitialized: boolean;
  /** Perfil activo */
  activeProfileId: string | null;
  /** Inicializar configuración */
  initialize: () => Promise<void>;
  /** Actualizar configuración */
  updateSettings: (updates: SettingsUpdate) => Promise<void>;
  /** Resetear configuración */
  resetSettings: () => Promise<void>;
  /** Cargar configuración del sistema */
  loadSystemSettings: () => Promise<void>;
  /** Cargar configuración de perfil */
  loadProfileSettings: (profileId: string) => Promise<void>;
  /** Establecer perfil activo */
  setActiveProfile: (profileId: string | null) => void;
  /** Establecer error */
  setError: (error: string | null) => void;
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

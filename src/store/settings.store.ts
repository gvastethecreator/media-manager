/**
 * @file Store para la gestión de configuración global
 * @module store/settings
 */

import { create } from 'zustand';
import { devtools, persist as zustandPersist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { clientLogger } from '@/lib/logger/client-logger';
import { settingsService } from '@/services/settings';
import type { Settings, SettingsUpdate } from '@/types/settings';
import { createSelectors } from '@/lib/utils/store-selectors.utils';

// Logger para el store
const logger = clientLogger.withContext('SettingsStore');

// Interfaz del estado para la store de configuración
interface SettingsState {
	// Datos actuales de configuración
	settings: Settings | null;
	// Estado de carga
	isLoading: boolean;
	// Estado de error
	error: string | null;
	// Indica si se están guardando cambios
	isSaving: boolean;
	// Indica si se ha cargado la configuración
	isInitialized: boolean;
	// Perfil activo (si hay uno)
	activeProfileId: string | null;
}

// Interfaz de acciones para la store de configuración
interface SettingsActions {
	// Inicializa la configuración global
	initialize: () => Promise<void>;
	// Carga la configuración global del sistema
	loadSystemSettings: () => Promise<void>;
	// Carga la configuración de un perfil específico
	loadProfileSettings: (profileId: string) => Promise<void>;
	// Actualiza la configuración global
	updateSettings: (data: SettingsUpdate) => Promise<void>;
	// Restablece la configuración a valores predeterminados
	resetSettings: () => Promise<void>;
	// Cambia al perfil activo
	setActiveProfile: (profileId: string | null) => void;
	// Establece un mensaje de error
	setError: (error: string | null) => void;
}

// Combinación de estado y acciones
type SettingsStore = SettingsState & SettingsActions;

// Creación de la store
const useSettingsStoreBase = create<SettingsStore>()(
	devtools(
		zustandPersist(
			immer((set, get) => ({
				// Estado inicial
				settings: null,
				isLoading: false,
				error: null,
				isSaving: false,
				isInitialized: false,
				activeProfileId: null,

				// Inicializa la configuración
				initialize: async () => {
					// Si ya está inicializada, no hacer nada
					if (get().isInitialized) return;

					// Cargar configuración global
					await get().loadSystemSettings();

					// Marcar como inicializada
					set((state) => {
						state.isInitialized = true;
					});
				},

				// Carga la configuración global
				loadSystemSettings: async () => {
					set((state) => {
						state.isLoading = true;
						state.error = null;
					});

					try {
						const settings = await settingsService.getSystemSettings();

						set((state) => {
							state.settings = settings;
							state.isLoading = false;
							state.activeProfileId = null;
						});

						logger.info('✅ Configuración global cargada correctamente');
					} catch (error) {
						logger.error('❌ Error al cargar configuración global:', error);
						set((state) => {
							state.error = error instanceof Error ? error.message : 'Error desconocido al cargar la configuración';
							state.isLoading = false;
						});
					}
				},

				// Carga la configuración de un perfil
				loadProfileSettings: async (profileId: string) => {
					set((state) => {
						state.isLoading = true;
						state.error = null;
					});

					try {
						const settings = await settingsService.getProfileSettings(profileId);

						if (!settings) {
							throw new Error(`No se encontró configuración para el perfil ${profileId}`);
						}

						set((state) => {
							state.settings = settings;
							state.isLoading = false;
							state.activeProfileId = profileId;
						});

						logger.info('✅ Configuración del perfil cargada correctamente', { profileId });
					} catch (error) {
						logger.error('❌ Error al cargar configuración del perfil:', error, { profileId });
						set((state) => {
							state.error =
								error instanceof Error
									? error.message
									: `Error desconocido al cargar la configuración del perfil ${profileId}`;
							state.isLoading = false;
						});
					}
				},

				// Actualiza la configuración
				updateSettings: async (data: SettingsUpdate) => {
					set((state) => {
						state.isSaving = true;
						state.error = null;
					});

					try {
						let updatedSettings: Settings;
						const profileId = get().activeProfileId;

						// Si hay un perfil activo, actualizar la configuración del perfil
						if (profileId) {
							updatedSettings = await settingsService.updateProfileSettings(profileId, data);
							logger.info('✅ Configuración del perfil actualizada', { profileId });
						}
						// Si no, actualizar la configuración global
						else {
							updatedSettings = await settingsService.updateSystemSettings(data);
							logger.info('✅ Configuración global actualizada');
						}

						set((state) => {
							state.settings = updatedSettings;
							state.isSaving = false;
						});
					} catch (error) {
						logger.error('❌ Error al actualizar configuración:', error);
						set((state) => {
							state.error = error instanceof Error ? error.message : 'Error desconocido al actualizar la configuración';
							state.isSaving = false;
						});
					}
				},

				// Restablece la configuración
				resetSettings: async () => {
					set((state) => {
						state.isSaving = true;
						state.error = null;
					});

					try {
						const profileId = get().activeProfileId;

						// Si hay un perfil activo, resetear la configuración del perfil
						if (profileId) {
							await settingsService.resetProfileSettings(profileId);
							// Después de resetear, cargar la configuración global para el perfil
							await get().loadProfileSettings(profileId);
							logger.info('✅ Configuración del perfil reseteada a valores globales', { profileId });
						}
						// Si no, resetear la configuración global
						else {
							const defaultSettings = await settingsService.resetSystemSettings();
							set((state) => {
								state.settings = defaultSettings;
							});
							logger.info('✅ Configuración global reseteada a valores predeterminados');
						}

						set((state) => {
							state.isSaving = false;
						});
					} catch (error) {
						logger.error('❌ Error al resetear configuración:', error);
						set((state) => {
							state.error = error instanceof Error ? error.message : 'Error desconocido al resetear la configuración';
							state.isSaving = false;
						});
					}
				},

				// Establece el perfil activo
				setActiveProfile: (profileId: string | null) => {
					// Si ya está usando el mismo perfil, no hacer nada
					if (profileId === get().activeProfileId) return;

					// Actualizar el perfil activo
					set((state) => {
						state.activeProfileId = profileId;
					});

					// Cargar la configuración correspondiente
					if (profileId) {
						get().loadProfileSettings(profileId);
						logger.info('🔄 Cambiando al perfil', { profileId });
					} else {
						get().loadSystemSettings();
						logger.info('🔄 Cambiando a configuración global');
					}
				},

				// Establece un mensaje de error
				setError: (error: string | null) => {
					set((state) => {
						state.error = error;
					});
				},
			})),
			{
				name: 'settings-storage',
				partialize: (state) => ({
					settings: state.settings,
					activeProfileId: state.activeProfileId,
					isInitialized: state.isInitialized,
				}),
			}
		)
	)
);

// Creación de selectores para facilitar el acceso al estado
export const useSettingsStore = createSelectors(useSettingsStoreBase);

// Selectores específicos
export const selectSettings = (state: SettingsState) => state.settings;
export const selectIsLoading = (state: SettingsState) => state.isLoading;
export const selectIsSaving = (state: SettingsState) => state.isSaving;
export const selectError = (state: SettingsState) => state.error;
export const selectActiveProfileId = (state: SettingsState) => state.activeProfileId;
export const selectIsInitialized = (state: SettingsState) => state.isInitialized;

// Selectores derivados
export const selectAppearance = (state: SettingsState) => state.settings?.appearance;
export const selectNotifications = (state: SettingsState) => state.settings?.notifications;
export const selectPrivacy = (state: SettingsState) => state.settings?.privacy;
export const selectAdvanced = (state: SettingsState) => state.settings?.advanced;

export const selectTheme = (state: SettingsState) => state.settings?.appearance.theme || 'system';
export const selectLanguage = (state: SettingsState) => state.settings?.appearance.language || 'es';

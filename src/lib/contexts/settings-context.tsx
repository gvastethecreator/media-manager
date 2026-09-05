'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ensureDefaultProfile } from '@/lib/utils/profile/profile-utils';
import {
	type CreateProfileInput,
	type ProfileExtended,
	profileClient,
	type UpdateProfileInput,
} from '@/services/profile/client';
import { SETTINGS_TOASTS } from '@/lib/contexts/settings-copy';
import { toastService } from '@/services/toast/toast.service';
import type { ThumbnailQuality } from '@/types/thumbnails';
import type { ThumbnailAdvancedConfig } from '@/types/thumbnails-advanced.config';
import { DEFAULT_THUMBNAIL_ADVANCED_CONFIG } from '@/types/thumbnails-advanced.config';

export interface Settings {
	activeProfile?: string | null;
	autoBackup: boolean;
	compressUploads: boolean;
	defaultSort: 'name' | 'date' | 'size';
	defaultSortOrder: 'asc' | 'desc';
	defaultThumbnailSize: 'small' | 'medium' | 'large';
	defaultView: 'grid' | 'list';
	language: 'es' | 'en';
	notifications: boolean;

	// Colecciones, etiquetas y perfiles
	profiles?: ProfileExtended[];
	shortcuts?: { [key: string]: string };

	// Información del sistema
	system?: {
		cpuUsage?: number;
		memoryUsage?: number;
		cacheSize?: number;
	};
	// Configuraciones básicas
	theme: 'light' | 'dark' | 'system';
	thumbnailAdvancedConfig?: ThumbnailAdvancedConfig;
	thumbnailQuality: 'low' | 'medium' | 'high' | ThumbnailQuality;

	// Configuraciones avanzadas
	videoThumbnailAnimation?: boolean;
}

interface SettingsContextType {
	deleteProfile: (id: string) => Promise<void>;
	error: string | null;
	isLoading: boolean;
	resetSettings: () => void;
	setActiveProfile: (id: string) => Promise<void>;
	settings: Settings;

	// Funciones para colecciones, etiquetas y perfiles

	updateProfile: (id: string | null, data: CreateProfileInput | UpdateProfileInput) => Promise<void>;
	updateSettings: (settings: Partial<Settings>) => Promise<void>;
}

const defaultSettings: Settings = {
	theme: 'system',
	language: 'en',
	notifications: true,
	thumbnailQuality: 'medium',
	autoBackup: false,
	compressUploads: false,
	defaultView: 'grid',
	defaultSort: 'name',
	defaultSortOrder: 'asc',
	defaultThumbnailSize: 'medium',
	videoThumbnailAnimation: true,
	thumbnailAdvancedConfig: DEFAULT_THUMBNAIL_ADVANCED_CONFIG,
	profiles: [],
	activeProfile: null,
	shortcuts: {},
	system: {
		cpuUsage: 0,
		memoryUsage: 0,
		cacheSize: 0,
	},
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
	const [settings, setSettings] = useState<Settings>(defaultSettings);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Cargar configuraciones básicas
	const loadSettings = useCallback(async () => {
		// no-op para cumplir reglas de async/await y permitir futuras operaciones asíncronas
		await Promise.resolve();
		try {
			setIsLoading(true);
			// Cargar configuración desde localStorage
			const savedSettings = localStorage.getItem('appSettings');
			if (savedSettings) {
				setSettings((prev) => ({
					...prev,
					...JSON.parse(savedSettings),
				}));
			}
		} catch (err) {
			setError(SETTINGS_TOASTS.settingsLoadFailed);
			console.error('Failed to load settings:', err);
			toastService.error(SETTINGS_TOASTS.settingsLoadFailed);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Cargar perfiles
	const loadProfiles = useCallback(async () => {
		try {
			// Asegurar que existe al menos un perfil por defecto
			await ensureDefaultProfile();

			// Cargar perfiles después de asegurar que existe al menos uno
			const profiles = await profileClient.getProfiles();

			// Encontrar el perfil activo (debería existir al menos uno)
			const activeProfile = profiles.find((p) => p.isActive) || profiles[0];

			setSettings((prev) => ({
				...prev,
				profiles,
				activeProfile: activeProfile?.id || null,
			}));
		} catch (err) {
			console.error('Error loading profiles:', err);
			toastService.error(SETTINGS_TOASTS.profileLoadFailed);
		}
	}, []);

	// Cargar todas las configuraciones al inicio
	useEffect(() => {
		loadSettings();
		loadProfiles();
	}, [loadSettings, loadProfiles]);

	// Guardar configuraciones en localStorage cuando cambien
	useEffect(() => {
		if (!isLoading) {
			try {
				const settingsToSave = {
					theme: settings.theme,
					language: settings.language,
					notifications: settings.notifications,
					thumbnailQuality: settings.thumbnailQuality,
					autoBackup: settings.autoBackup,
					compressUploads: settings.compressUploads,
					defaultView: settings.defaultView,
					defaultSort: settings.defaultSort,
					defaultSortOrder: settings.defaultSortOrder,
					defaultThumbnailSize: settings.defaultThumbnailSize,
					videoThumbnailAnimation: settings.videoThumbnailAnimation,
					shortcuts: settings.shortcuts,
				};
				localStorage.setItem('appSettings', JSON.stringify(settingsToSave));
			} catch (err) {
				console.error('Failed to save settings:', err);
			}
		}
	}, [settings, isLoading]);

	const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
		await Promise.resolve();
		try {
			setSettings((prev) => ({ ...prev, ...newSettings }));
			return Promise.resolve();
		} catch (err) {
			console.error('Error updating settings:', err);
			toastService.error(SETTINGS_TOASTS.settingsUpdateFailed);
			return Promise.reject(err);
		}
	}, []);

	const resetSettings = useCallback(() => {
		setSettings(defaultSettings);
		localStorage.removeItem('appSettings');
	}, []);

	const updateProfile = useCallback(async (id: string | null, data: CreateProfileInput | UpdateProfileInput) => {
		try {
			if (id) {
				await profileClient.updateProfile(id, data as UpdateProfileInput);
			} else {
				await profileClient.createProfile(data as CreateProfileInput);
			}
			// Recargar los perfiles para obtener la lista actualizada
			await loadProfiles();
			toastService.success(SETTINGS_TOASTS.profileUpdated);
		} catch (err) {
			console.error('Error updating profile:', err);
			toastService.error(SETTINGS_TOASTS.profileUpdateFailed);
			throw err;
		}
	}, [loadProfiles]);

	const setActiveProfile = useCallback(async (id: string) => {
		try {
			await profileClient.setActiveProfile(id);
			await loadProfiles();
			toastService.success(SETTINGS_TOASTS.activeProfileUpdated);
		} catch (err) {
			console.error('Error setting active profile:', err);
			toastService.error(SETTINGS_TOASTS.activeProfileFailed);
			throw err;
		}
	}, [loadProfiles]);

	const deleteProfile = useCallback(async (id: string) => {
		try {
			await profileClient.deleteProfile(id);
			await loadProfiles();
			toastService.success(SETTINGS_TOASTS.profileDeleted);
		} catch (err) {
			console.error('Error deleting profile:', err);
			toastService.error(SETTINGS_TOASTS.profileDeleteFailed);
			throw err;
		}
	}, [loadProfiles]);

	const value = useMemo(
		() => ({
			settings,
			updateSettings,
			resetSettings,
			isLoading,
			error,
			updateProfile,
			setActiveProfile,
			deleteProfile,
		}),
		[settings, updateSettings, resetSettings, isLoading, error, updateProfile, setActiveProfile, deleteProfile]
	);

	return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
	const context = useContext(SettingsContext);
	if (context === undefined) {
		throw new Error('useSettings must be used within a SettingsProvider');
	}
	return context;
}

// Helper hook para colecciones y etiquetas
export function useCollectionTagContext() {
	const { settings } = useSettings();

	return {
		settings,
	};
}

// Helper hook para perfiles
export function useProfileContext() {
	const { settings, updateProfile, deleteProfile, setActiveProfile } = useSettings();

	return {
		settings: {
			profiles: settings.profiles || [],
			activeProfile: settings.activeProfile,
		},
		updateProfile,
		deleteProfile,
		setActiveProfile,
	};
}

// Helper hook para sincronizar el tema entre settings y theme-context
export function useThemeSync() {
	const { settings, updateSettings } = useSettings();

	return {
		theme: settings.theme,
		setTheme: (theme: 'light' | 'dark' | 'system') => {
			console.log(`🎨 Updating theme to: ${theme}`);
			updateSettings({ theme });
		},
	};
}

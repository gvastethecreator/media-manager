'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { profileClient } from '@/services/profile/client';
import { type ProfileCreate, type ProfileUpdate, type ProfileWithStats } from '@/services/profile-service-export';
import { toastService } from '@/services/toast/toast.service';
import type { ThumbnailQuality } from '@/types/thumbnails';

export interface Settings {
	// Configuraciones básicas
	theme: 'light' | 'dark' | 'system';
	language: 'es' | 'en';
	notifications: boolean;
	thumbnailQuality: 'low' | 'medium' | 'high' | ThumbnailQuality;
	autoBackup: boolean;
	compressUploads: boolean;
	defaultView: 'grid' | 'list';
	defaultSort: 'name' | 'date' | 'size';
	defaultSortOrder: 'asc' | 'desc';
	defaultThumbnailSize: 'small' | 'medium' | 'large';

	// Configuraciones avanzadas
	videoThumbnailAnimation?: boolean;
	shortcuts?: { [key: string]: string };

	// Colecciones, etiquetas y perfiles
	profiles?: ProfileWithStats[];
	activeProfile?: string | null;

	// Información del sistema
	system?: {
		cpuUsage?: number;
		memoryUsage?: number;
		cacheSize?: number;
	};
}

interface SettingsContextType {
	settings: Settings;
	updateSettings: (settings: Partial<Settings>) => Promise<void>;
	resetSettings: () => void;
	isLoading: boolean;
	error: string | null;

	// Funciones para colecciones, etiquetas y perfiles

	updateProfile: (id: string | null, data: ProfileCreate | ProfileUpdate) => Promise<void>;
	setActiveProfile: (id: string) => Promise<void>;
	deleteProfile: (id: string) => Promise<void>;
}

const defaultSettings: Settings = {
	theme: 'system',
	language: 'es',
	notifications: true,
	thumbnailQuality: 'medium',
	autoBackup: false,
	compressUploads: false,
	defaultView: 'grid',
	defaultSort: 'name',
	defaultSortOrder: 'asc',
	defaultThumbnailSize: 'medium',
	videoThumbnailAnimation: true,
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
			setError('Error loading settings');
			console.error('Failed to load settings:', err);
			toastService.error('No se pudo cargar la configuración');
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Cargar perfiles
	const loadProfiles = useCallback(async () => {
		try {
			const profiles = await profileClient.getProfiles();

			// Si no hay perfiles, crear uno por defecto
			if (profiles.length === 0) {
				const _defaultProfile = await profileClient.createProfile({
					name: 'Default',
					emoji: '🐸',
					color: '#10b981', // esmeralda
					isActive: true,
				});

				// Recargar los perfiles
				const updatedProfiles = await profileClient.getProfiles();
				// Buscar el perfil activo por una propiedad diferente (presumiblemente existe una propiedad id)
				const activeProfile = updatedProfiles.find((p) => p.id === _defaultProfile.id);

				setSettings((prev) => ({
					...prev,
					profiles: updatedProfiles,
					activeProfile: activeProfile?.id || null,
				}));
				return;
			}

			// Aquí asumimos que el primer perfil es el activo si no hay información específica
			const activeProfile = profiles[0];

			// Si no hay perfil activo, activar el primero
			if (!activeProfile && profiles.length > 0) {
				await profileClient.setActiveProfile(profiles[0].id);

				// Recargar los perfiles
				const updatedProfiles = await profileClient.getProfiles();
				const newActiveProfile = updatedProfiles[0]; // El primer perfil después de establecerlo como activo

				setSettings((prev) => ({
					...prev,
					profiles: updatedProfiles,
					activeProfile: newActiveProfile?.id || null,
				}));
				return;
			}

			setSettings((prev) => ({
				...prev,
				profiles,
				activeProfile: activeProfile?.id || null,
			}));
		} catch (error) {
			console.error('Error cargando perfiles:', error);
			toastService.error('No se pudieron cargar los perfiles');
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

	// Actualizar configuraciones
	const updateSettings = async (newSettings: Partial<Settings>) => {
		try {
			setSettings((prev) => ({ ...prev, ...newSettings }));
			return Promise.resolve();
		} catch (error) {
			console.error('Error updating settings:', error);
			toastService.error('No se pudieron actualizar las configuraciones');
			return Promise.reject(error);
		}
	};

	// Resetear configuraciones
	const resetSettings = () => {
		setSettings(defaultSettings);
		localStorage.removeItem('appSettings');
	};

	// Actualizar perfil
	const updateProfile = async (id: string | null, data: ProfileCreate | ProfileUpdate) => {
		try {
			if (id) {
				await profileClient.updateProfile(id, data as ProfileUpdate);
			} else {
				await profileClient.createProfile(data as ProfileCreate);
			}
			// Recargar los perfiles para obtener la lista actualizada
			await loadProfiles();
			toastService.success('Perfil actualizado correctamente');
		} catch (error) {
			console.error('Error updating profile:', error);
			toastService.error('No se pudo actualizar el perfil');
			throw error;
		}
	};

	// Establecer perfil activo
	const setActiveProfile = async (id: string) => {
		try {
			await profileClient.setActiveProfile(id);
			await loadProfiles();
			toastService.success('Perfil activo actualizado correctamente');
		} catch (error) {
			console.error('Error setting active profile:', error);
			toastService.error('No se pudo establecer el perfil activo');
			throw error;
		}
	};

	// Eliminar perfil
	const deleteProfile = async (id: string) => {
		try {
			await profileClient.deleteProfile(id);
			await loadProfiles();
			toastService.success('Perfil eliminado correctamente');
		} catch (error) {
			console.error('Error deleting profile:', error);
			toastService.error('No se pudo eliminar el perfil');
			throw error;
		}
	};

	const value = {
		settings,
		updateSettings,
		resetSettings,
		isLoading,
		error,
		updateProfile,
		setActiveProfile,
		deleteProfile,
	};

	return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
	const context = useContext(SettingsContext);
	if (context === undefined) {
		throw new Error('useSettings must be used within a SettingsProvider');
	}
	return context;
}

// Helper hook para manejar el tema
export function useTheme() {
	const { settings, updateSettings } = useSettings();

	useEffect(() => {
		const root = window.document.documentElement;
		const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		const theme = settings.theme === 'system' ? systemTheme : settings.theme;

		root.classList.remove('light', 'dark');
		root.classList.add(theme);
	}, [settings.theme]);

	return {
		theme: settings.theme,
		setTheme: (theme: 'light' | 'dark' | 'system') => updateSettings({ theme }),
	};
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

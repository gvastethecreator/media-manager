'use client';

/**
 * @file Contexto de configuraciones seguro - Sin dependencias de base de datos
 * @module lib/contexts/settings-context-safe
 */

import { toastService } from '@/services/toast/toast.service';
import type { ThumbnailQuality } from '@/types/entities/image/types';
import type { ProfileCreate, ProfileUpdate, ProfileWithStats } from '@/types/entities/profile/types';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

// Configuraciones por defecto
const defaultSettings: Settings = {
	theme: 'system',
	language: 'es',
	notifications: true,
	thumbnailQuality: 'medium',
	autoBackup: false,
	compressUploads: true,
	defaultView: 'grid',
	defaultSort: 'name',
	defaultSortOrder: 'asc',
	defaultThumbnailSize: 'medium',
	videoThumbnailAnimation: true,
	shortcuts: {},
	profiles: [],
	activeProfile: null,
	system: {
		cpuUsage: 0,
		memoryUsage: 0,
		cacheSize: 0,
	},
};

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

	// Funciones para perfiles (simplificadas, sin base de datos)
	updateProfile: (id: string | null, data: ProfileCreate | ProfileUpdate) => Promise<void>;
	setActiveProfile: (id: string) => Promise<void>;
	deleteProfile: (id: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * Provider de configuraciones seguro - Solo usa localStorage
 */
export function SettingsProviderSafe({ children }: { children: ReactNode }) {
	const [settings, setSettings] = useState<Settings>(defaultSettings);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Cargar configuraciones desde localStorage
	useEffect(() => {
		try {
			setIsLoading(true);
			setError(null);

			const savedSettings = localStorage.getItem('appSettings');
			if (savedSettings) {
				const parsed = JSON.parse(savedSettings);
				setSettings((prev) => ({ ...prev, ...parsed }));
			}

			// Crear perfil por defecto si no existe
			const savedProfiles = localStorage.getItem('appProfiles');
			if (!savedProfiles) {
				const defaultProfile: ProfileWithStats = {
					id: 'default-profile',
					name: 'Default',
					emoji: '🐸',
					color: '#10b981',
					isActive: true,
					description: 'Perfil por defecto',
					theme: 'system',
					language: 'es',
					createdAt: new Date(),
					updatedAt: new Date(),
					stats: {
						totalImages: 0,
						totalVideos: 0,
						totalDocuments: 0,
						totalAudios: 0,
						totalSize: 0,
						favoriteCount: 0,
						collectionCount: 0,
						tagCount: 0,
					},
				};

				const profiles = [defaultProfile];
				localStorage.setItem('appProfiles', JSON.stringify(profiles));
				setSettings((prev) => ({
					...prev,
					profiles,
					activeProfile: defaultProfile.id,
				}));
			} else {
				const profiles = JSON.parse(savedProfiles);
				const activeProfile = profiles.find((p: ProfileWithStats) => p.isActive)?.id || null;
				setSettings((prev) => ({
					...prev,
					profiles,
					activeProfile,
				}));
			}
		} catch (err) {
			console.error('Error loading settings:', err);
			setError('No se pudieron cargar las configuraciones');
		} finally {
			setIsLoading(false);
		}
	}, []);

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
		localStorage.removeItem('appProfiles');
	};

	// Actualizar perfil (solo localStorage)
	const updateProfile = async (id: string | null, data: ProfileCreate | ProfileUpdate) => {
		try {
			const profiles = settings.profiles || [];

			if (id) {
				// Actualizar perfil existente
				const updatedProfiles = profiles.map((profile) =>
					profile.id === id ? { ...profile, ...data, updatedAt: new Date() } : profile
				);
				localStorage.setItem('appProfiles', JSON.stringify(updatedProfiles));
				setSettings((prev) => ({ ...prev, profiles: updatedProfiles }));
			} else {
				// Crear nuevo perfil
				const newProfile: ProfileWithStats = {
					id: `profile-${Date.now()}`,
					...data,
					isActive: false,
					createdAt: new Date(),
					updatedAt: new Date(),
					stats: {
						totalImages: 0,
						totalVideos: 0,
						totalDocuments: 0,
						totalAudios: 0,
						totalSize: 0,
						favoriteCount: 0,
						collectionCount: 0,
						tagCount: 0,
					},
				} as ProfileWithStats;

				const updatedProfiles = [...profiles, newProfile];
				localStorage.setItem('appProfiles', JSON.stringify(updatedProfiles));
				setSettings((prev) => ({ ...prev, profiles: updatedProfiles }));
			}

			toastService.success('Perfil actualizado correctamente');
		} catch (error) {
			console.error('Error updating profile:', error);
			toastService.error('No se pudo actualizar el perfil');
			throw error;
		}
	};

	// Establecer perfil activo (solo localStorage)
	const setActiveProfile = async (id: string) => {
		try {
			const profiles = settings.profiles || [];
			const updatedProfiles = profiles.map((profile) => ({
				...profile,
				isActive: profile.id === id,
			}));

			localStorage.setItem('appProfiles', JSON.stringify(updatedProfiles));
			setSettings((prev) => ({
				...prev,
				profiles: updatedProfiles,
				activeProfile: id,
			}));

			toastService.success('Perfil activo actualizado correctamente');
		} catch (error) {
			console.error('Error setting active profile:', error);
			toastService.error('No se pudo establecer el perfil activo');
			throw error;
		}
	};

	// Eliminar perfil (solo localStorage)
	const deleteProfile = async (id: string) => {
		try {
			const profiles = settings.profiles || [];
			const updatedProfiles = profiles.filter((profile) => profile.id !== id);

			// Si se eliminó el perfil activo, activar el primero disponible
			let newActiveProfile = settings.activeProfile;
			if (settings.activeProfile === id && updatedProfiles.length > 0) {
				newActiveProfile = updatedProfiles[0].id;
				updatedProfiles[0].isActive = true;
			}

			localStorage.setItem('appProfiles', JSON.stringify(updatedProfiles));
			setSettings((prev) => ({
				...prev,
				profiles: updatedProfiles,
				activeProfile: newActiveProfile,
			}));

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

// Helper hook para colecciones y etiquetas (simplificado)
export function useCollectionTagContext() {
	const { settings } = useSettings();

	return {
		settings,
	};
}

// Helper hook para perfiles (simplificado)
export function useProfileContext() {
	const { settings, updateProfile, setActiveProfile, deleteProfile } = useSettings();

	return {
		profiles: settings.profiles || [],
		activeProfile: settings.profiles?.find((p) => p.id === settings.activeProfile) || null,
		updateProfile,
		setActiveProfile,
		deleteProfile,
	};
}
'use client';

import {
	type CollectionCreate,
	type CollectionUpdate,
	createCollection,
	deleteCollection as deleteCollectionAction,
	getCollections,
	updateCollection as updateCollectionAction,
} from '@/app/actions/collections/collection.actions';
import {
	createTag,
	deleteTag as deleteTagAction,
	getTags,
	updateTag as updateTagAction,
} from '@/app/actions/tags/tag.actions';
import type { TagCreate, TagUpdate, TagWithStats } from '@/app/actions/tags/tag.actions';
import { useToast } from '@/components/ui/use-toast';
import { formatBytes } from '@/lib/utils';
import {
	type ProfileCreate,
	type ProfileUpdate,
	type ProfileWithStats,
	profileService,
} from '@/services/profile.service';
import type { ThumbnailQuality } from '@/types/thumbnails';
import type { Collection, Profile } from '@prisma/client';
import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

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
	collections?: CollectionWithStats[];
	tags?: TagWithStats[];
	profiles?: ProfileWithStats[];
	activeProfile?: string | null;

	// Información del sistema
	system?: {
		cpuUsage?: number;
		memoryUsage?: number;
		cacheSize?: number;
	};
}

// Interfaces para colecciones y estadísticas
interface CollectionWithStats extends Collection {
	count: number;
	size: string;
}

interface SettingsContextType {
	settings: Settings;
	updateSettings: (settings: Partial<Settings>) => Promise<void>;
	resetSettings: () => void;
	isLoading: boolean;
	error: string | null;

	// Funciones para colecciones, etiquetas y perfiles
	updateCollection: (id: string | null, data: CollectionCreate | CollectionUpdate) => Promise<void>;
	updateTag: (id: string | null, data: TagCreate | TagUpdate) => Promise<void>;
	updateProfile: (id: string | null, data: ProfileCreate | ProfileUpdate) => Promise<void>;
	setActiveProfile: (id: string) => Promise<void>;
	deleteCollection: (id: string) => Promise<void>;
	deleteTag: (id: string) => Promise<void>;
	deleteProfile: (id: string) => Promise<void>;
}

const defaultSettings: Settings = {
	theme: 'system',
	language: 'es',
	notifications: true,
	thumbnailQuality: 'medium',
	autoBackup: false,
	compressUploads: true,
	defaultView: 'grid',
	defaultSort: 'date',
	defaultSortOrder: 'desc',
	defaultThumbnailSize: 'medium',
	videoThumbnailAnimation: true,
	collections: [],
	tags: [],
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
	const { toast } = useToast();

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
			toast({
				title: 'Error',
				description: 'No se pudo cargar la configuración',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	}, [toast]);

	// Cargar colecciones
	const loadCollections = useCallback(async () => {
		try {
			const collections = await getCollections();
			const mappedCollections = collections.map((collection) => ({
				...collection,
				count: collection._count.images,
				size: formatBytes(collection.totalSize),
			}));
			setSettings((prev) => ({ ...prev, collections: mappedCollections }));
		} catch (error) {
			console.error('Error cargando colecciones:', error);
			toast({
				title: 'Error',
				description: 'No se pudieron cargar las colecciones',
				variant: 'destructive',
			});
		}
	}, [toast]);

	// Cargar etiquetas
	const loadTags = useCallback(async () => {
		try {
			const tags = await getTags();
			const mappedTags = tags.map((tag) => ({
				...tag,
				count: tag._count.images,
				size: formatBytes(tag.totalSize),
			}));
			setSettings((prev) => ({ ...prev, tags: mappedTags }));
		} catch (error) {
			console.error('Error cargando etiquetas:', error);
			toast({
				title: 'Error',
				description: 'No se pudieron cargar las etiquetas',
				variant: 'destructive',
			});
		}
	}, [toast]);

	// Cargar perfiles
	const loadProfiles = useCallback(async () => {
		try {
			const profiles = await profileService.getProfiles();

			// Si no hay perfiles, crear uno por defecto
			if (profiles.length === 0) {
				const _defaultProfile = await profileService.createProfile({
					name: 'Default',
					emoji: '🐸',
					color: '#10b981', // esmeralda
					isActive: true,
				});

				// Recargar los perfiles
				const updatedProfiles = await profileService.getProfiles();
				const activeProfile = updatedProfiles.find((p) => p.isActive);

				setSettings((prev) => ({
					...prev,
					profiles: updatedProfiles,
					activeProfile: activeProfile?.id || null,
				}));
				return;
			}

			const activeProfile = profiles.find((p) => p.isActive);

			// Si no hay perfil activo, activar el primero
			if (!activeProfile && profiles.length > 0) {
				await profileService.setActiveProfile(profiles[0].id);

				// Recargar los perfiles
				const updatedProfiles = await profileService.getProfiles();
				const newActiveProfile = updatedProfiles.find((p) => p.isActive);

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
			toast({
				title: 'Error',
				description: 'No se pudieron cargar los perfiles',
				variant: 'destructive',
			});
		}
	}, [toast]);

	// Cargar todas las configuraciones al inicio
	useEffect(() => {
		loadSettings();
		loadCollections();
		loadTags();
		loadProfiles();
	}, [loadSettings, loadCollections, loadTags, loadProfiles]);

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
			toast({
				title: 'Error',
				description: 'No se pudieron actualizar las configuraciones',
				variant: 'destructive',
			});
			return Promise.reject(error);
		}
	};

	// Reiniciar configuraciones
	const resetSettings = () => {
		setSettings(defaultSettings);
	};

	// Actualizar colección
	const updateCollection = async (id: string | null, data: CollectionCreate | CollectionUpdate) => {
		try {
			if (!id) {
				// Crear nueva colección
				await createCollection(data as CollectionCreate);
			} else {
				// Actualizar colección existente
				await updateCollectionAction(id, data as CollectionUpdate);
			}

			await loadCollections();
			toast({
				title: 'Éxito',
				description: id ? 'Colección actualizada correctamente' : 'Colección creada correctamente',
			});
		} catch (error) {
			console.error('Error updating collection:', error);
			toast({
				title: 'Error',
				description: id ? 'No se pudo actualizar la colección' : 'No se pudo crear la colección',
				variant: 'destructive',
			});
			throw error;
		}
	};

	// Actualizar etiqueta
	const updateTag = async (id: string | null, data: TagCreate | TagUpdate) => {
		try {
			if (!id) {
				// Crear nuevo tag
				await createTag(data as TagCreate);
			} else {
				// Actualizar tag existente
				await updateTagAction(id, data as TagUpdate);
			}
			await loadTags();
			toast({
				title: 'Éxito',
				description: id ? 'Etiqueta actualizada correctamente' : 'Etiqueta creada correctamente',
			});
		} catch (error) {
			console.error('Error updating tag:', error);
			toast({
				title: 'Error',
				description: id ? 'No se pudo actualizar la etiqueta' : 'No se pudo crear la etiqueta',
				variant: 'destructive',
			});
			throw error;
		}
	};

	// Actualizar perfil (o crear uno nuevo si id es null)
	const updateProfile = async (id: string | null, data: ProfileCreate | ProfileUpdate) => {
		try {
			let _profile: Profile | null = null;

			if (id) {
				// Actualizar perfil existente
				_profile = await profileService.updateProfile(id, data as ProfileUpdate);
			} else {
				// Crear nuevo perfil
				_profile = await profileService.createProfile(data as ProfileCreate);
			}

			// Recargar los perfiles para obtener la lista actualizada
			await loadProfiles();

			toast({
				title: 'Éxito',
				description: id ? 'Perfil actualizado correctamente' : 'Perfil creado correctamente',
			});
		} catch (error) {
			console.error('Error updating profile:', error);
			toast({
				title: 'Error',
				description: id ? 'No se pudo actualizar el perfil' : 'No se pudo crear el perfil',
				variant: 'destructive',
			});
			throw error;
		}
	};

	// Establecer perfil activo
	const setActiveProfile = async (id: string) => {
		try {
			await profileService.setActiveProfile(id);
			await loadProfiles();
			toast({
				title: 'Éxito',
				description: 'Perfil activo actualizado correctamente',
			});
		} catch (error) {
			console.error('Error setting active profile:', error);
			toast({
				title: 'Error',
				description: 'No se pudo establecer el perfil activo',
				variant: 'destructive',
			});
			throw error;
		}
	};

	// Eliminar colección
	const deleteCollection = async (id: string) => {
		try {
			await deleteCollectionAction(id);
			await loadCollections();
			toast({
				title: 'Éxito',
				description: 'Colección eliminada correctamente',
			});
		} catch (error) {
			console.error('Error deleting collection:', error);
			toast({
				title: 'Error',
				description: 'No se pudo eliminar la colección',
				variant: 'destructive',
			});
			throw error;
		}
	};

	// Eliminar etiqueta
	const deleteTag = async (id: string) => {
		try {
			await deleteTagAction(id);
			await loadTags();
			toast({
				title: 'Éxito',
				description: 'Etiqueta eliminada correctamente',
			});
		} catch (error) {
			console.error('Error deleting tag:', error);
			toast({
				title: 'Error',
				description: 'No se pudo eliminar la etiqueta',
				variant: 'destructive',
			});
			throw error;
		}
	};

	// Eliminar perfil
	const deleteProfile = async (id: string) => {
		try {
			await profileService.deleteProfile(id);
			await loadProfiles();
			toast({
				title: 'Éxito',
				description: 'Perfil eliminado correctamente',
			});
		} catch (error) {
			console.error('Error deleting profile:', error);
			toast({
				title: 'Error',
				description: 'No se pudo eliminar el perfil',
				variant: 'destructive',
			});
			throw error;
		}
	};

	const value = {
		settings,
		updateSettings,
		resetSettings,
		isLoading,
		error,
		updateCollection,
		updateTag,
		updateProfile,
		setActiveProfile,
		deleteCollection,
		deleteTag,
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
	const { settings, updateCollection, updateTag, deleteCollection, deleteTag } = useSettings();

	return {
		collections: settings.collections || [],
		tags: settings.tags || [],
		updateCollection,
		updateTag,
		deleteCollection,
		deleteTag,
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

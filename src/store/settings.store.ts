import {
	type AppSettings,
	type Collection,
	DEFAULT_SETTINGS,
	type Folder,
	type Profile,
	type ShortcutSettings,
	type SystemSettings,
	type Tag,
	type ThumbnailSettings,
	type ViewSettings,
} from '@/types/settings';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '../lib/logger/logger';

// Estado base para settings
interface SettingsState extends AppSettings {
	// Acciones generales
	updateSettings: (settings: Partial<AppSettings>) => void;
	resetSettings: () => void;

	// Acciones de perfil
	updateProfile: (id: string | null, profile: Partial<Profile>) => void;
	setActiveProfile: (id: string) => void;
	deleteProfile: (id: string) => void;

	// Acciones de colección
	updateCollection: (id: string | null, collection: Partial<Collection>) => void;
	deleteCollection: (id: string) => void;

	// Acciones de etiquetas
	updateTag: (id: string | null, tag: Partial<Tag>) => void;
	deleteTag: (id: string) => void;

	// Acciones de carpetas
	updateFolder: (id: string | null, folder: Partial<Folder>) => void;
	deleteFolder: (id: string) => void;

	// Acciones de configuración
	updateViewSettings: (settings: Partial<ViewSettings>) => void;
	updateThumbnailSettings: (settings: Partial<ThumbnailSettings>) => void;
	updateSystemSettings: (settings: Partial<SystemSettings>) => void;
	updateShortcuts: (shortcuts: Partial<ShortcutSettings>) => void;
}

const settingsLogger = logger.withContext('SettingsStore');

// Función para filtrar valores undefined de los shortcuts
function filterUndefinedValues(obj: Record<string, string | undefined>): Record<string, string> {
	return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== undefined)) as Record<string, string>;
}

// Crear store con persistencia
export const useSettingsStore = create<SettingsState>()(
	persist(
		(set, _get) => ({
			// Estado inicial
			...(DEFAULT_SETTINGS as AppSettings),

			// Acciones generales
			updateSettings: (settings) => {
				settingsLogger.info('Actualizando configuración general', { settings });
				set((state) => ({
					...state,
					...settings,
					lastUpdate: new Date().toISOString(),
				}));
			},

			resetSettings: () => {
				settingsLogger.info('Restaurando configuración por defecto');
				set({ ...(DEFAULT_SETTINGS as AppSettings), lastUpdate: new Date().toISOString() });
			},

			// Acciones de perfil
			updateProfile: (id, profile) => {
				settingsLogger.info('Actualizando perfil', { id, profile });
				set((state) => ({
					...state,
					profiles: id
						? state.profiles.map((p) => (p.id === id ? { ...p, ...profile } : p))
						: [...state.profiles, { id: crypto.randomUUID(), ...profile } as Profile],
					lastUpdate: new Date().toISOString(),
				}));
			},

			setActiveProfile: (id) => {
				settingsLogger.info('Cambiando perfil activo', { id });
				set((state) => ({
					...state,
					activeProfile: id,
					lastUpdate: new Date().toISOString(),
				}));
			},

			deleteProfile: (id) => {
				settingsLogger.info('Eliminando perfil', { id });
				set((state) => ({
					...state,
					profiles: state.profiles.filter((p) => p.id !== id),
					activeProfile: state.activeProfile === id ? null : state.activeProfile,
					lastUpdate: new Date().toISOString(),
				}));
			},

			// Acciones de colección
			updateCollection: (id, collection) => {
				settingsLogger.info('Actualizando colección', { id, collection });
				set((state) => ({
					...state,
					collections: id
						? state.collections.map((c) => (c.id === id ? { ...c, ...collection } : c))
						: [...state.collections, { id: crypto.randomUUID(), ...collection } as Collection],
					lastUpdate: new Date().toISOString(),
				}));
			},

			deleteCollection: (id) => {
				settingsLogger.info('Eliminando colección', { id });
				set((state) => ({
					...state,
					collections: state.collections.filter((c) => c.id !== id),
					lastUpdate: new Date().toISOString(),
				}));
			},

			// Acciones de etiquetas
			updateTag: (id, tag) => {
				settingsLogger.info('Actualizando etiqueta', { id, tag });
				set((state) => ({
					...state,
					tags: id
						? state.tags.map((t) => (t.id === id ? { ...t, ...tag } : t))
						: [...state.tags, { id: crypto.randomUUID(), ...tag } as Tag],
					lastUpdate: new Date().toISOString(),
				}));
			},

			deleteTag: (id) => {
				settingsLogger.info('Eliminando etiqueta', { id });
				set((state) => ({
					...state,
					tags: state.tags.filter((t) => t.id !== id),
					lastUpdate: new Date().toISOString(),
				}));
			},

			// Acciones de carpetas
			updateFolder: (id, folder) => {
				settingsLogger.info('Actualizando carpeta', { id, folder });
				set((state) => ({
					...state,
					folders: id
						? state.folders.map((f) => (f.id === id ? { ...f, ...folder } : f))
						: [...state.folders, { id: crypto.randomUUID(), ...folder } as Folder],
					lastUpdate: new Date().toISOString(),
				}));
			},

			deleteFolder: (id) => {
				settingsLogger.info('Eliminando carpeta', { id });
				set((state) => ({
					...state,
					folders: state.folders.filter((f) => f.id !== id),
					lastUpdate: new Date().toISOString(),
				}));
			},

			// Acciones de configuración
			updateViewSettings: (settings) => {
				settingsLogger.info('Actualizando configuración de vista', { settings });
				set((state) => ({
					...state,
					view: {
						...state.view,
						...settings,
					},
					lastUpdate: new Date().toISOString(),
				}));
			},

			updateThumbnailSettings: (settings) => {
				settingsLogger.info('Actualizando configuración de miniaturas', { settings });
				set((state) => ({
					...state,
					thumbnails: {
						...state.thumbnails,
						...settings,
					},
					lastUpdate: new Date().toISOString(),
				}));
			},

			updateSystemSettings: (settings) => {
				settingsLogger.info('Actualizando configuración del sistema', { settings });
				set((state) => ({
					...state,
					system: {
						...state.system,
						...settings,
					},
					lastUpdate: new Date().toISOString(),
				}));
			},

			updateShortcuts: (shortcuts) => {
				settingsLogger.info('Actualizando atajos de teclado', { shortcuts });
				set((state) => ({
					...state,
					shortcuts: {
						...state.shortcuts,
						...filterUndefinedValues(shortcuts),
					},
					lastUpdate: new Date().toISOString(),
				}));
			},
		}),
		{
			name: 'settings-storage',
			version: 1,
		}
	)
);

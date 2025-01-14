"use client";

import type { Collection, Profile } from ".prisma/client";
import { createContext, useContext, useEffect, useState } from "react";
import {
	CollectionCreate,
	CollectionUpdate,
	createCollection,
	getCollections,
	deleteCollection as deleteCollectionAction,
} from "@/app/actions/collection.actions";
import {
	getTags,
	createTag,
	updateTag as updateTagAction,
	deleteTag as deleteTagAction,
} from "@/app/actions/tag.actions";
import type {
	TagCreate,
	TagUpdate,
	TagWithStats,
} from "@/app/actions/tag.actions";
import {
	profileService,
	ProfileCreate,
	ProfileUpdate,
} from "@/services/profile.service";
import { useToast } from "@/components/ui/use-toast";
import { ThumbnailQuality } from "@/types/thumbnails";
import { formatBytes } from "@/lib/utils";

interface CollectionWithStats extends Collection {
	count: number;
	size: string;
}

export interface Settings {
	collections: CollectionWithStats[];
	tags: TagWithStats[];
	profiles: Profile[];
	activeProfile: string | null;
	thumbnailQuality: ThumbnailQuality;
	videoThumbnailAnimation: boolean;
	shortcuts: { [key: string]: string };
	system: {
		cpuUsage: number;
		memoryUsage: number;
		cacheSize: number;
	};
}

interface SettingsContextType {
	settings: Settings;
	updateSettings: (settings: Partial<Settings>) => Promise<void>;
	updateCollection: (
		id: string | null,
		data: CollectionCreate | CollectionUpdate
	) => Promise<void>;
	updateTag: (id: string | null, data: TagCreate | TagUpdate) => Promise<void>;
	updateProfile: (
		id: string | null,
		data: ProfileCreate | ProfileUpdate
	) => Promise<void>;
	setActiveProfile: (id: string) => Promise<void>;
	deleteCollection: (id: string) => Promise<void>;
	deleteTag: (id: string) => Promise<void>;
	deleteProfile: (id: string) => Promise<void>;
}

const defaultSettings: Settings = {
	collections: [],
	tags: [],
	profiles: [],
	activeProfile: null,
	thumbnailQuality: ThumbnailQuality.MEDIUM,
	videoThumbnailAnimation: true,
	shortcuts: {},
	system: {
		cpuUsage: 0,
		memoryUsage: 0,
		cacheSize: 0,
	},
};

const SettingsContext = createContext<SettingsContextType>({
	settings: defaultSettings,
	updateSettings: async () => {},
	updateCollection: async () => {},
	updateTag: async () => {},
	updateProfile: async () => {},
	setActiveProfile: async () => {},
	deleteCollection: async () => {},
	deleteTag: async () => {},
	deleteProfile: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
	const [settings, setSettings] = useState<Settings>(defaultSettings);
	const { toast } = useToast();

	const loadSettings = async () => {
		try {
			// Cargar configuración desde localStorage o API
			const savedSettings = localStorage.getItem("settings");
			if (savedSettings) {
				const parsed = JSON.parse(savedSettings);
				setSettings((prev) => ({
					...prev,
					thumbnailQuality: parsed.thumbnailQuality || "medium",
					videoThumbnailAnimation: parsed.videoThumbnailAnimation ?? true,
					shortcuts: parsed.shortcuts || {},
				}));
			}
		} catch (error) {
			console.error("Error loading settings:", error);
		}
	};

	const updateSettings = async (newSettings: Partial<Settings>) => {
		try {
			setSettings((prev) => {
				const updated = { ...prev, ...newSettings };
				// Guardar en localStorage
				localStorage.setItem(
					"settings",
					JSON.stringify({
						thumbnailQuality: updated.thumbnailQuality,
						videoThumbnailAnimation: updated.videoThumbnailAnimation,
						shortcuts: updated.shortcuts,
					})
				);
				return updated;
			});
		} catch (error) {
			console.error("Error updating settings:", error);
			toast({
				title: "Error",
				description: "No se pudieron actualizar las configuraciones",
				variant: "destructive",
			});
		}
	};

	const loadCollections = async () => {
		try {
			const collections = await getCollections();
			const mappedCollections = collections.map((c) => ({
				...c,
				count: c._count.images,
				size: formatBytes(c.totalSize),
			}));
			setSettings((prev) => ({ ...prev, collections: mappedCollections }));
		} catch (error) {
			console.error("Error loading collections:", error);
			toast({
				title: "Error",
				description: "No se pudieron cargar las colecciones",
				variant: "destructive",
			});
		}
	};

	const loadTags = async () => {
		try {
			const tags = await getTags();
			setSettings((prev) => ({ ...prev, tags }));
		} catch (error) {
			console.error("Error loading tags:", error);
			toast({
				title: "Error",
				description: "No se pudieron cargar las etiquetas",
				variant: "destructive",
			});
		}
	};

	const loadProfiles = async () => {
		try {
			const profiles = await profileService.getProfiles();
			const activeProfile = profiles.find((p) => p.isActive);
			setSettings((prev) => ({
				...prev,
				profiles,
				activeProfile: activeProfile?.id || null,
			}));
		} catch (error) {
			console.error("Error loading profiles:", error);
			toast({
				title: "Error",
				description: "No se pudieron cargar los perfiles",
				variant: "destructive",
			});
		}
	};

	useEffect(() => {
		loadSettings();
		loadCollections();
		loadTags();
		loadProfiles();
	}, []);

	const updateCollection = async (
		id: string | null,
		data: CollectionCreate | CollectionUpdate
	) => {
		try {
			if (!id) {
				// Crear nueva colección
				await createCollection(data as CollectionCreate);
			} else {
				// Actualizar colección existente
				await updateCollection(id, data as CollectionUpdate);
			}

			await loadCollections();
			toast({
				title: "Éxito",
				description: id
					? "Colección actualizada correctamente"
					: "Colección creada correctamente",
			});
		} catch (error) {
			console.error("Error updating collection:", error);
			toast({
				title: "Error",
				description: id
					? "No se pudo actualizar la colección"
					: "No se pudo crear la colección",
				variant: "destructive",
			});
		}
	};

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
				title: "Éxito",
				description: id
					? "Etiqueta actualizada correctamente"
					: "Etiqueta creada correctamente",
			});
		} catch (error) {
			console.error("Error updating tag:", error);
			toast({
				title: "Error",
				description: id
					? "No se pudo actualizar la etiqueta"
					: "No se pudo crear la etiqueta",
				variant: "destructive",
			});
		}
	};

	const updateProfile = async (
		id: string | null,
		data: ProfileCreate | ProfileUpdate
	) => {
		try {
			if (!id) {
				// Crear nuevo perfil
				await profileService.createProfile(data as ProfileCreate);
			} else {
				// Actualizar perfil existente
				await profileService.updateProfile(id, data as ProfileUpdate);
			}
			await loadProfiles();
			toast({
				title: "Éxito",
				description: id
					? "Perfil actualizado correctamente"
					: "Perfil creado correctamente",
			});
		} catch (error) {
			console.error("Error updating profile:", error);
			toast({
				title: "Error",
				description: id
					? "No se pudo actualizar el perfil"
					: "No se pudo crear el perfil",
				variant: "destructive",
			});
		}
	};

	const setActiveProfile = async (id: string) => {
		try {
			await profileService.setActiveProfile(id);
			await loadProfiles();
			toast({
				title: "Éxito",
				description: "Perfil activo actualizado correctamente",
			});
		} catch (error) {
			console.error("Error setting active profile:", error);
			toast({
				title: "Error",
				description: "No se pudo actualizar el perfil activo",
				variant: "destructive",
			});
		}
	};

	const deleteCollection = async (id: string) => {
		try {
			await deleteCollection(id);
			await loadCollections();
			toast({
				title: "Éxito",
				description: "Colección eliminada correctamente",
			});
		} catch (error) {
			console.error("Error deleting collection:", error);
			toast({
				title: "Error",
				description: "No se pudo eliminar la colección",
				variant: "destructive",
			});
		}
	};

	const deleteTag = async (id: string) => {
		try {
			await deleteTagAction(id);
			await loadTags();
			toast({
				title: "Éxito",
				description: "Etiqueta eliminada correctamente",
			});
		} catch (error) {
			console.error("Error deleting tag:", error);
			toast({
				title: "Error",
				description: "No se pudo eliminar la etiqueta",
				variant: "destructive",
			});
		}
	};

	const deleteProfile = async (id: string) => {
		try {
			await profileService.deleteProfile(id);
			await loadProfiles();
			toast({
				title: "Éxito",
				description: "Perfil eliminado correctamente",
			});
		} catch (error) {
			console.error("Error deleting profile:", error);
			toast({
				title: "Error",
				description: "No se pudo eliminar el perfil",
				variant: "destructive",
			});
		}
	};

	return (
		<SettingsContext.Provider
			value={{
				settings,
				updateSettings,
				updateCollection,
				updateTag,
				updateProfile,
				setActiveProfile,
				deleteCollection,
				deleteTag,
				deleteProfile,
			}}
		>
			{children}
		</SettingsContext.Provider>
	);
}

export function useSettingsContext() {
	const context = useContext(SettingsContext);
	if (!context) {
		throw new Error(
			"useSettingsContext must be used within a SettingsProvider"
		);
	}
	return context;
}

// Alias para mantener compatibilidad
export function useCollectionTagContext() {
	const context = useContext(SettingsContext);
	if (!context) {
		throw new Error(
			"useCollectionTagContext must be used within a SettingsProvider"
		);
	}
	return {
		collections: context.settings.collections,
		updateCollection: context.updateCollection,
		deleteCollection: context.deleteCollection,
		settings: context.settings,
	};
}

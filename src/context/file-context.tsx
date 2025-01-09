"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { FileItem } from "@/types/files";
import type { ViewType } from "@/components/views/types";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";
import type { Collection, Tag, Folder } from "@/types/settings";
import {
	getAllImages,
	getCollectionImages,
	getFolderImages,
	getTagImages,
	toggleFavorite,
	getSystemData,
} from "@/app/actions/files";

const fileLogger = logger.withContext("FileContext");

type ThumbnailSize = "small" | "medium" | "large";

interface FilesContextType {
	currentView: ViewType;
	currentItems: FileItem[];
	selectedItem: FileItem | null;
	collections: Collection[];
	folders: Folder[];
	tags: Tag[];
	thumbnailSize: ThumbnailSize;
	isLoading: boolean;
	currentPath: string[];
	// Métodos
	setCurrentView: (view: ViewType) => void;
	setSelectedItem: (item: FileItem | null) => void;
	setThumbnailSize: (size: ThumbnailSize) => void;
	handleSelectCollection: (id: string) => Promise<void>;
	handleSelectFolder: (id: string) => Promise<void>;
	handleSelectTag: (name: string) => Promise<void>;
	handleSelectItem: (item: FileItem) => void;
	handleToggleFavorite: (id: string) => Promise<void>;
}

const FilesContext = createContext<FilesContextType | null>(null);

export function useFiles() {
	const context = useContext(FilesContext);
	if (!context) {
		throw new Error("useFiles debe ser usado dentro de un FilesProvider");
	}
	return context;
}

export function FilesProvider({ children }: { children: React.ReactNode }) {
	const { toast } = useToast();
	const [currentView, setCurrentView] = useState<ViewType>("files");
	const [currentItems, setCurrentItems] = useState<FileItem[]>([]);
	const [selectedItem, setSelectedItem] = useState<FileItem | null>(null);
	const [currentPath, setCurrentPath] = useState<string[]>(["Inicio"]);
	const [isLoading, setIsLoading] = useState(false);
	const [thumbnailSize, setThumbnailSize] = useState<ThumbnailSize>("medium");

	// Estados para datos del sistema
	const [collections, setCollections] = useState<Collection[]>([]);
	const [folders, setFolders] = useState<Folder[]>([]);
	const [tags, setTags] = useState<Tag[]>([]);

	// Cargar datos iniciales
	useEffect(() => {
		const loadInitialData = async () => {
			fileLogger.info("📦 Cargando datos iniciales...");
			setIsLoading(true);
			try {
				// Cargar datos del sistema y las imágenes usando Server Actions
				const [systemData, images] = await Promise.all([
					getSystemData(),
					getAllImages(),
				]);

				setFolders(systemData.folders);
				setCollections(systemData.collections);
				setTags(systemData.tags);
				setCurrentItems(images);
				setCurrentPath(["Inicio", "Todas las imágenes"]);

				// Actualizar los contadores
				const updateCounts = () => {
					const collectionCounts = new Map<string, number>();
					const tagCounts = new Map<string, number>();

					images.forEach((img) => {
						img.collections.forEach((col) => {
							collectionCounts.set(
								col.id,
								(collectionCounts.get(col.id) || 0) + 1
							);
						});
						img.tags.forEach((tag) => {
							tagCounts.set(tag.id, (tagCounts.get(tag.id) || 0) + 1);
						});
					});

					setCollections((prev) =>
						prev.map((col) => ({
							...col,
							count: collectionCounts.get(col.id) || 0,
						}))
					);

					setTags((prev) =>
						prev.map((tag) => ({
							...tag,
							count: tagCounts.get(tag.id) || 0,
						}))
					);
				};

				updateCounts();

				fileLogger.info("✅ Datos iniciales cargados correctamente", {
					folders: systemData.folders.length,
					collections: systemData.collections.length,
					tags: systemData.tags.length,
					images: images.length,
				});
			} catch (error) {
				fileLogger.error("❌ Error al cargar datos iniciales:", error);
				toast({
					title: "Error",
					description: "No se pudieron cargar los datos iniciales",
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		};

		loadInitialData();
	}, []);

	const handleSelectCollection = async (id: string) => {
		fileLogger.info("📁 Seleccionando colección:", id);
		setIsLoading(true);
		try {
			const images = await getCollectionImages(id);
			const collection = collections.find((c) => c.id === id);

			if (!collection) {
				throw new Error("Colección no encontrada");
			}

			setCurrentPath(["Inicio", "Colecciones", collection.name]);
			setCurrentItems(images);
			setCurrentView("collection-content");
		} catch (error) {
			fileLogger.error("❌ Error al seleccionar colección:", error);
			toast({
				title: "Error",
				description: "No se pudo cargar la colección",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleSelectFolder = async (id: string) => {
		fileLogger.info("📂 Seleccionando carpeta:", id);
		setIsLoading(true);
		try {
			const images = await getFolderImages(id);
			const folder = folders.find((f) => f.id === id);

			if (!folder) {
				throw new Error("Carpeta no encontrada");
			}

			setCurrentPath(["Inicio", "Carpetas", folder.name]);
			setCurrentItems(images);
			setCurrentView("folder-content");
		} catch (error) {
			fileLogger.error("❌ Error al seleccionar carpeta:", error);
			toast({
				title: "Error",
				description: "No se pudo cargar la carpeta",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleSelectTag = async (name: string) => {
		fileLogger.info("🏷️ Seleccionando etiqueta:", name);
		setIsLoading(true);
		try {
			const images = await getTagImages(name);
			const tag = tags.find((t) => t.name === name);

			if (!tag) {
				throw new Error("Etiqueta no encontrada");
			}

			setCurrentPath(["Inicio", "Etiquetas", tag.name]);
			setCurrentItems(images);
			setCurrentView("tag-content");
		} catch (error) {
			fileLogger.error("❌ Error al seleccionar etiqueta:", error);
			toast({
				title: "Error",
				description: "No se pudo cargar la etiqueta",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleSelectItem = (item: FileItem) => {
		try {
			fileLogger.info("🖼️ Seleccionando archivo:", {
				id: item.id,
				name: item.name,
			});
			setSelectedItem(item);
		} catch (error) {
			fileLogger.error("❌ Error al seleccionar archivo:", error);
		}
	};

	const handleToggleFavorite = async (id: string) => {
		try {
			const newIsFavorite = await toggleFavorite(id);

			// Actualizar el estado local
			setCurrentItems((items) =>
				items.map((item) =>
					item.id === id ? { ...item, isFavorite: newIsFavorite } : item
				)
			);

			fileLogger.info(
				`✅ ${newIsFavorite ? "Agregado a" : "Eliminado de"} favoritos:`,
				id
			);
		} catch (error) {
			fileLogger.error("❌ Error al togglear favorito:", error);
			toast({
				title: "Error",
				description: "No se pudo actualizar el favorito",
				variant: "destructive",
			});
		}
	};

	useEffect(() => {
		fileLogger.info("🔄 Cambiando vista actual:", currentView);
		try {
			switch (currentView) {
				case "all-images":
					setCurrentPath(["Inicio", "Todas las imágenes"]);
					break;
				case "collections":
					setCurrentPath(["Inicio", "Colecciones"]);
					break;
				case "folders":
					setCurrentPath(["Inicio", "Carpetas"]);
					break;
				case "tags":
					setCurrentPath(["Inicio", "Etiquetas"]);
					break;
				case "favorites":
					setCurrentPath(["Inicio", "Favoritos"]);
					break;
				case "settings":
					setCurrentPath(["Inicio", "Configuración"]);
					break;
				// Los demás casos se manejan en los handlers específicos
				default:
					fileLogger.warn("⚠️ Vista no reconocida:", currentView);
			}
		} catch (error) {
			fileLogger.error("❌ Error al cambiar la vista:", error);
		}
	}, [currentView]);

	return (
		<FilesContext.Provider
			value={{
				currentView,
				currentItems,
				selectedItem,
				collections,
				folders,
				tags,
				thumbnailSize,
				isLoading,
				currentPath,
				setCurrentView,
				setSelectedItem,
				setThumbnailSize,
				handleSelectCollection,
				handleSelectFolder,
				handleSelectTag,
				handleSelectItem,
				handleToggleFavorite,
			}}
		>
			{children}
		</FilesContext.Provider>
	);
}

"use client";

import {
	getFolderImages,
	reindexFolder,
} from "@/app/actions/folders/folder.actions";
import { BaseContentView, ContentViewProvider } from "@/components/views/base";
import type { FolderContentProps } from "@/components/views/base";
import { logger } from "@/lib/logger";
import { useFileManager } from "@/store/file-manager.store";
import { Folder } from "lucide-react";
import { useCallback } from "react";

const viewLogger = logger.withContext("FolderContentView");

export function FolderContentView() {
	const {
		currentItems: items,
		toggleItemSelection,
		currentFolderId,
		setCurrentFolder,
		isLoading,
		currentFolder,
		setItems,
		setIsLoading,
	} = useFileManager();

	const handleReindexFolder = useCallback(
		async (id: string) => {
			try {
				viewLogger.info("🔄 Reindexando carpeta:", id);
				setIsLoading(true);
				await reindexFolder(id);

				// Recargar las imágenes después de reindexar
				if (id) {
					const images = await getFolderImages(id);
					setItems(images);
				}
				viewLogger.info("✅ Carpeta reindexada:", id);
			} catch (error) {
				viewLogger.error("❌ Error reindexando carpeta:", error);
			} finally {
				setIsLoading(false);
			}
		},
		[setItems, setIsLoading]
	);

	const contentProps: FolderContentProps = {
		items,
		isLoading,
		toggleItemSelection,
		currentContainerId: currentFolderId ?? null,
		containerName: currentFolder?.name ?? null,
		setCurrentContainer: setCurrentFolder,
		reindexFolder: handleReindexFolder,
		emptyState: {
			icon: Folder,
			title: "Carpeta vacía",
			description: `No se encontraron imágenes en ${
				currentFolder?.name || "esta carpeta"
			}. Puedes agregar imágenes arrastrándolas aquí.`,
		},
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}

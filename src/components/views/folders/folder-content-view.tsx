"use client";

import { useFileManager } from "@/store/file-manager.store";
import { BaseContentView, ContentViewProvider } from "@/components/views/base";
import type { FolderContentProps } from "@/components/views/base";
import { Folder } from "lucide-react";
import { useCallback } from "react";
import { folderService } from "@/services/folder.service";

export function FolderContentView() {
	const {
		currentItems: items,
		toggleItemSelection,
		currentFolderId,
		setCurrentFolder,
		isLoading,
		currentFolder,
	} = useFileManager();

	const handleReindexFolder = useCallback(
		async (id: string) => {
			try {
				await folderService.reindexFolder(id);
				// Recargar la carpeta después de reindexar
				if (setCurrentFolder) {
					await setCurrentFolder(id);
				}
			} catch (error) {
				console.error("Error reindexando carpeta:", error);
			}
		},
		[setCurrentFolder]
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

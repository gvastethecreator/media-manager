"use client";

import { useCallback, useEffect, useRef } from "react";
import { useFileManager } from "@/store/file-manager.store";
import { useImageViewer } from "@/store/image-viewer.store";
import { FileGrid } from "@/components/features/file-grid/file-grid";
import { EmptyState } from "@/components/core/data-display/empty-state/empty-state";
import { FolderIcon } from "lucide-react";
import type { FileItem } from "@/types/file-item";
import BlurFade from "@/components/ui/blur-fade";
import { LoadingScreen } from "@/components/core/feedback";
import { logger } from "@/lib/logger";

const folderLogger = logger.withContext("FolderContentView");

export function FolderContentView() {
	const {
		currentItems: items,
		toggleItemSelection,
		currentFolderId,
		setCurrentFolder,
		isLoading,
		currentFolder,
	} = useFileManager();
	const { openViewer } = useImageViewer();
	const initialLoadRef = useRef(false);
	const currentFolderIdRef = useRef(currentFolderId);

	// Efecto principal para cargar la carpeta
	useEffect(() => {
		// Si no hay ID o es el mismo que ya procesamos, no hacer nada
		if (!currentFolderId || currentFolderId === currentFolderIdRef.current)
			return;

		let mounted = true;
		currentFolderIdRef.current = currentFolderId;

		folderLogger.info("🔄 Iniciando carga de carpeta:", {
			id: currentFolderId,
			currentFolder: currentFolder?.name,
			isInitialLoad: !initialLoadRef.current,
		});

		const loadFolder = async () => {
			try {
				await setCurrentFolder(currentFolderId);
				if (!mounted) return;

				initialLoadRef.current = true;

				folderLogger.info("✅ Carpeta cargada:", {
					id: currentFolderId,
					name: currentFolder?.name,
					itemCount: items?.length || 0,
				});
			} catch (error) {
				if (!mounted) return;
				folderLogger.error("❌ Error al cargar carpeta:", {
					id: currentFolderId,
					error: error instanceof Error ? error.message : "Error desconocido",
				});
			}
		};

		loadFolder();

		return () => {
			mounted = false;
		};
	}, [currentFolderId]); // Solo depender del ID de la carpeta

	// Reset cuando se desmonta el componente
	useEffect(() => {
		return () => {
			initialLoadRef.current = false;
			currentFolderIdRef.current = null;
		};
	}, []);

	const handleItemClick = useCallback(
		(item: FileItem) => {
			toggleItemSelection(item, false);
		},
		[toggleItemSelection]
	);

	const handleItemDoubleClick = useCallback(
		(item: FileItem) => {
			if (!items) return;

			if (item.type === "image" || item.mimeType?.startsWith("image/")) {
				const imageItems = items.filter(
					(i) => i.type === "image" || i.mimeType?.startsWith("image/")
				);
				const currentIndex = imageItems.findIndex((i) => i.id === item.id);
				openViewer(imageItems, currentIndex);
			}
		},
		[items, openViewer]
	);

	if (!initialLoadRef.current && isLoading) {
		return <LoadingScreen />;
	}

	if (!items || items.length === 0) {
		return (
			<EmptyState
				icon={FolderIcon}
				title="Carpeta vacía"
				description={`No se encontraron imágenes en ${
					currentFolder?.name || "esta carpeta"
				}`}
			/>
		);
	}

	return (
		<div className="h-full w-full flex overflow-hidden">
			<div className="h-full w-full overflow-auto">
				<BlurFade
					className="h-full w-full overflow-auto"
					delay={0.5}
					inView={true}
				>
					<FileGrid
						items={items}
						onItemClick={handleItemClick}
						onItemDoubleClick={handleItemDoubleClick}
					/>
				</BlurFade>
			</div>
		</div>
	);
}

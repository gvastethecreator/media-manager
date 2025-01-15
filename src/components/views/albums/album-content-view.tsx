"use client";

import { useEffect, useState, useCallback } from "react";
import { BaseContentView, ContentViewProvider } from "@/components/views/base";
import type { BaseContentProps } from "@/components/views/base";
import { Album } from "lucide-react";
import { useFileManager } from "@/store/file-manager.store";
import { FileItem } from "@/types/file-item";
import { logger } from "@/lib/logger";
import { getAlbumImages } from "@/app/actions/album.actions";
import { eventsService, type EventData } from "@/services/events.service";

const viewLogger = logger.withContext("AlbumContentView");

export function AlbumContentView() {
	const { currentAlbumId } = useFileManager();
	const [items, setItems] = useState<FileItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadAlbumImages = useCallback(async () => {
		if (!currentAlbumId) return;

		try {
			setIsLoading(true);
			viewLogger.info("🔄 Cargando imágenes del álbum...");
			const data = await getAlbumImages(currentAlbumId);
			setItems(data as unknown as FileItem[]);
			viewLogger.info("✅ Imágenes cargadas");
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Error desconocido";
			viewLogger.error("❌ Error cargando imágenes:", errorMessage);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [currentAlbumId]);

	useEffect(() => {
		// Cargar imágenes inicialmente
		loadAlbumImages();

		// Suscribirse a eventos relevantes
		const handleImagesModified = (data?: EventData) => {
			viewLogger.info("📢 Evento de modificación de imágenes recibido:", data);
			loadAlbumImages();
		};

		eventsService.on("images:modified", handleImagesModified);
		eventsService.on("albums:modified", handleImagesModified);

		return () => {
			eventsService.off("images:modified", handleImagesModified);
			eventsService.off("albums:modified", handleImagesModified);
		};
	}, [loadAlbumImages]);

	const handleItemSelection = useCallback((item: FileItem) => {
		viewLogger.info("🖱️ Item seleccionado:", item.name);
	}, []);

	const contentProps: BaseContentProps = {
		items,
		isLoading,
		error,
		toggleItemSelection: handleItemSelection,
		currentContainerId: currentAlbumId ?? null,
		emptyState: !currentAlbumId
			? {
					icon: Album,
					title: "No hay álbum seleccionado",
					description: "Selecciona un álbum para ver su contenido.",
			  }
			: {
					icon: Album,
					title: "Álbum sin imágenes",
					description: "Este álbum no tiene imágenes asociadas.",
			  },
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}

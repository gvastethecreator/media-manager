"use client";

import { useEffect, useState, useCallback } from "react";
import { BaseContentView, ContentViewProvider } from "@/components/views/base";
import type { BaseContentProps } from "@/components/views/base";
import { Box } from "lucide-react";
import { useFileManager } from "@/store/file-manager.store";
import { FileItem } from "@/types/file-item";
import { logger } from "@/lib/logger";
import { getObjectImages } from "@/app/actions/object.actions";
import { eventsService, EventType, type EventData } from "@/services/events.service";

const viewLogger = logger.withContext("ObjectContentView");

export function ObjectContentView() {
	const { currentObjectId } = useFileManager();
	const [items, setItems] = useState<FileItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadObjectImages = useCallback(async () => {
		if (!currentObjectId) return;

		try {
			setIsLoading(true);
			viewLogger.info("🔄 Cargando imágenes del objeto...");
			const data = await getObjectImages(currentObjectId);
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
	}, [currentObjectId]);

	useEffect(() => {
		// Cargar imágenes inicialmente
		loadObjectImages();

		// Suscribirse a eventos relevantes
		const handleImagesModified = (data?: EventData) => {
			viewLogger.info("📢 Evento de modificación de imágenes recibido:", data);
			loadObjectImages();
		};

		eventsService.on("images:modified" as EventType, handleImagesModified);
		eventsService.on("objects:modified" as EventType, handleImagesModified);

		return () => {
			eventsService.off("images:modified" as EventType, handleImagesModified);
			eventsService.off("objects:modified" as EventType, handleImagesModified);
		};
	}, [loadObjectImages]);

	const handleItemSelection = useCallback((item: FileItem) => {
		viewLogger.info("🖱️ Item seleccionado:", item.name);
	}, []);

	const contentProps: BaseContentProps = {
		items,
		isLoading,
		error,
		toggleItemSelection: handleItemSelection,
		currentContainerId: currentObjectId ?? null,
		emptyState: !currentObjectId
			? {
					icon: Box,
					title: "No hay objeto seleccionado",
					description: "Selecciona un objeto para ver su contenido.",
			  }
			: {
					icon: Box,
					title: "Objeto sin imágenes",
					description: "Este objeto no tiene imágenes asociadas.",
			  },
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}

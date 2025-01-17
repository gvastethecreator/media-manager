"use client";

import { useEffect, useState, useCallback } from "react";
import { BaseContentView, ContentViewProvider } from "@/components/views/base";
import type { BaseContentProps } from "@/components/views/base";
import { Users } from "lucide-react";
import { useFileManager } from "@/store/file-manager.store";
import { FileItem } from "@/types/file-item";
import { logger } from "@/lib/logger";
import { getCharacterImages } from "@/app/actions/character.actions";
import { eventsService, EventType, type EventData } from "@/services/events.service";

const viewLogger = logger.withContext("CharacterContentView");

export function CharacterContentView() {
	const { currentCharacterId } = useFileManager();
	const [items, setItems] = useState<FileItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadCharacterImages = useCallback(async () => {
		if (!currentCharacterId) return;

		try {
			setIsLoading(true);
			viewLogger.info("🔄 Cargando imágenes del personaje...");
			const data = await getCharacterImages(currentCharacterId);
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
	}, [currentCharacterId]);

	useEffect(() => {
		// Cargar imágenes inicialmente
		loadCharacterImages();

		// Suscribirse a eventos relevantes
		const handleImagesModified = (data?: EventData) => {
			viewLogger.info("📢 Evento de modificación de imágenes recibido:", data);
			loadCharacterImages();
		};

		eventsService.on("images:modified" as EventType, handleImagesModified);
		eventsService.on("characters:modified" as EventType, handleImagesModified);

		return () => {
			eventsService.off("images:modified" as EventType, handleImagesModified);
			eventsService.off("characters:modified" as EventType, handleImagesModified);
		};
	}, [loadCharacterImages]);

	const handleItemSelection = useCallback((item: FileItem) => {
		viewLogger.info("🖱️ Item seleccionado:", item.name);
	}, []);

	const contentProps: BaseContentProps = {
		items,
		isLoading,
		error,
		toggleItemSelection: handleItemSelection,
		currentContainerId: currentCharacterId ?? null,
		emptyState: !currentCharacterId
			? {
					icon: Users,
					title: "No hay personaje seleccionado",
					description: "Selecciona un personaje para ver su contenido.",
			  }
			: {
					icon: Users,
					title: "Personaje sin imágenes",
					description: "Este personaje no tiene imágenes asociadas.",
			  },
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}

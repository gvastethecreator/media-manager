"use client";

import { useFiles } from "@/context/file-context";
import { BaseContentView, ContentViewProvider } from "@/components/views/base";
import type { BaseContentProps } from "@/components/views/base";
import { ImageIcon } from "lucide-react";
import { useCallback, useEffect } from "react";
import { eventsService, type EventData } from "@/services/events.service";
import { logger } from "@/lib/logger";

const viewLogger = logger.withContext("AllImagesView");

export function AllImagesView() {
	const { currentItems: items, handleSelectItem, isLoading } = useFiles();

	useEffect(() => {
		const handleImagesModified = (data?: EventData) => {
			viewLogger.info("📢 Evento de modificación de imágenes recibido:", data);
			// La actualización de imágenes se maneja automáticamente a través del FileManager
		};

		eventsService.on("images:modified", handleImagesModified);

		return () => {
			eventsService.off("images:modified", handleImagesModified);
		};
	}, []);

	const contentProps: BaseContentProps = {
		items,
		isLoading,
		toggleItemSelection: handleSelectItem,
		emptyState: {
			icon: ImageIcon,
			title: "No hay imágenes",
			description:
				"No se encontraron imágenes en el sistema. Agrega imágenes desde el panel de configuración o arrastra y suelta archivos aquí.",
		},
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}

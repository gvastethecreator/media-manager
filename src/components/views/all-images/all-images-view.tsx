"use client";

import { useCallback, useEffect } from "react";
import { useFileManager } from "@/store/file-manager.store";
import { useImageViewer } from "@/store/image-viewer.store";
import { FileGrid } from "@/components/features/file-grid/file-grid";
import { EmptyState } from "@/components/core/data-display/empty-state/empty-state";
import { ImageIcon } from "lucide-react";
import type { FileItem } from "@/types/file-item";
import { LoadingScreen } from "@/components/core/feedback";
import BlurFade from "@/components/ui/blur-fade";
import { useFiles } from "@/context/file-context";
import { eventsService, type EventData } from "@/services/events.service";
import { logger } from "@/lib/logger";

const viewLogger = logger.withContext("AllImagesView");

export function AllImagesView() {
	const { currentItems: items, handleSelectItem, isLoading } = useFiles();
	const { openViewer } = useImageViewer();

	useEffect(() => {
		// Suscribirse a eventos relevantes
		const handleImagesModified = (data?: EventData) => {
			viewLogger.info("📢 Evento de modificación de imágenes recibido:", data);
			// La actualización de imágenes se maneja automáticamente a través del FileManager
		};

		eventsService.on("images:modified", handleImagesModified);

		return () => {
			eventsService.off("images:modified", handleImagesModified);
		};
	}, []);

	const handleItemClick = useCallback(
		(item: FileItem) => {
			viewLogger.info("🖱️ Click en item:", item.name);
			handleSelectItem(item);
		},
		[handleSelectItem]
	);

	const handleItemDoubleClick = useCallback(
		(item: FileItem) => {
			if (item.type === "image" || item.mimeType?.startsWith("image/")) {
				viewLogger.info("👀 Abriendo visor para:", item.name);
				const imageItems = (items || []).filter(
					(i) => i.type === "image" || i.mimeType?.startsWith("image/")
				);
				openViewer(
					imageItems,
					imageItems.findIndex((i) => i.id === item.id)
				);
			}
		},
		[openViewer, items]
	);

	if (isLoading) {
		return <LoadingScreen />;
	}

	if (!items || items.length === 0) {
		return (
			<EmptyState
				icon={ImageIcon}
				title="No hay imágenes"
				description="No se encontraron imágenes en el sistema. Agrega imágenes desde el panel de configuración o arrastra y suelta archivos aquí."
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

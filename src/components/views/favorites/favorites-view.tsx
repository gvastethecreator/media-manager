"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useFileManager } from "@/store/file-manager";
import { useImageViewer } from "@/store/image-viewer";
import { FileGrid } from "@/components/features/file-grid/file-grid";
import { EmptyState } from "@/components/core/data-display/empty-state/empty-state";
import { Star } from "lucide-react";
import type { FileItem } from "@/types/file-item";
import { LoadingScreen } from "@/components/core/feedback";
import BlurFade from "@/components/ui/blur-fade";
import { statsEventEmitter, STATS_EVENTS } from "@/services/stats.service";
import { eventsService, type EventData } from "@/services/events.service";
import { logger } from "@/lib/logger";

const viewLogger = logger.withContext("FavoritesView");

export function FavoritesView() {
	const {
		currentItems: items,
		toggleItemSelection,
		loadItems,
		isLoading,
	} = useFileManager();

	const { openViewer } = useImageViewer();

	const loadFavorites = useCallback(async () => {
		try {
			viewLogger.info("🔄 Cargando favoritos...");
			await loadItems("/api/images/favorites/all");
			viewLogger.info("✅ Favoritos cargados");
		} catch (error) {
			viewLogger.error("❌ Error cargando favoritos:", error);
		}
	}, [loadItems]);

	useEffect(() => {
		// Cargar favoritos inicialmente
		loadFavorites();

		// Suscribirse a cambios en favoritos
		const handleFavoriteChange = () => {
			viewLogger.info("📢 Evento de cambio en favoritos recibido");
			loadFavorites();
		};

		// Suscribirse a eventos de estadísticas y modificación
		statsEventEmitter.on(STATS_EVENTS.FAVORITE_CHANGE, handleFavoriteChange);
		eventsService.on("favorites:modified", handleFavoriteChange);

		return () => {
			statsEventEmitter.off(STATS_EVENTS.FAVORITE_CHANGE, handleFavoriteChange);
			eventsService.off("favorites:modified", handleFavoriteChange);
		};
	}, [loadFavorites]);

	const favoriteItems = useMemo(() => {
		const filtered = items.filter((item) => item.isFavorite);
		viewLogger.debug("🔍 Filtrando favoritos:", { total: filtered.length });
		return filtered;
	}, [items]);

	const handleItemClick = useCallback(
		(item: FileItem) => {
			viewLogger.info("🖱️ Click en item:", item.name);
			toggleItemSelection(item, false);
		},
		[toggleItemSelection]
	);

	const handleItemDoubleClick = useCallback(
		(item: FileItem) => {
			if (item.type === "image" || item.mimeType?.startsWith("image/")) {
				viewLogger.info("👀 Abriendo visor para:", item.name);
				const imageItems = favoriteItems.filter(
					(i) => i.type === "image" || i.mimeType?.startsWith("image/")
				);
				openViewer(
					imageItems,
					imageItems.findIndex((i) => i.id === item.id)
				);
			}
		},
		[openViewer, favoriteItems]
	);

	if (isLoading) {
		return <LoadingScreen />;
	}

	if (!favoriteItems || favoriteItems.length === 0) {
		return (
			<EmptyState
				icon={Star}
				title="No hay favoritos"
				description="No se encontraron imágenes favoritas. Marca tus imágenes favoritas haciendo clic en el ícono de estrella."
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
						items={favoriteItems}
						onItemClick={handleItemClick}
						onItemDoubleClick={handleItemDoubleClick}
					/>
				</BlurFade>
			</div>
		</div>
	);
}

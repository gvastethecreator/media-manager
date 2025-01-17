"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useFileManager } from "@/store/file-manager.store";
import { BaseContentView, ContentViewProvider } from "@/components/views/base";
import type { BaseContentProps } from "@/components/views/base";
import { Star } from "lucide-react";
import { statsEventEmitter, STATS_EVENTS } from "@/services/stats.service";
import { eventsService, EventType } from "@/services/events.service";
import { logger } from "@/lib/logger";
import { getFavorites } from "@/app/actions/favorite.actions";

const viewLogger = logger.withContext("FavoritesView");

export function FavoritesView() {
	const {
		currentItems: items,
		toggleItemSelection,
		setItems,
		isLoading,
		setIsLoading,
	} = useFileManager();

	const loadFavorites = useCallback(async () => {
		try {
			viewLogger.info("🔄 Cargando favoritos...");
			setIsLoading(true);
			const favorites = await getFavorites();
			setItems(favorites.map((f) => f.image));
			viewLogger.info("✅ Favoritos cargados");
		} catch (error) {
			viewLogger.error("❌ Error cargando favoritos:", error);
		} finally {
			setIsLoading(false);
		}
	}, [setItems, setIsLoading]);

	useEffect(() => {
		loadFavorites();

		const handleFavoriteChange = () => {
			viewLogger.info("📢 Evento de cambio en favoritos recibido");
			loadFavorites();
		};

		statsEventEmitter.on(STATS_EVENTS.FAVORITE_CHANGE, handleFavoriteChange);
		eventsService.on("favorites:modified" as EventType, handleFavoriteChange);

		return () => {
			statsEventEmitter.off(STATS_EVENTS.FAVORITE_CHANGE, handleFavoriteChange);
			eventsService.off("favorites:modified" as EventType, handleFavoriteChange);
		};
	}, [loadFavorites]);

	const favoriteItems = useMemo(() => {
		const filtered = items.filter((item) => item.isFavorite);
		viewLogger.debug("🔍 Filtrando favoritos:", { total: filtered.length });
		return filtered;
	}, [items]);

	const contentProps: BaseContentProps = {
		items: favoriteItems,
		isLoading,
		toggleItemSelection,
		emptyState: {
			icon: Star,
			title: "No hay favoritos",
			description:
				"No se encontraron imágenes favoritas. Marca tus imágenes favoritas haciendo clic en el ícono de estrella.",
		},
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}

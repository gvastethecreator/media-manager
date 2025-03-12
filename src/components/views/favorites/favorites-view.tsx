"use client";

import { getFavorites } from "@/app/actions/favorites/favorite.actions";
import { BaseContentView, ContentViewProvider } from "@/components/views/base";
import type { BaseContentProps } from "@/components/views/base";
import { clientEvents } from "@/lib/client/events.client";
import { logger } from "@/lib/logger/logger";
import { STATS_EVENTS, statsEventEmitter } from "@/services/stats.service";
import { useFileManager } from "@/store/file-manager.store";
import type { FileItem } from "@/types/file-item";
import { Star } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const viewLogger = logger.withContext("FavoritesView");

export function FavoritesView() {
	const {
		currentItems: items,
		toggleItemSelection,
		setItems,
		isLoading,
		setIsLoading,
	} = useFileManager();

	// Usar el hook de eventos optimistas del cliente
	const [optimisticItems, _addEvent] =
		clientEvents.useEvents<FileItem[]>(items);

	const loadFavorites = useCallback(async () => {
		try {
			viewLogger.info("🔄 Cargando favoritos...");
			setIsLoading(true);
			const favorites = await getFavorites();
			// Asegurarnos de que los objetos retornados por getFavorites sean compatibles con FileItem
			const adaptedFavorites: FileItem[] = favorites.map((f) => {
				// Convertir explícitamente a FileItem con campos requeridos
				const imageData = f.image as unknown as {
					id: string;
					hash: string;
					name: string;
					path: string;
					type: string;
					size: number;
					width: number;
					height: number;
					// otros campos necesarios
				};

				return {
					...(imageData as unknown as FileItem),
					isFavorite: true,
				};
			});
			setItems(adaptedFavorites);
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

		return () => {
			statsEventEmitter.off(STATS_EVENTS.FAVORITE_CHANGE, handleFavoriteChange);
		};
	}, [loadFavorites]);

	const favoriteItems = useMemo(() => {
		const filtered = optimisticItems.filter((item) => item.isFavorite);
		viewLogger.debug("🔍 Filtrando favoritos:", { total: filtered.length });
		return filtered;
	}, [optimisticItems]);

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

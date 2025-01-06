"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useFileManager } from "@/store/file-manager";
import { useImageViewer } from "@/store/image-viewer";
import { FileGrid } from "@/components/features/file-grid/file-grid";
import { EmptyState } from "@/components/core/data-display/empty-state/empty-state";
import { Star } from "lucide-react";
import type { FileItem } from "@/types/file-item";
import { LoadingScreen } from "@/components/core/feedback";

export function FavoritesView() {
	const {
		currentItems: items,
		toggleItemSelection,
		loadItems,
		isLoading,
	} = useFileManager();

	const { openViewer } = useImageViewer();

	// Cargar favoritos al montar el componente
	useEffect(() => {
		loadItems("/api/images/favorites/all");
	}, [loadItems]);

	// Filtrar solo los items favoritos (doble verificación)
	const favoriteItems = useMemo(() => {
		return items.filter((item) => item.isFavorite);
	}, [items]);

	const handleItemClick = useCallback(
		(item: FileItem) => {
			toggleItemSelection(item, false);
		},
		[toggleItemSelection]
	);

	const handleItemDoubleClick = useCallback(
		(item: FileItem) => {
			if (item.type === "image" || item.mimeType?.startsWith("image/")) {
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
				description="No se encontraron imágenes favoritas"
			/>
		);
	}

	return (
		<div className="h-full w-full flex overflow-hidden">
			<div className="h-full w-full overflow-auto">
				<FileGrid
					items={favoriteItems}
					onItemClick={handleItemClick}
					onItemDoubleClick={handleItemDoubleClick}
				/>
			</div>
		</div>
	);
}

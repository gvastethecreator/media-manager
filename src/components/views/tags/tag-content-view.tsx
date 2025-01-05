"use client";

import { useCallback, useEffect } from "react";
import { useFileManager } from "@/store/file-manager";
import { useImageViewer } from "@/store/image-viewer";
import { FileGrid } from "@/components/features/file-grid/file-grid";
import { EmptyState } from "@/components/core/data-display/empty-state/empty-state";
import { TagIcon, Loader2 } from "lucide-react";
import type { FileItem } from "@/types/file-item";

export function TagContentView() {
	const {
		currentItems: items,
		selectedItem,
		selectedItems,
		toggleItemSelection,
		currentTagId,
		setCurrentTag,
		isLoading,
		isProcessingThumbnails,
	} = useFileManager();
	const { openViewer } = useImageViewer();

	useEffect(() => {
		if (currentTagId) {
			setCurrentTag(currentTagId);
		}
	}, [currentTagId, setCurrentTag]);

	const handleItemClick = useCallback(
		(item: FileItem) => {
			toggleItemSelection(item, false);
		},
		[toggleItemSelection]
	);

	const handleItemDoubleClick = useCallback(
		(item: FileItem) => {
			if (item.type === "image" || item.mimeType?.startsWith("image/")) {
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
		return (
			<div className="h-full w-full flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!items || items.length === 0) {
		return (
			<EmptyState
				icon={TagIcon}
				title="No hay imágenes con esta etiqueta"
				description="No se encontraron imágenes con esta etiqueta"
			/>
		);
	}

	return (
		<div className="h-full w-full flex overflow-hidden">
			<div className="h-full w-full overflow-auto">
				<FileGrid
					items={items}
					onItemClick={handleItemClick}
					onItemDoubleClick={handleItemDoubleClick}
				/>
			</div>
		</div>
	);
}

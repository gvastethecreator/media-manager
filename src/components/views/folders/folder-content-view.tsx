"use client";

import { useCallback, useEffect, useState } from "react";
import { useFilesStore } from "@/store/files";
import { useImageViewer } from "@/store/image-viewer";
import { FileGrid } from "@/components/features/file-grid/file-grid";
import { EmptyState } from "@/components/core/data-display/empty-state/empty-state";
import { FolderIcon, Loader2 } from "lucide-react";
import type { FileItem } from "@/types/file-item";
import { thumbnailService } from "@/services/thumbnail.service";

export function FolderContentView() {
	const {
		currentItems: items,
		selectedItem,
		selectedIds,
		selectItem,
		currentFolderId,
		handleSelectFolder,
		deselectItem,
		isLoading: storeLoading,
		loadMoreItems,
	} = useFilesStore();
	const { openViewer } = useImageViewer();
	const [isProcessingThumbnails, setIsProcessingThumbnails] = useState(false);

	useEffect(() => {
		if (currentFolderId) {
			handleSelectFolder(currentFolderId);
		}
	}, [currentFolderId, handleSelectFolder]);

	// Pre-generar thumbnails para los items visibles
	useEffect(() => {
		if (!items?.length || isProcessingThumbnails) return;

		const imageIds = items
			.filter(
				(item) => item.type === "image" || item.mimeType?.startsWith("image/")
			)
			.filter((item) => !item.thumbnail) // Solo procesar los que no tienen thumbnail
			.map((item) => item.id);

		if (imageIds.length > 0) {
			setIsProcessingThumbnails(true);
			thumbnailService
				.queueThumbnailGeneration(imageIds)
				.finally(() => setIsProcessingThumbnails(false));
		}
	}, [items, isProcessingThumbnails]);

	const handleItemClick = useCallback(
		(item: FileItem) => {
			if (selectedIds.includes(item.id)) {
				deselectItem(item.id);
			} else {
				selectItem(item);
			}
		},
		[selectItem, deselectItem, selectedIds]
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

	if (storeLoading) {
		return (
			<div className="h-full w-full flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!items || items.length === 0) {
		return (
			<EmptyState
				icon={FolderIcon}
				title="Carpeta vacía"
				description="Esta carpeta no contiene archivos"
			/>
		);
	}

	return (
		<div className="h-full w-full flex overflow-hidden">
			<div className="h-full w-full overflow-auto">
				<FileGrid
					items={items}
					selectedItem={selectedItem}
					selectedIds={selectedIds}
					onItemClick={handleItemClick}
					onItemDoubleClick={handleItemDoubleClick}
					loadMoreItems={loadMoreItems}
				/>
			</div>
		</div>
	);
}

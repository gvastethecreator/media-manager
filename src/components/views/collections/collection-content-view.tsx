"use client";

import { useCallback, useEffect } from "react";
import { useFileManager } from "@/store/file-manager";
import { useImageViewer } from "@/store/image-viewer";
import { FileGrid } from "@/components/features/file-grid/file-grid";
import { EmptyState } from "@/components/core/data-display/empty-state/empty-state";
import { LibraryBig } from "lucide-react";
import type { FileItem } from "@/types/file-item";
import { LoadingScreen } from "@/components/core/feedback";
import BlurFade from "@/components/ui/blur-fade";

export function CollectionContentView() {
	const {
		currentItems: items,
		handleSelectItem,
		currentCollectionId,
		setCurrentCollection,
		isLoading,
	} = useFileManager();
	const { openViewer } = useImageViewer();

	useEffect(() => {
		if (currentCollectionId) {
			setCurrentCollection(currentCollectionId);
		}
	}, [currentCollectionId, setCurrentCollection]);

	const handleItemClick = useCallback(
		(item: FileItem) => {
			handleSelectItem(item);
		},
		[handleSelectItem]
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
		return <LoadingScreen />;
	}

	if (!items || items.length === 0) {
		return (
			<EmptyState
				icon={LibraryBig}
				title="Colección vacía"
				description="No se encontraron imágenes en esta colección"
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

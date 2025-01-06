"use client";

import { useCallback, useEffect } from "react";
import { useFileManager } from "@/store/file-manager";
import { useImageViewer } from "@/store/image-viewer";
import { FileGrid } from "@/components/features/file-grid/file-grid";
import { EmptyState } from "@/components/core/data-display/empty-state/empty-state";
import { FolderIcon} from "lucide-react";
import type { FileItem } from "@/types/file-item";
import BlurFade from "@/components/ui/blur-fade";
import { LoadingScreen } from "@/components/core/feedback";

export function FolderContentView() {
	const {
		currentItems: items,
		toggleItemSelection,
		currentFolderId,
		setCurrentFolder,
		isLoading,
	} = useFileManager();
	const { openViewer } = useImageViewer();

	useEffect(() => {
		if (currentFolderId) {
			setCurrentFolder(currentFolderId);
		}
	}, [currentFolderId, setCurrentFolder]);

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
		return <LoadingScreen />;
	}

	if (!items || items.length === 0) {
		return (
			<EmptyState
				icon={FolderIcon}
				title="Carpeta vacía"
				description="No se encontraron imágenes en esta carpeta"
			/>
		);
	}

	return (
		<div className="h-full w-full flex overflow-hidden">
			<div className="h-full w-full overflow-auto">
				<BlurFade className="h-full w-full overflow-auto" delay={0.5} inView={true}>
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

"use client";

import { BaseContentView, ContentViewProvider } from "@/components/views/base";
import type { BaseContentProps } from "@/components/views/base";
import { clientEvents } from "@/lib/client/events.client";
import { useFiles } from "@/lib/contexts";
import { logger } from "@/lib/logger/logger";
import type { FileItem as FileItemType } from "@/types/file-item";
import { ImageIcon } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";

const _viewLogger = logger.withContext("AllImagesView");

export function AllImagesView() {
	const { currentItems: items, handleSelectItem, isLoading } = useFiles();

	// Adaptar items del contexto al tipo FileItem requerido por BaseContentView
	const adaptedItems = useMemo<FileItemType[]>(() => {
		return items.map((item) => ({
			id: item.id,
			hash: item.id, // Usamos el ID como hash si no existe
			name: item.name,
			path: item.path,
			type: "image",
			size: item.size,
			width: item.metadata?.width || 0,
			height: item.metadata?.height || 0,
			metadata: item.metadata ? JSON.stringify(item.metadata) : null,
			thumbnail: item.thumbnail || null,
			thumbnailSize: null,
			thumbnailWidth: null,
			thumbnailHeight: null,
			thumbnailError: null,
			thumbnailErrorAt: null,
			thumbnailOptimizedAt: null,
			isPublic: false,
			isFavorite: item.isFavorite || item.favorite || false,
			folderId: "",
			createdAt: new Date(),
			updatedAt: new Date(),
			collections: (item.collections || []).map((c) => ({ id: c, name: c })),
			tags: (item.tags || []).map((t) => ({
				id: t,
				name: t,
				color: "#cccccc",
			})),
			albums: [],
			characters: (item.characters || []).map((c) => ({ id: c, name: c })),
			places: (item.places || []).map((p) => ({ id: p, name: p })),
			worldItems: (item.worldItems || []).map((w) => ({ id: w, name: w })),
			concepts: [],
			prompts: [],
			notes: [],
		}));
	}, [items]);

	// Adaptamos el manejador de selección
	const adaptedToggleItemSelection = useCallback(
		(fileItem: FileItemType, _isMultiSelect = false) => {
			// Encontramos el item original por ID
			const originalItem = items.find((item) => item.id === fileItem.id);
			if (originalItem) {
				handleSelectItem(originalItem);
			}
		},
		[items, handleSelectItem]
	);

	// Usar el hook de eventos optimistas del cliente con el tipo adaptado
	const [optimisticItems, _addEvent] =
		clientEvents.useEvents<FileItemType[]>(adaptedItems);

	const contentProps: BaseContentProps = {
		items: optimisticItems,
		isLoading,
		toggleItemSelection: adaptedToggleItemSelection,
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

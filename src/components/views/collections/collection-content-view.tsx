"use client";

import { useCollectionsStore } from "@/store/collections.store";
import { BaseContentView, ContentViewProvider } from "@/components/views/base";
import type { CollectionContentProps } from "@/components/views/base";
import { Library } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { FileItem } from "@/types/file-item";
import { collectionService } from "@/services/collection.service";

export function CollectionContentView() {
	const {
		loading: isLoading,
		currentCollection,
		addImageToCollection,
	} = useCollectionsStore();

	const [collectionImages, setCollectionImages] = useState<FileItem[]>([]);

	// Cargar imágenes cuando cambia la colección
	useEffect(() => {
		if (!currentCollection?.id) {
			setCollectionImages([]);
			return;
		}

		const loadImages = async () => {
			try {
				const images = await collectionService.getCollectionImages(
					currentCollection.id
				);
				setCollectionImages(images);
			} catch (error) {
				console.error("Error loading collection images:", error);
			}
		};

		loadImages();
	}, [currentCollection?.id]);

	const handleToggleItemSelection = useCallback(
		(item: FileItem, isMultiSelect: boolean) => {
			const store = useCollectionsStore.getState();
			store.toggleItemSelection(
				{
					id: item.id,
					name: item.name,
					emoji: "📷",
					description: null,
					color: "#3b82f6",
					shortcut: null,
					sortBy: "name",
					filters: "[]",
					createdAt: item.createdAt,
					updatedAt: item.updatedAt,
				},
				isMultiSelect
			);
		},
		[]
	);

	const contentProps: CollectionContentProps = {
		items: collectionImages,
		isLoading,
		toggleItemSelection: handleToggleItemSelection,
		currentContainerId: currentCollection?.id ?? null,
		containerName: currentCollection?.name ?? null,
		setCurrentContainer: async (id: string) => {
			const store = useCollectionsStore.getState();
			await store.loadCollectionContent(id);
		},
		addImagesToCollection: async (imageIds: string[]) => {
			if (!currentCollection?.id) return;

			for (const imageId of imageIds) {
				await addImageToCollection(currentCollection.id, imageId);
				// Recargar imágenes después de agregar
				const images = await collectionService.getCollectionImages(
					currentCollection.id
				);
				setCollectionImages(images);
			}
		},
		emptyState: {
			icon: Library,
			title: "Colección vacía",
			description: `No se encontraron imágenes en ${
				currentCollection?.name || "esta colección"
			}`,
		},
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}

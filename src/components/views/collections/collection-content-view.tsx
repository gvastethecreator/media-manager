"use client";

import {
	getCollectionImages,
	removeImageFromCollection,
} from "@/app/actions/collection.actions";
import { BaseContentView, ContentViewProvider } from "@/components/views/base";
import type { CollectionContentProps } from "@/components/views/base/types";
import { useCollectionsStore } from "@/store/entities/collections.store";
import type { FileItem } from "@/types/file-item";
import type { Collection } from "@prisma/client";
import { Library } from "lucide-react";
import { useEffect, useState } from "react";

export function CollectionContentView() {
	const {
		selectedItem: currentCollection,
		addImageToCollection,
		selectItem,
		isLoading,
	} = useCollectionsStore();

	const [collectionImages, setCollectionImages] = useState<FileItem[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!currentCollection?.id) {
			setCollectionImages([]);
			return;
		}

		const loadImages = async () => {
			try {
				const images = await getCollectionImages(currentCollection.id);
				setCollectionImages(images);
				setError(null);
			} catch (error) {
				console.error("Error loading collection images:", error);
				setError("Error al cargar las imágenes de la colección");
			}
		};

		loadImages();
	}, [currentCollection?.id]);

	const handleToggleItemSelection = async (item: FileItem) => {
		if (!currentCollection) {
			return;
		}

		const isSelected = collectionImages.some((img) => img.id === item.id);

		if (isSelected) {
			await removeImageFromCollection(currentCollection.id, item.id);
		} else {
			await addImageToCollection(currentCollection.id, item.id);
		}

		// Recargar imágenes después de la operación
		const updatedImages = await getCollectionImages(currentCollection.id);
		setCollectionImages(updatedImages);
	};

	const _setCurrentContainer = (collection: Collection) => {
		selectItem(collection);
	};

	const contentProps: CollectionContentProps = {
		items: collectionImages,
		isLoading,
		error,
		toggleItemSelection: handleToggleItemSelection,
		currentContainerId: currentCollection?.id ?? null,
		containerName: currentCollection?.name ?? null,
		setCurrentContainer: async (id: string) => {
			const collection = { id, name: "" }; // Mínimo requerido para selección
			selectItem(collection as Collection);
		},
		emptyState: {
			icon: Library,
			title: "Colección vacía",
			description: `No se encontraron imágenes en ${currentCollection?.name || "esta colección"}`,
		},
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}

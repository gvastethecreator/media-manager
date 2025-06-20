'use client';

import { Library } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
	addImageToCollection,
	getCollectionImages,
	removeImageFromCollection,
} from '@/app/actions/collections/collection.actions';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import type { CollectionContentProps } from '@/components/views/base/types';
import { clientLogger } from '@/lib/logger/client-logger';
import { useCollectionStore } from '@/store/entities/collection';
import type { FileItem } from '@/types/files';

const logger = clientLogger.withContext('CollectionContentView');

export function CollectionContentView() {
	const { selectedCollectionId, getSelectedCollection, selectCollection, isLoading } = useCollectionStore();

	const currentCollection = getSelectedCollection();

	const [collectionImages, setCollectionImages] = useState<FileItem[]>([]);
	const [loadingImages, setLoadingImages] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!selectedCollectionId) {
			setCollectionImages([]);
			return;
		}

		const loadImages = async () => {
			try {
				setLoadingImages(true);
				logger.info(`🔄 Cargando imágenes para colección: ${selectedCollectionId}`);
				const images = await getCollectionImages(selectedCollectionId);
				setCollectionImages(images as unknown as FileItem[]);
				setError(null);
				logger.info(`✅ ${images.length} imágenes cargadas para colección`);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
				logger.error('❌ Error cargando imágenes de colección:', error);
				setError(errorMessage);
				setCollectionImages([]);
			} finally {
				setLoadingImages(false);
			}
		};

		loadImages();
	}, [selectedCollectionId]);

	const handleToggleItemSelection = useCallback(
		async (item: FileItem) => {
			if (!selectedCollectionId) {
				logger.warn('⚠️ No hay colección seleccionada para modificar');
				return;
			}

			const isSelected = collectionImages.some((img) => img.id === item.id);
			logger.info(
				`🔄 ${isSelected ? 'Eliminando' : 'Añadiendo'} imagen ${item.id} ${isSelected ? 'de' : 'a'} colección ${selectedCollectionId}`
			);

			try {
				if (isSelected) {
					await removeImageFromCollection(selectedCollectionId, item.id);
				} else {
					await addImageToCollection(selectedCollectionId, item.id);
				}

				// Recargar imágenes después de la operación
				const updatedImages = await getCollectionImages(selectedCollectionId);
				setCollectionImages(updatedImages as unknown as FileItem[]);
				logger.info('✅ Colección actualizada correctamente');
			} catch (error) {
				logger.error('❌ Error al modificar colección:', error);
				setError('Error al modificar la colección');
			}
		},
		[selectedCollectionId, collectionImages]
	);

	const contentProps: CollectionContentProps = {
		items: collectionImages,
		isLoading: isLoading || loadingImages,
		error,
		toggleItemSelection: handleToggleItemSelection,
		currentContainerId: selectedCollectionId,
		containerName: currentCollection?.name ?? null,
		setCurrentContainer: useCallback(
			(id: string) => {
				logger.info(`🔄 Cambiando a colección: ${id}`);
				selectCollection(id);
			},
			[selectCollection]
		),
		emptyState: {
			icon: Library,
			title: 'Colección vacía',
			description: currentCollection
				? `No se encontraron imágenes en ${currentCollection.name}`
				: 'No hay colección seleccionada',
		},
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}

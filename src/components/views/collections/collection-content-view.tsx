import { Library } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import type { CollectionContentProps } from '@/components/views/base/types';
import { useCollectionImages, useRemoveImageFromCollection } from '@/lib/api/collections';
import { clientLogger } from '@/lib/logger/client-logger';
import { useCollectionStore } from '@/store/entities/collection';
import type { EntityWithStats } from '@/types/common/entity-with-stats';

const logger = clientLogger.withContext('CollectionContentView');

export function CollectionContentView() {
	const { selectedCollectionId, getSelectedCollection, addImageToCollection, selectCollection, isLoading } =
		useCollectionStore();

	const currentCollection = getSelectedCollection();

	const [collectionImages, setCollectionImages] = useState<EntityWithStats[]>([]);
	const [loadingImages, setLoadingImages] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const {
		data: collectionImagesData,
		isLoading: isLoadingImages,
		error: collectionError,
		refetch: refetchCollectionImages,
	} = useCollectionImages(selectedCollectionId);

	const removeImageMutation = useRemoveImageFromCollection();

	useEffect(() => {
		if (!selectedCollectionId) {
			setCollectionImages([]);
			return;
		}

		const loadImages = async () => {
			try {
				setLoadingImages(true);
				logger.info(`🔄 Cargando imágenes para colección: ${selectedCollectionId}`);
				if (collectionImagesData) {
					setCollectionImages(collectionImagesData as EntityWithStats[]);
				}
				setError(null);
				logger.info(`✅ ${collectionImagesData?.length || 0} imágenes cargadas para colección`);
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
	}, [selectedCollectionId, collectionImagesData]);

	const handleToggleItemSelection = useCallback(
		async (item: EntityWithStats) => {
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
					await removeImageMutation.mutateAsync({ collectionId: selectedCollectionId, imageId: item.id });
				} else {
					await addImageToCollection(selectedCollectionId, item.id);
				}

				// Recargar imágenes después de la operación
				refetchCollectionImages();
				logger.info('✅ Colección actualizada correctamente');
			} catch (error) {
				logger.error('❌ Error al modificar colección:', error);
				setError('Error al modificar la colección');
			}
		},
		[selectedCollectionId, collectionImages, addImageToCollection, removeImageMutation, refetchCollectionImages]
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

	if (isLoading || isLoadingImages) {
		return <div className="flex items-center justify-center p-8">Cargando imágenes...</div>;
	}

	if (error || collectionError) {
		return (
			<div className="flex items-center justify-center p-8 text-red-500">
				Error: {error || collectionError?.message}
			</div>
		);
	}

	if (!collectionImages || collectionImages.length === 0) {
		return <div className="flex items-center justify-center p-8">No se encontraron imágenes</div>;
	}

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}

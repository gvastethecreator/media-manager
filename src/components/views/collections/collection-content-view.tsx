import { Library } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { FileBrowser } from '@/components/features/file-browser-new/file-browser';
import { type BrowserItem, toBrowserItem } from '@/components/features/file-browser-new/types/item.types';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { useCollection, useCollectionImages } from '@/lib/api/collections';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useCollectionStore } from '@/store/entities/collection';
import type { AnyEntityWithStats } from '@/types/entities';

const logger = clientLogger.withContext('CollectionContentView');

export function CollectionContentView() {
	const { id } = useParams<{ id: string }>();
	const { selectedCollectionId, getSelectedCollection, getCollectionById, selectCollection, isLoading } =
		useCollectionStore();
	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();
	const effectiveCollectionId = id || selectedCollectionId;
	const { data: collectionFromRoute, isLoading: isLoadingCollection } = useCollection(id || '');

	const currentCollection = effectiveCollectionId
		? ((id ? collectionFromRoute : undefined) ?? getCollectionById(effectiveCollectionId) ?? getSelectedCollection())
		: getSelectedCollection();

	useEffect(() => {
		if (id && id !== selectedCollectionId) {
			selectCollection(id);
		}
	}, [id, selectCollection, selectedCollectionId]);

	useEffect(() => {
		if (id && collectionFromRoute && id !== selectedCollectionId) {
			selectCollection(id);
		}
	}, [collectionFromRoute, id, selectCollection, selectedCollectionId]);

	const { data: images = [], isLoading: isLoadingImages, error } = useCollectionImages(effectiveCollectionId || '');
	const browserItems = useMemo(
		() => images.map((img) => toBrowserItem(img as unknown as Record<string, unknown>)),
		[images]
	);

	const handleItemSelect = useCallback(
		(item: BrowserItem) => {
			const entity = item.raw as unknown as AnyEntityWithStats | undefined;
			if (!entity) return;
			setSelectedItems([entity]);
			setDetailsPanelVisible(true);
		},
		[setSelectedItems, setDetailsPanelVisible]
	);

	const headerTitle = useMemo(
		() =>
			currentCollection?.name ? `Imágenes de la colección: ${currentCollection.name}` : 'Selecciona una colección',
		[currentCollection?.name]
	);

	if (!effectiveCollectionId) {
		return (
			<BaseContentView>
				<div className="flex h-full items-center justify-center">
					<EmptyState
						description="Selecciona una colección para ver sus imágenes relacionadas"
						icon={Library}
						title="Sin colección seleccionada"
					/>
				</div>
			</BaseContentView>
		);
	}

	if (error) {
		return (
			<BaseContentView title={headerTitle}>
				<div className="flex h-full items-center justify-center text-destructive">Error: {error.message}</div>
			</BaseContentView>
		);
	}

	if ((isLoading || isLoadingCollection || isLoadingImages) && images.length === 0) {
		return (
			<BaseContentView title={headerTitle}>
				<LoadingScreen />
			</BaseContentView>
		);
	}

	return (
		<BaseContentView description={images.length ? `${images.length} imágenes` : undefined} title={headerTitle}>
			<FileBrowser className="h-full" items={browserItems} onItemClick={handleItemSelect} />
		</BaseContentView>
	);
}

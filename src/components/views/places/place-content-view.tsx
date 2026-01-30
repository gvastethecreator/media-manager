import { MapPin } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { FileBrowser } from '@/components/features/file-browser-new/file-browser';
import { type BrowserItem, toBrowserItem } from '@/components/features/file-browser-new/types/item.types';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { usePlaceImages } from '@/lib/api/places';
import { useDetailsPanel } from '@/store/details-panel.store';
import { usePlaceStore } from '@/store/entities/place';
import type { AnyEntityWithStats } from '@/types/entities';

export const PlaceContentView = memo(function PlaceContentViewInner() {
	const selectedPlaceId = usePlaceStore((state) => state.selectedPlaceId);
	const selectedPlace = usePlaceStore((state) => (selectedPlaceId ? state.getPlaceById(selectedPlaceId) : null));

	const { data: images = [], isLoading, error } = usePlaceImages(selectedPlaceId || '');
	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();
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

	if (!selectedPlaceId) {
		return (
			<BaseContentView>
				<div className="flex h-full items-center justify-center">
					<EmptyState
						description="Selecciona un lugar para ver su contenido"
						icon={MapPin}
						title="Sin lugar seleccionado"
					/>
				</div>
			</BaseContentView>
		);
	}

	if (error) {
		return (
			<BaseContentView>
				<div className="flex h-full items-center justify-center text-destructive">Error: {error.message}</div>
			</BaseContentView>
		);
	}

	if (isLoading && images.length === 0) {
		return (
			<BaseContentView description={undefined} title={selectedPlace?.name ?? 'Lugar'}>
				<LoadingScreen />
			</BaseContentView>
		);
	}

	return (
		<BaseContentView
			description={selectedPlace?._count?.images ? `${selectedPlace._count.images} imágenes` : undefined}
			title={selectedPlace?.name ?? 'Lugar'}
		>
			<FileBrowser className="h-full" items={browserItems} onItemClick={handleItemSelect} />
		</BaseContentView>
	);
});

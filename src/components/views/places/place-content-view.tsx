import { MapPin } from 'lucide-react';
import { memo, useCallback } from 'react';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
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

	const handleItemSelect = useCallback(
		(item: AnyEntityWithStats) => {
			setSelectedItems([item]);
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
				<div className="flex h-full items-center justify-center text-red-500">Error: {error.message}</div>
			</BaseContentView>
		);
	}

	return (
		<BaseContentView
			description={selectedPlace?._count?.images ? `${selectedPlace._count.images} imágenes` : undefined}
			title={selectedPlace?.name ?? 'Lugar'}
		>
			<FileBrowser
				className="h-full"
				isLoading={isLoading}
				items={images as unknown as AnyEntityWithStats[]}
				onItemClick={handleItemSelect}
			/>
		</BaseContentView>
	);
});

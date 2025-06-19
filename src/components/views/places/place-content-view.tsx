'use client';

import { MapPin } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getPlaceImages } from '@/app/actions/places/place.actions';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { usePlaceStore } from '@/store/entities/place';
import type { FileItem } from '@/types/files';
import { BaseContentView } from '../base/base-content-view';
import { ContentViewProvider } from '../base/content-view-provider';

export function PlaceContentView() {
	const selectedPlaceId = usePlaceStore((state) => state.selectedPlaceId);
	const selectedPlace = usePlaceStore((state) => (selectedPlaceId ? state.getPlaceById(selectedPlaceId) : null));

	const [items, setItems] = useState<FileItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadPlaceImages = useCallback(async () => {
		if (!selectedPlaceId) {
			setItems([]);
			return;
		}

		try {
			setIsLoading(true);
			const images = await getPlaceImages(selectedPlaceId);
			setItems(images as unknown as FileItem[]);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error desconocido');
		} finally {
			setIsLoading(false);
		}
	}, [selectedPlaceId]);

	useEffect(() => {
		loadPlaceImages();
	}, [loadPlaceImages]);

	const handleItemSelection = useCallback((item: FileItem) => {
		console.log('Item seleccionado:', item.name);
	}, []);

	if (!selectedPlaceId) {
		return (
			<EmptyState
				icon={MapPin}
				title="No hay lugar seleccionado"
				description="Selecciona un lugar para ver su contenido"
			/>
		);
	}

	return (
		<ContentViewProvider
			items={items}
			isLoading={isLoading}
			error={error}
			toggleItemSelection={handleItemSelection}
			currentContainerId={selectedPlaceId}
			containerName={selectedPlace?.name ?? 'lugar'}
			emptyState={{
				icon: MapPin,
				title: 'No hay imágenes en este lugar',
				description: 'Este lugar no tiene imágenes asociadas',
			}}
			onRefresh={loadPlaceImages}
		>
			<BaseContentView />
		</ContentViewProvider>
	);
}

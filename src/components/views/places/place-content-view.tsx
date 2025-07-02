import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { usePlaceImages } from '@/lib/api/places';
import { usePlaceStore } from '@/store/entities/place';
import type { FileItem } from '@/types/files';
import { MapPin } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { BaseContentView } from '../base/base-content-view';
import { ContentViewProvider } from '../base/content-view-provider';

export function PlaceContentView() {
	const selectedPlaceId = usePlaceStore((state) => state.selectedPlaceId);
	const selectedPlace = usePlaceStore((state) => (selectedPlaceId ? state.getPlaceById(selectedPlaceId) : null));

	const [items, setItems] = useState<FileItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentPlaceId, setCurrentPlaceId] = useState(selectedPlaceId);

	const { data: placeImages, isLoading: isLoadingImages, error: placeError } = usePlaceImages(currentPlaceId);

	const loadPlaceImages = useCallback(async () => {
		if (!currentPlaceId) return;

		try {
			setError(null);
			setIsLoading(true);
			viewLogger.info('🔄 Cargando imágenes del lugar...');
			if (placeImages) {
				setItems(placeImages as unknown as FileItem[]);
			}
			viewLogger.info('✅ Imágenes cargadas');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			setError(errorMessage);
			viewLogger.error('❌ Error cargando imágenes del lugar:', errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [currentPlaceId, placeImages]);

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

	if (isLoading || isLoadingImages) {
		return <div className="flex items-center justify-center p-8">Cargando imágenes...</div>;
	}

	if (error || placeError) {
		return (
			<div className="flex items-center justify-center p-8 text-red-500">Error: {error || placeError?.message}</div>
		);
	}

	if (!items || items.length === 0) {
		return <div className="flex items-center justify-center p-8">No se encontraron imágenes</div>;
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

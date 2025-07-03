import { MapPin } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { usePlaceImages } from '@/lib/api/places';
import { clientLogger } from '@/lib/logger/client-logger';
import { usePlaceStore } from '@/store/entities/place';
import type { EntityWithStats } from '@/types/common/entity-with-stats';
import { BaseContentView } from '../base/base-content-view';
import { ContentViewProvider } from '../base/content-view-provider';

const viewLogger = clientLogger.withContext('PlaceContentView');

export const PlaceContentView = memo(function PlaceContentView() {
	const selectedPlaceId = usePlaceStore((state) => state.selectedPlaceId);
	const selectedPlace = usePlaceStore((state) => (selectedPlaceId ? state.getPlaceById(selectedPlaceId) : null));

	const [items, setItems] = useState<EntityWithStats[]>([]);
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
				setItems(placeImages as EntityWithStats[]);
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

	const handleItemSelection = useCallback((item: EntityWithStats) => {
		console.log('Item seleccionado:', item.name);
	}, []);

	const emptyStateConfig = useMemo(() => ({
		icon: MapPin,
		title: 'No hay imágenes en este lugar',
		description: 'Este lugar no tiene imágenes asociadas',
	}), []);

	const noSelectionEmptyState = useMemo(() => (
		<EmptyState
			icon={MapPin}
			title="No hay lugar seleccionado"
			description="Selecciona un lugar para ver su contenido"
		/>
	), []);

	if (!selectedPlaceId) {
		return noSelectionEmptyState;
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
			emptyState={emptyStateConfig}
			onRefresh={loadPlaceImages}
		>
			<BaseContentView />
		</ContentViewProvider>
	);
});

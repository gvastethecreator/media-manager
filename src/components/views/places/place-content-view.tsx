import { MapPin } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { usePlaceImages } from '@/lib/api/places';
import { clientLogger } from '@/lib/logger/client-logger';
import { usePlaceStore } from '@/store/entities/place';
import type { EntityWithStats } from '@/types/entities/entity.types';
import { BaseContentView } from '../base/base-content-view';
import { ContentViewProvider } from '../base/content-view-provider';

const viewLogger = clientLogger.withContext('PlaceContentView');

export const PlaceContentView = memo(function PlaceContentViewInner() {
	const selectedPlaceId = usePlaceStore((state) => state.selectedPlaceId);
	const selectedPlace = usePlaceStore((state) => (selectedPlaceId ? state.getPlaceById(selectedPlaceId) : null));

	const [items, setItems] = useState<EntityWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentPlaceId, setCurrentPlaceId] = useState(selectedPlaceId);

	const { data: placeImages, isLoading: isLoadingImages, error: placeError } = usePlaceImages(currentPlaceId || '');

	const loadPlaceImages = useCallback((): Promise<void> => {
		if (!currentPlaceId) {
			return Promise.resolve();
		}

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

		return Promise.resolve();
	}, [currentPlaceId, placeImages]);

	useEffect(() => {
		loadPlaceImages();
	}, [loadPlaceImages]);

	const handleItemSelection = useCallback((item: EntityWithStats) => {
		viewLogger.info('🖱️ Item seleccionado:', item.name);
	}, []);

	const emptyStateConfig = useMemo(
		() => ({
			icon: MapPin,
			title: 'No hay imágenes en este lugar',
			description: 'Este lugar no tiene imágenes asociadas',
		}),
		[]
	);

	const noSelectionEmptyState = useMemo(
		() => (
			<EmptyState
				description="Selecciona un lugar para ver su contenido"
				icon={MapPin}
				title="No hay lugar seleccionado"
			/>
		),
		[]
	);

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
			containerName={selectedPlace?.name ?? 'lugar'}
			currentContainerId={selectedPlaceId}
			emptyState={emptyStateConfig}
			error={error}
			isLoading={isLoading}
			items={items}
			onRefresh={loadPlaceImages}
			toggleItemSelection={handleItemSelection}
		>
			<BaseContentView>
				{/* Place content will be added here */}
				<div className="p-4">
					<p>Contenido del lugar se mostrará aquí</p>
				</div>
			</BaseContentView>
		</ContentViewProvider>
	);
});

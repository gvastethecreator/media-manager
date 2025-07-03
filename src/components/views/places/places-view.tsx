import { MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { PlaceCard } from '@/components/cards/place-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePlaces } from '@/lib/api/places';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { usePlaceStore } from '@/store/entities/place';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('PlacesView');

export function PlacesView({ isVisible }: ViewProps) {
	const { searchTerm, sortBy, sortOrder } = useNavigationStore();
	const { selectedPlaceId, setSelectedPlaceId } = usePlaceStore();
	const [localSearch, setLocalSearch] = useState(searchTerm || '');

	// Usar React Query hook en lugar de server action
	const {
		data: places = [],
		isLoading,
		error,
		refetch,
	} = usePlaces({
		search: localSearch,
		sortBy: sortBy as 'name' | 'createdAt' | 'updatedAt',
		sortOrder: sortOrder as 'asc' | 'desc',
	});

	// Sincronizar búsqueda local con store de navegación
	useEffect(() => {
		if (searchTerm !== localSearch) {
			setLocalSearch(searchTerm || '');
		}
	}, [searchTerm, localSearch]);

	const handlePlaceSelect = useCallback(
		(placeId: string) => {
			viewLogger.info('📍 Seleccionando place', { placeId });
			setSelectedPlaceId(placeId);
			clientEvents.emit('place:selected', { placeId });
		},
		[setSelectedPlaceId]
	);

	const handleRetry = useCallback(() => {
		viewLogger.info('🔄 Reintentando cargar places');
		refetch();
	}, [refetch]);

	if (!isVisible) return null;

	if (isLoading) {
		return <LoadingScreen message="Cargando lugares..." />;
	}

	if (error) {
		return (
			<EmptyState
				icon={MapPin}
				title="Error al cargar lugares"
				description={error instanceof Error ? error.message : 'Ha ocurrido un error inesperado'}
				action={{
					label: 'Reintentar',
					onClick: handleRetry,
				}}
			/>
		);
	}

	if (!places.length) {
		const emptyMessage = localSearch
			? `No se encontraron lugares que coincidan con "${localSearch}"`
			: 'No hay lugares disponibles';

		return <EmptyState icon={MapPin} title="Sin lugares" description={emptyMessage} />;
	}

	return (
		<ScrollArea className="flex-1">
			<div className="p-6">
				<motion.div
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
				>
					{places.map((place, index) => (
						<motion.div
							key={place.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: index * 0.05 }}
						>
							<PlaceCard
								place={place}
								isSelected={place.id === selectedPlaceId}
								onSelect={() => handlePlaceSelect(place.id)}
							/>
						</motion.div>
					))}
				</motion.div>
			</div>
		</ScrollArea>
	);
}

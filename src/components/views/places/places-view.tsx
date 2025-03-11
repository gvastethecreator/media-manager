'use client';

import { type PlaceWithStats, getPlaces } from '@/app/actions/places/place.actions';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { PlaceCard } from '@/components/features/entity-cards/place/place-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { logger } from '@/lib/logger/logger';
import { useFileManager } from '@/store/file-manager.store';
import { useNavigationStore } from '@/store/navigation.store';
import { MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = logger.withContext('PlacesView');

export function PlacesView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentPlace } = useFileManager();
	const [places, setPlaces] = useState<PlaceWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticPlaces, _addEvent] = clientEvents.useEvents<PlaceWithStats[]>(places);

	const fetchPlaces = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando lugares...');
			const data = await getPlaces();
			setPlaces(data);
			viewLogger.info(`✅ ${data.length} lugares cargados`);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando lugares:', err);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPlaces();
	}, [fetchPlaces]);

	const handlePlaceClick = useCallback(
		(place: PlaceWithStats) => {
			viewLogger.info('🖱️ Click en lugar:', place.name);
			setCurrentView('place-content');
			setCurrentPlace(place.id);
		},
		[setCurrentView, setCurrentPlace]
	);

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading) {
		return <LoadingScreen />;
	}

	if (!optimisticPlaces || optimisticPlaces.length === 0) {
		return (
			<EmptyState
				icon={MapPin}
				title="No hay lugares"
				description="Los lugares te ayudan a organizar tus imágenes. Crea un nuevo lugar desde el panel de configuración."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{optimisticPlaces.map((place, index) => (
						<button
							key={place.id}
							type="button"
							className="cursor-pointer text-left w-full"
							onClick={() => handlePlaceClick(place)}
							aria-label={`Ver lugar ${place.name}`}
						>
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
							>
								<PlaceCard place={place} />
							</motion.div>
						</button>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}

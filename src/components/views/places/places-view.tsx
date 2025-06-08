'use client';

import { type PlaceWithStats, getPlaces } from '@/app/actions/places/place.actions';
import { getPlaceVisualConfig } from '@/app/actions/visual-config.actions';
import { MemoizedPlaceCard } from '@/components/cards/place-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { usePlaceStore } from '@/store/entities/place';
import { LandPlot } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('PlacesView');

// Configuración visual simplificada para lugares
const DEFAULT_PLACE_OPTIONS: CardOptions = {
	primaryColor: '#10b981',
	secondaryColor: '#0ea5e9',
};

export function PlacesView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { selectPlace } = usePlaceStore();
	const [places, setPlaces] = useState<PlaceWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [visualConfig, setVisualConfig] = useState<CardOptions>(DEFAULT_PLACE_OPTIONS);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticPlaces, _addEvent] = clientEvents.useEvents<PlaceWithStats[]>(places);

	const loadPlaces = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando lugares...');
			const data = await getPlaces();
			// Transformar los datos de la API al formato que necesitamos
			const placesWithStats = data.map((place: any) => ({
				...place,
				totalSize: 0, // Valor por defecto
				lastUpdated: place.updatedAt,
				recentImages: [], // No tenemos imágenes recientes por ahora
			}));
			setPlaces(placesWithStats);
			viewLogger.info(`✅ ${data.length} lugares cargados`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando lugares:', error);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadPlaces();
	}, [loadPlaces]);

	useEffect(() => {
		const loadVisualConfig = async () => {
			try {
				const config = await getPlaceVisualConfig();
				setVisualConfig({
					...DEFAULT_PLACE_OPTIONS,
					...config,
				});
			} catch (error) {
				console.error('Error al cargar la configuración visual:', error);
				// Si hay un error, mantenemos la configuración predeterminada
			}
		};

		loadVisualConfig();
	}, []);

	const handlePlaceClick = useCallback(
		(place: PlaceWithStats) => {
			viewLogger.info('🖱️ Click en lugar:', place.name);
			setCurrentView('place-content');
			selectPlace(place.id);
		},
		[setCurrentView, selectPlace]
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
				icon={LandPlot}
				title="No hay lugares creados"
				description="Crea lugares para organizar tus imágenes por locación."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{optimisticPlaces.map((place, index) => (
						<motion.div
							key={place.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
						>
							<MemoizedPlaceCard place={place} onClick={() => handlePlaceClick(place)} className="h-full" />
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}

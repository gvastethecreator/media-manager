'use client';

import { type PlaceWithStats, getPlaces } from '@/app/actions/places/place.actions';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { EntityCardAdapter } from '@/components/features/entity-cards/adapters/entity-card-adapter';
import type { CardOptions } from '@/components/features/entity-cards/types/unified-card-types';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { logger } from '@/lib/logger/logger';
import { useFileManager } from '@/store/file-manager.store';
import { MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = logger.withContext('PlacesView');

// Configuración visual predeterminada para lugares
const DEFAULT_PLACE_OPTIONS: CardOptions = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlines: false,
	enableLightHalo: true,
	enableAnimatedBorder: true,
	enableGlowEffect: true,
	enableGrainEffect: false,
	useImageGrid: true,
	imageGridLayout: 'quad',
	imageGridGap: 4,
	imageGridStyle: 'standard',
	designSystem: {
		preset: 'place',
		variant: 'default',
		aspectRatio: '3/2',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 3,
		shadowStyle: 'soft',
	},
	layerSystem: {
		order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
		layerBlending: 'screen',
		layerSpacing: 2,
	},
	primaryColor: '#0ea5e9',
	secondaryColor: '#06b6d4',
	hoverLiftHeight: 10,
	maxRotation: 15,
};

export function PlacesView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentPlace } = useFileManager();
	const [places, setPlaces] = useState<PlaceWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [visualConfig, setVisualConfig] = useState<CardOptions>(DEFAULT_PLACE_OPTIONS);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticPlaces, _addEvent] = clientEvents.useEvents<PlaceWithStats[]>(places);

	const fetchPlaces = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando lugares...');
			const data = await getPlaces();

			// Transformar los datos para cumplir con PlaceWithStats
			const transformedData = data.map((place) => {
				// Calcular tamaño total si no existe
				let size = 0;
				if ('totalSize' in place) {
					size = (place.totalSize as number) || 0;
				}

				return {
					...place,
					totalSize: size,
					lastUpdated: place.updatedAt,
					recentImages: place.images?.map((img) => img.id) || [],
				};
			});

			setPlaces(transformedData as PlaceWithStats[]);
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

	useEffect(() => {
		const loadVisualConfig = async () => {
			try {
				const response = await fetch('/api/entities/places/visual-config');
				if (!response.ok) {
					throw new Error('Error al cargar la configuración visual');
				}
				const config = await response.json();
				// Combinar la configuración del servidor con las opciones predeterminadas
				setVisualConfig({
					...DEFAULT_PLACE_OPTIONS,
					...config,
					// Asegurar que las propiedades anidadas se combinen correctamente
					designSystem: {
						...(DEFAULT_PLACE_OPTIONS.designSystem || {}),
						...(config.designSystem || {}),
					},
					layerSystem: {
						...(DEFAULT_PLACE_OPTIONS.layerSystem || {}),
						...(config.layerSystem || {}),
					},
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
			setCurrentPlace(place.id);
			// Actualizar la información completa del lugar en el store
			useFileManager.setState({
				currentPlace: {
					id: place.id,
					name: place.name,
					description: place.description,
					emoji: place.emoji,
					color: place.color,
					_count: place._count,
					createdAt: place.createdAt,
					updatedAt: place.updatedAt,
				},
			});
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
						<motion.div
							key={place.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
							className="cursor-pointer"
						>
							<EntityCardAdapter
								entityType="place"
								entity={place}
								onClick={() => handlePlaceClick(place)}
								showVisualConfig={true}
								enableExplode={true}
								options={visualConfig}
							/>
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}

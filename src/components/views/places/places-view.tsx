import { MapPin } from 'lucide-react';
import { useCallback, useState } from 'react';
import { PlaceCard } from '@/components/cards/place-card';
import { LoadingScreen } from '@/components/core/feedback';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from '@/components/ui/motion-shim';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useEntitySelection } from '@/hooks/use-entity-selection';
import { useCreatePlace, usePlaces } from '@/lib/api/places';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { usePlaceStore } from '@/store/entities/place';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('PlacesView');

export function PlacesView({ isVisible }: ViewProps) {
	const { selectedPlaceId, selectPlace } = usePlaceStore();
	const { mutate: createPlace } = useCreatePlace();
	const { handleItemClick: updateSelection } = useEntitySelection();

	const [localSearch, setLocalSearch] = useState('');
	const [showForm, setShowForm] = useState(false);
	const [newPlaceName, setNewPlaceName] = useState('');
	const [newPlaceDescription, setNewPlaceDescription] = useState('');

	// Usar React Query hook en lugar de server action
	const {
		data: placesResponse,
		isLoading,
		error,
		refetch,
	} = usePlaces({
		search: localSearch,
		sortBy: 'name',
		sortOrder: 'asc',
	});

	const places = placesResponse?.data || [];

	const handlePlaceSelect = useCallback(
		(placeId: string) => {
			viewLogger.info('📍 Seleccionando place', { placeId });
			selectPlace(placeId);

			// Actualizar panel de detalles con el lugar seleccionado
			const place = places.find((p) => p.id === placeId);
			if (place) {
				updateSelection(place as any);
			}

			clientEvents.emit('place:selected', { placeId });
		},
		[selectPlace, places, updateSelection]
	);

	const { toast } = useToast();
	const handleCreatePlace = useCallback(() => {
		if (newPlaceName.trim() === '') {
			toast({
				title: '❌ Error',
				description: 'El nombre del lugar no puede estar vacío.',
				variant: 'destructive',
			});
			return;
		}
		createPlace({ name: newPlaceName, description: newPlaceDescription });
		setNewPlaceName('');
		setNewPlaceDescription('');
		setShowForm(false);
	}, [newPlaceName, newPlaceDescription, createPlace, toast]);

	const handleRetry = useCallback(() => {
		viewLogger.info('🔄 Reintentando cargar places');
		refetch();
	}, [refetch]);

	if (!isVisible) {
		return null;
	}

	if (isLoading) {
		return <LoadingScreen message="Cargando lugares..." />;
	}

	if (error) {
		return (
			<EmptyState
				actions={<Button onClick={handleRetry}>Reintentar</Button>}
				description={error instanceof Error ? error.message : 'Ha ocurrido un error inesperado'}
				icon={MapPin}
				title="Error al cargar lugares"
			/>
		);
	}

	return (
		<ScrollArea className="flex-1">
			<div className="p-6">
				<h2 className="mb-4 font-bold text-xl">Vista de Lugares</h2>

				<Button className="mb-4" onClick={() => setShowForm(!showForm)}>
					{showForm ? 'Cancelar' : 'Crear Lugar'}
				</Button>

				{showForm && (
					<div className="mb-6 rounded-lg border p-4 shadow-sm">
						<h3 className="mb-3 font-semibold text-lg">Nuevo Lugar</h3>
						<div className="mb-3 grid gap-2">
							<Label htmlFor="placeName">Nombre</Label>
							<Input
								id="placeName"
								onChange={(e) => setNewPlaceName(e.target.value)}
								placeholder="Nombre del lugar"
								value={newPlaceName}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label htmlFor="placeDescription">Descripción</Label>
							<Textarea
								id="placeDescription"
								onChange={(e) => setNewPlaceDescription(e.target.value)}
								placeholder="Descripción del lugar (opcional)"
								value={newPlaceDescription}
							/>
						</div>
						<Button onClick={handleCreatePlace}>Guardar Lugar</Button>
					</div>
				)}

				{places.length || isLoading || showForm ? (
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
						initial={{ opacity: 0, y: 20 }}
						transition={{ duration: 0.3 }}
					>
						{places.map((place, index) => (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								initial={{ opacity: 0, y: 20 }}
								key={place.id}
								transition={{ duration: 0.3, delay: index * 0.05 }}
							>
								<PlaceCard
									className={place.id === selectedPlaceId ? 'ring-2 ring-primary' : ''}
									onClick={() => handlePlaceSelect(place.id)}
									place={place}
								/>
							</motion.div>
						))}
					</motion.div>
				) : (
					<EmptyState
						description={
							localSearch
								? `No se encontraron lugares que coincidan con "${localSearch}"`
								: 'No hay lugares disponibles'
						}
						icon={MapPin}
						title="Sin lugares"
					/>
				)}
			</div>
		</ScrollArea>
	);
}

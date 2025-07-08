import { MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { PlaceCard } from '@/components/cards/place-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePlaces, useCreatePlace } from '@/lib/api/places';
import { useToast } from '@/components/ui/use-toast';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { usePlaceStore } from '@/store/entities/place';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('PlacesView');

export function PlacesView({ isVisible }: ViewProps) {
	const { searchTerm, sortBy, sortOrder } = useNavigationStore();
	const { selectedPlaceId, setSelectedPlaceId } = usePlaceStore();
	const { mutate: createPlace } = useCreatePlace();

	const [localSearch, setLocalSearch] = useState(searchTerm || '');
	const [showForm, setShowForm] = useState(false);
	const [newPlaceName, setNewPlaceName] = useState('');
	const [newPlaceDescription, setNewPlaceDescription] = useState('');

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
	}, [newPlaceName, newPlaceDescription, createPlace]);

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

	return (
		<ScrollArea className="flex-1">
			<div className="p-6">
				<h2 className="text-xl font-bold mb-4">Vista de Lugares</h2>

				<Button onClick={() => setShowForm(!showForm)} className="mb-4">
					{showForm ? 'Cancelar' : 'Crear Lugar'}
				</Button>

				{showForm && (
					<div className="mb-6 p-4 border rounded-lg shadow-sm">
						<h3 className="text-lg font-semibold mb-3">Nuevo Lugar</h3>
						<div className="grid gap-2 mb-3">
							<Label htmlFor="placeName">Nombre</Label>
							<Input
								id="placeName"
								value={newPlaceName}
								onChange={(e) => setNewPlaceName(e.target.value)}
								placeholder="Nombre del lugar"
							/>
						</div>
						<div className="grid gap-2 mb-4">
							<Label htmlFor="placeDescription">Descripción</Label>
							<Textarea
								id="placeDescription"
								value={newPlaceDescription}
								onChange={(e) => setNewPlaceDescription(e.target.value)}
								placeholder="Descripción del lugar (opcional)"
							/>
						</div>
						<Button onClick={handleCreatePlace}>Guardar Lugar</Button>
					</div>
				)}

				{!places.length && !isLoading && !showForm ? (
					<EmptyState icon={MapPin} title="Sin lugares" description={localSearch ? `No se encontraron lugares que coincidan con "${localSearch}"` : 'No hay lugares disponibles'} />
				) : (
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
				)}
			</div>
		</ScrollArea>
	);
}

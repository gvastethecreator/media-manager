import { MapPin } from 'lucide-react';
import { useCallback, useState } from 'react';
import { PlaceCard } from '@/components/cards/place-card/place-card';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from '@/components/ui/motion-shim';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useCreatePlace, usePlaces } from '@/lib/api/places';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { usePlaceStore } from '@/store/entities/place';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('PlacesView');

export function PlacesView({ isVisible }: ViewProps) {
	const { selectedPlaceId, selectPlace } = usePlaceStore();
	const { mutate: createPlace } = useCreatePlace();

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
			viewLogger.info('📍 Selecting place', { placeId });
			selectPlace(placeId);
			clientEvents.emit('place:selected', { placeId });
		},
		[selectPlace]
	);

	const { toast } = useToast();
	const handleCreatePlace = useCallback(() => {
		if (newPlaceName.trim() === '') {
			toast({
				title: '❌ Error',
				description: 'Place name cannot be empty.',
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
		viewLogger.info('🔄 Retrying place loading');
		refetch();
	}, [refetch]);

	if (isVisible === false) {
		return null;
	}

	if (isLoading) {
		return <LoadingScreen message="Loading places..." />;
	}

	if (error) {
		return (
			<EmptyState
				actions={<Button onClick={handleRetry}>Retry</Button>}
				description={error instanceof Error ? error.message : 'An unexpected error occurred'}
				icon={MapPin}
				title="Could not load places"
			/>
		);
	}

	return (
		<ScrollArea className="flex-1">
			<div className="p-6">
				<h2 className="mb-4 font-bold text-xl">Places</h2>

				<Button className="mb-4" onClick={() => setShowForm(!showForm)}>
					{showForm ? 'Cancel' : 'Create Place'}
				</Button>

				{showForm && (
					<div className="mb-6 rounded-lg border p-4 shadow-sm">
						<h3 className="mb-3 font-semibold text-lg">New Place</h3>
						<div className="mb-3 grid gap-2">
							<Label htmlFor="placeName">Name</Label>
							<Input
								id="placeName"
								onChange={(e) => setNewPlaceName(e.target.value)}
								placeholder="Place name"
								value={newPlaceName}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label htmlFor="placeDescription">Description</Label>
							<Textarea
								id="placeDescription"
								onChange={(e) => setNewPlaceDescription(e.target.value)}
								placeholder="Place description (optional)"
								value={newPlaceDescription}
							/>
						</div>
						<Button onClick={handleCreatePlace}>Save Place</Button>
					</div>
				)}

				{places.length || isLoading || showForm ? (
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
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
								? `No places match "${localSearch}"`
								: 'No places available'
						}
						icon={MapPin}
						title="No places"
					/>
				)}
			</div>
		</ScrollArea>
	);
}

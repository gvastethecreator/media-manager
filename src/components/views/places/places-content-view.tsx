import { MapPinIcon } from 'lucide-react';
import { memo, useMemo } from 'react';
import { PlaceCard } from '@/components/cards/place-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { motion } from '@/components/ui/motion-shim';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePlaces } from '@/lib/api/places';
import type { PlaceWithStats } from '@/types/entities/place';

const PlacesContentView = () => {
	const { data, isLoading, error } = usePlaces({
		limit: 48,
		sortBy: 'createdAt',
		sortOrder: 'desc',
	});

	const items: PlaceWithStats[] = useMemo(() => {
		const list = data?.data ?? [];
		// Asumiendo que el API ya devuelve datos con el formato correcto
		return list as PlaceWithStats[];
	}, [data]);

	if (error) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-destructive">Error: {error.message}</p>
			</div>
		);
	}

	if (isLoading) {
		return <LoadingScreen />;
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<h2 className="mb-4 font-bold text-xl">Lugares</h2>
				{items.length === 0 ? (
					<EmptyState description="Aún no has creado lugares." icon={MapPinIcon} title="Sin lugares" />
				) : (
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
						{items.map((place, index) => (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								initial={{ opacity: 0, y: 10 }}
								key={place.id}
								transition={{ delay: index * 0.02 }}
							>
								<PlaceCard place={place} />
							</motion.div>
						))}
					</div>
				)}
			</div>
		</ScrollArea>
	);
};

export default memo(PlacesContentView);

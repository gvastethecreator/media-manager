import { Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { FavoriteCard } from '@/components/cards/favorite-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFavorites } from '@/lib/api/favorites';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { useFavoriteStore } from '@/store/entities/favorite';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('FavoritesView');

export function FavoritesView({ isVisible }: ViewProps) {
	const { searchTerm, sortBy, sortOrder } = useNavigationStore();
	const { selectedFavoriteId, setSelectedFavoriteId } = useFavoriteStore();
	const [localSearch, setLocalSearch] = useState(searchTerm || '');

	// Usar React Query hook en lugar de server action
	const {
		data: favorites = [],
		isLoading,
		error,
		refetch,
	} = useFavorites({
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

	const handleFavoriteSelect = useCallback(
		(favoriteId: string) => {
			viewLogger.info('⭐ Seleccionando favorite', { favoriteId });
			setSelectedFavoriteId(favoriteId);
			clientEvents.emit('favorite:selected', { favoriteId });
		},
		[setSelectedFavoriteId]
	);

	const handleRetry = useCallback(() => {
		viewLogger.info('🔄 Reintentando cargar favorites');
		refetch();
	}, [refetch]);

	if (!isVisible) return null;

	if (isLoading) {
		return <LoadingScreen message="Cargando favoritos..." />;
	}

	if (error) {
		return (
			<EmptyState
				icon={Heart}
				title="Error al cargar favoritos"
				description={error instanceof Error ? error.message : 'Ha ocurrido un error inesperado'}
				action={{
					label: 'Reintentar',
					onClick: handleRetry,
				}}
			/>
		);
	}

	if (!favorites.length) {
		const emptyMessage = localSearch
			? `No se encontraron favoritos que coincidan con "${localSearch}"`
			: 'No hay favoritos disponibles';

		return <EmptyState icon={Heart} title="Sin favoritos" description={emptyMessage} />;
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
					{favorites.map((favorite, index) => (
						<motion.div
							key={favorite.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: index * 0.05 }}
						>
							<FavoriteCard
								favorite={favorite}
								isSelected={favorite.id === selectedFavoriteId}
								onSelect={() => handleFavoriteSelect(favorite.id)}
							/>
						</motion.div>
					))}
				</motion.div>
			</div>
		</ScrollArea>
	);
}

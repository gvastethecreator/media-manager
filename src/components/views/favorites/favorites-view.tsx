import { useCallback, useEffect, useState } from 'react';
import { useCreateFavorite, useFavorites } from '@/lib/api/favorites';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { useFavoriteStore } from '@/store/entities/favorite';
import type { ViewProps } from '../types';
import FavoritesContentView from './favorites-content-view';

const viewLogger = clientLogger.withContext('FavoritesView');

export function FavoritesView({ isVisible }: ViewProps) {
	const { selectedFavoriteId, setSelectedFavoriteId } = useFavoriteStore();
	const { mutate: createFavorite } = useCreateFavorite();

	const [localSearch, setLocalSearch] = useState('');
	const [showForm, setShowForm] = useState(false);
	const [newFavoriteName, setNewFavoriteName] = useState('');
	const [newFavoriteDescription, setNewFavoriteDescription] = useState('');

	// Usar React Query hook en lugar de server action
	const {
		data: favorites = [],
		isLoading,
		error,
		refetch,
	} = useFavorites({
		search: localSearch,
		sortBy: 'name' as 'name' | 'createdAt' | 'updatedAt',
		sortOrder: 'asc' as 'asc' | 'desc',
	});



	const handleFavoriteSelect = useCallback(
		(favoriteId: string) => {
			viewLogger.info('⭐ Seleccionando favorite', { favoriteId });
			setSelectedFavoriteId(favoriteId);
			clientEvents.emit('favorite:selected', { favoriteId });
		},
		[setSelectedFavoriteId]
	);

	const handleCreateFavorite = useCallback(() => {
		// const { toast } = useToast();
		if (newFavoriteName.trim() === '') {
			// toast({
			// 	title: '❌ Error',
			// 	description: 'El nombre del favorito no puede estar vacío.',
			// 	variant: 'destructive',
			// });
			return;
		}
		createFavorite({ name: newFavoriteName, description: newFavoriteDescription });
		setNewFavoriteName('');
		setNewFavoriteDescription('');
		setShowForm(false);
	}, [newFavoriteName, newFavoriteDescription, createFavorite]);

	const handleRetry = useCallback(() => {
		viewLogger.info('🔄 Reintentando cargar favorites');
		refetch();
	}, [refetch]);

	if (!isVisible) return null;

	return (
		<FavoritesContentView
			favorites={favorites}
			isLoading={isLoading}
			error={error}
			localSearch={localSearch}
			showForm={showForm}
			newFavoriteName={newFavoriteName}
			newFavoriteDescription={newFavoriteDescription}
			selectedFavoriteId={selectedFavoriteId}
			setShowForm={setShowForm}
			setNewFavoriteName={setNewFavoriteName}
			setNewFavoriteDescription={setNewFavoriteDescription}
			handleFavoriteSelect={handleFavoriteSelect}
			handleCreateFavorite={handleCreateFavorite}
			handleRetry={handleRetry}
		/>
	);
}

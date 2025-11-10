import { useCallback, useState } from 'react';
import { useEntitySelection } from '@/hooks/use-entity-selection';
import { useCreateFavorite, useFavorites } from '@/lib/api/favorites';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { useFavoriteStore } from '@/store/entities/favorite';
import type { ViewProps } from '../types';
import FavoritesContentView from './favorites-content-view';

const viewLogger = clientLogger.withContext('FavoritesView');

export function FavoritesView({ isVisible }: ViewProps) {
	// Usar selectores normales de Zustand
	const selectedIds = useFavoriteStore((state) => state.selectedIds) || [];
	const selectFavorite = useFavoriteStore((state) => state.selectFavorite);
	const deselectFavorite = useFavoriteStore((state) => state.deselectFavorite);
	const { handleItemClick: updateSelection } = useEntitySelection();

	// Obtener el primer favorito seleccionado como selectedFavoriteId
	const selectedFavoriteId = selectedIds.length > 0 ? selectedIds[0] : null;
	const setSelectedFavoriteId = useCallback(
		(id: string) => {
			if (selectedIds.includes(id)) {
				deselectFavorite(id);
			} else {
				selectFavorite(id);
			}
		},
		[selectedIds, selectFavorite, deselectFavorite]
	);
	const { mutate: createFavorite } = useCreateFavorite();

	const [localSearch, setLocalSearch] = useState('');
	const [showForm, setShowForm] = useState(false);
	const [newFavoriteName, setNewFavoriteName] = useState('');
	const [newFavoriteDescription, setNewFavoriteDescription] = useState('');

	// Usar React Query hook en lugar de server action
	const {
		data: favoritesResponse,
		isLoading,
		error,
		refetch,
	} = useFavorites({
		search: localSearch,
		sortBy: 'addedAt',
		sortOrder: 'desc',
	});

	const favorites = favoritesResponse?.data || [];

	const handleFavoriteSelect = useCallback(
		(favoriteId: string) => {
			viewLogger.info('⭐ Seleccionando favorite', { favoriteId });
			setSelectedFavoriteId(favoriteId);

			// Actualizar panel de detalles con el favorito seleccionado
			const favorite = favorites.find((f) => f.id === favoriteId);
			if (favorite) {
				updateSelection(favorite as any);
			}

			clientEvents.emit('favorite:selected', { favoriteId });
		},
		[setSelectedFavoriteId, favorites, updateSelection]
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
		// TODO: Implementar correctamente con entityId y entityType
		// createFavorite({ entityId: 'temp', entityType: FavoriteEntityType.IMAGE, userId: null, addedAt: new Date(), notes: newFavoriteDescription, category: null, priority: null });
		setNewFavoriteName('');
		setNewFavoriteDescription('');
		setShowForm(false);
	}, [newFavoriteName]);

	const handleRetry = useCallback(() => {
		viewLogger.info('🔄 Reintentando cargar favorites');
		refetch();
	}, [refetch]);

	if (!isVisible) {
		return null;
	}

	return (
		<FavoritesContentView
			error={error}
			favorites={favorites}
			handleCreateFavorite={handleCreateFavorite}
			handleFavoriteSelect={handleFavoriteSelect}
			handleRetry={handleRetry}
			isLoading={isLoading}
			localSearch={localSearch}
			newFavoriteDescription={newFavoriteDescription}
			newFavoriteName={newFavoriteName}
			selectedFavoriteId={selectedFavoriteId}
			setNewFavoriteDescription={setNewFavoriteDescription}
			setNewFavoriteName={setNewFavoriteName}
			setShowForm={setShowForm}
			showForm={showForm}
		/>
	);
}

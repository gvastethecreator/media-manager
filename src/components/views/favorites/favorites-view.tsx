import { Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { FavoriteCard } from '@/components/cards/favorite-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFavorites, useCreateFavorite } from '@/lib/api/favorites';
import { useToast } from '@/components/ui/use-toast';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { useFavoriteStore } from '@/store/entities/favorite';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('FavoritesView');

export function FavoritesView({ isVisible }: ViewProps) {
	const { searchTerm, sortBy, sortOrder } = useNavigationStore();
	const { selectedFavoriteId, setSelectedFavoriteId } = useFavoriteStore();
	const { mutate: createFavorite } = useCreateFavorite();

	const [localSearch, setLocalSearch] = useState(searchTerm || '');
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

	const handleCreateFavorite = useCallback(() => {
		const { toast } = useToast();
		if (newFavoriteName.trim() === '') {
			toast({
				title: '❌ Error',
				description: 'El nombre del favorito no puede estar vacío.',
				variant: 'destructive',
			});
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

	return (
		<ScrollArea className="flex-1">
			<div className="p-6">
				<h2 className="text-xl font-bold mb-4">Vista de Favoritos</h2>

				<Button onClick={() => setShowForm(!showForm)} className="mb-4">
					{showForm ? 'Cancelar' : 'Crear Favorito'}
				</Button>

				{showForm && (
					<div className="mb-6 p-4 border rounded-lg shadow-sm">
						<h3 className="text-lg font-semibold mb-3">Nuevo Favorito</h3>
						<div className="grid gap-2 mb-3">
							<Label htmlFor="favoriteName">Nombre</Label>
							<Input
								id="favoriteName"
								value={newFavoriteName}
								onChange={(e) => setNewFavoriteName(e.target.value)}
								placeholder="Nombre del favorito"
							/>
						</div>
						<div className="grid gap-2 mb-4">
							<Label htmlFor="favoriteDescription">Descripción</Label>
							<Textarea
								id="favoriteDescription"
								value={newFavoriteDescription}
								onChange={(e) => setNewFavoriteDescription(e.target.value)}
								placeholder="Descripción del favorito (opcional)"
							/>
						</div>
						<Button onClick={handleCreateFavorite}>Guardar Favorito</Button>
					</div>
				)}

				{!favorites.length && !isLoading && !showForm ? (
					<EmptyState icon={Heart} title="Sin favoritos" description={localSearch ? `No se encontraron favoritos que coincidan con "${localSearch}"` : 'No hay favoritos disponibles'} />
				) : (
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
				)}
			</div>
		</ScrollArea>
	);
}

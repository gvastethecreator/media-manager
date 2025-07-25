import { Heart } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { FavoriteWithStats } from '@/types/entities/favorite/base';
import type { FavoriteExtended } from '@/types/entities/favorite/types';
import { FavoriteCard } from '@/components/cards/favorite-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ViewContainer } from '@/components/views/view-container';
import { LoadingScreen } from '@/components/core/feedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { clientLogger } from '@/lib/logger';
import { FAVORITE_ENTITY_EMOJIS, FAVORITE_ENTITY_COLORS } from '@/types/entities/favorite/base';

/**
 * Transforma un FavoriteWithStats a FavoriteExtended para compatibilidad con FavoriteCard
 */
function transformToExtended(favorite: FavoriteWithStats): FavoriteExtended {
	const entityIcon = FAVORITE_ENTITY_EMOJIS[favorite.entityType] || '⭐';
	const entityColor = FAVORITE_ENTITY_COLORS[favorite.entityType] || '#6b7280';
	
	return {
		...favorite,
		// Propiedades adicionales requeridas por FavoriteExtended
		addedAt: favorite.createdAt, // Mapear createdAt a addedAt
		notes: null, // Valor por defecto
		category: null, // Valor por defecto
		priority: null, // Valor por defecto
		// Propiedades de UI
		entityName: favorite.stats.entityTypeName,
		entityPreview: '',
		entityIcon,
		entityColor,
		isSelected: false,
		isHovered: false,
	};
}

interface FavoritesContentViewProps {
	favorites: FavoriteWithStats[];
	isLoading: boolean;
	error: Error | null;
	localSearch: string;
	showForm: boolean;
	newFavoriteName: string;
	newFavoriteDescription: string;
	selectedFavoriteId: string | null;
	setShowForm: (show: boolean) => void;
	setNewFavoriteName: (name: string) => void;
	setNewFavoriteDescription: (description: string) => void;
	handleFavoriteSelect: (favoriteId: string) => void;
	handleCreateFavorite: () => void;
	handleRetry: () => void;
	className?: string;
}

const FavoritesContentView: React.FC<FavoritesContentViewProps> = ({
	favorites,
	isLoading,
	error,
	localSearch,
	showForm,
	newFavoriteName,
	newFavoriteDescription,
	selectedFavoriteId,
	setShowForm,
	setNewFavoriteName,
	setNewFavoriteDescription,
	handleFavoriteSelect,
	handleCreateFavorite,
	handleRetry,
	className,
}) => {
	if (isLoading) {
		return <LoadingScreen message="Cargando favoritos..." />;
	}

	if (error) {
		return (
				<EmptyState
					icon={Heart}
					title="Error al cargar favoritos"
					description={error instanceof Error ? error.message : 'Ha ocurrido un error inesperado'}
					actions={<Button onClick={handleRetry}>Reintentar</Button>}
				/>
			);
	}

	return (
		<ScrollArea className={className || 'flex-1'}>
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

				{(!favorites || !favorites.length) && !isLoading && !showForm ? (
					<EmptyState
						icon={Heart}
						title="Sin favoritos"
						description={
							localSearch
								? `No se encontraron favoritos que coincidan con "${localSearch}"`
								: 'No hay favoritos disponibles'
						}
					/>
				) : (
					<motion.div
						className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
					>
						{favorites?.map((favorite, index) => (
							<motion.div
								key={favorite.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3, delay: index * 0.05 }}
							>
								<FavoriteCard
									favorite={transformToExtended(favorite)}
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
};

export default FavoritesContentView;

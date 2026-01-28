import { Heart } from 'lucide-react';
import React from 'react';
import { FavoriteCard } from '@/components/cards/favorite-card';
import { LoadingScreen } from '@/components/core/feedback';
import { motion } from '@/components/ui/animejs-shim';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_NEUTRAL_COLOR } from '@/lib/styles/color-tokens';
import type { FavoriteWithStats } from '@/types/entities/favorite/base';
import { FAVORITE_ENTITY_COLORS, FAVORITE_ENTITY_EMOJIS } from '@/types/entities/favorite/base';
import type { FavoriteExtended } from '@/types/entities/favorite/types';

/**
 * Transforma un FavoriteWithStats a FavoriteExtended para compatibilidad con FavoriteCard
 */
function transformToExtended(favorite: FavoriteWithStats): FavoriteExtended {
	const entityIcon = FAVORITE_ENTITY_EMOJIS[favorite.entityType] || '⭐';
	const entityColor = FAVORITE_ENTITY_COLORS[favorite.entityType] || DEFAULT_NEUTRAL_COLOR;

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
				actions={<Button onClick={handleRetry}>Reintentar</Button>}
				description={error instanceof Error ? error.message : 'Ha ocurrido un error inesperado'}
				icon={Heart}
				title="Error al cargar favoritos"
			/>
		);
	}

	return (
		<ScrollArea className={className || 'flex-1'}>
			<div className="p-6">
				<h2 className="mb-4 font-bold text-xl">Vista de Favoritos</h2>

				<Button className="mb-4" onClick={() => setShowForm(!showForm)}>
					{showForm ? 'Cancelar' : 'Crear Favorito'}
				</Button>

				{showForm && (
					<div className="mb-6 rounded-lg border p-4 shadow-sm">
						<h3 className="mb-3 font-semibold text-lg">Nuevo Favorito</h3>
						<div className="mb-3 grid gap-2">
							<Label htmlFor="favoriteName">Nombre</Label>
							<Input
								id="favoriteName"
								onChange={(e) => setNewFavoriteName(e.target.value)}
								placeholder="Nombre del favorito"
								value={newFavoriteName}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label htmlFor="favoriteDescription">Descripción</Label>
							<Textarea
								id="favoriteDescription"
								onChange={(e) => setNewFavoriteDescription(e.target.value)}
								placeholder="Descripción del favorito (opcional)"
								value={newFavoriteDescription}
							/>
						</div>
						<Button onClick={handleCreateFavorite}>Guardar Favorito</Button>
					</div>
				)}

				{favorites?.length || isLoading || showForm ? (
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
						initial={{ opacity: 0, y: 20 }}
						transition={{ duration: 0.3 }}
					>
						{favorites?.map((favorite, index) => (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								initial={{ opacity: 0, y: 20 }}
								key={favorite.id}
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
				) : (
					<EmptyState
						description={
							localSearch
								? `No se encontraron favoritos que coincidan con "${localSearch}"`
								: 'No hay favoritos disponibles'
						}
						icon={Heart}
						title="Sin favoritos"
					/>
				)}
			</div>
		</ScrollArea>
	);
};

export default FavoritesContentView;

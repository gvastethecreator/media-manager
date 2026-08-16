import { Heart } from 'lucide-react';
import React from 'react';
import { FavoriteCard } from '@/components/cards/favorite-card/favorite-card';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from '@/components/ui/motion-shim';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DEFAULT_NEUTRAL_COLOR } from '@/lib/styles/color-tokens';
import type { FavoriteExtended, FavoriteWithStats } from '@/types/entities/favorite';
import { FAVORITE_ENTITY_COLORS, FAVORITE_ENTITY_EMOJIS } from '@/types/entities/favorite';

/**
 * Transforma un FavoriteWithStats a FavoriteExtended para compatibilidad con FavoriteCard
 */
function transformToExtended(favorite: FavoriteWithStats): FavoriteExtended {
	const entityIcon = FAVORITE_ENTITY_EMOJIS[favorite.entityType] || '⭐';
	const entityColor = FAVORITE_ENTITY_COLORS[favorite.entityType] || DEFAULT_NEUTRAL_COLOR;

	return {
		...favorite,
		// Propiedades de UI
		entityName: favorite.entityName || favorite.stats.entityTypeName,
		entityPreview: favorite.entityThumbnail || '',
		entityIcon,
		entityColor,
		isSelected: false,
		isHovered: false,
	};
}

interface FavoritesContentViewProps {
	className?: string;
	error: Error | null;
	favorites: FavoriteWithStats[];
	handleFavoriteSelect: (favoriteId: string) => void;
	handleRetry: () => void;
	isLoading: boolean;
	localSearch: string;
	selectedFavoriteId: string | null;
	setLocalSearch: (value: string) => void;
}

const FavoritesContentView: React.FC<FavoritesContentViewProps> = ({
	favorites,
	isLoading,
	error,
	localSearch,
	selectedFavoriteId,
	setLocalSearch,
	handleFavoriteSelect,
	handleRetry,
	className,
}) => {
	if (isLoading) {
		return <LoadingScreen message="Loading favorites..." />;
	}

	if (error) {
		return (
			<EmptyState
				actions={<Button onClick={handleRetry}>Retry</Button>}
				description={error instanceof Error ? error.message : 'An unexpected error occurred'}
				icon={Heart}
				title="Could not load favorites"
			/>
		);
	}

	return (
		<ScrollArea className={className || 'flex-1'}>
			<div className="p-6">
				<div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div>
						<h2 className="font-bold text-xl">Favorites</h2>
						<p className="text-muted-foreground text-sm">
							Add or remove favorites from each item in the application.
						</p>
					</div>
					<div className="w-full md:max-w-sm">
						<Label className="sr-only" htmlFor="favoritesSearch">
							Search favorites
						</Label>
						<Input
							id="favoritesSearch"
							onChange={(e) => setLocalSearch(e.target.value)}
							placeholder="Search favorites..."
							value={localSearch}
						/>
					</div>
				</div>

				{favorites.length > 0 || isLoading ? (
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
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

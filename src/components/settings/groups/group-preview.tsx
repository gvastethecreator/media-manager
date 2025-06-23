import { CardContent, CardFooter } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { GroupWithStats } from '@/types/entities/group';
import { GroupDetails } from './components/group-details';
import { GroupFilters } from './components/group-filters';
import { GroupHeader } from './components/group-header';
import { GroupStats } from './components/group-stats';

interface GroupPreviewProps {
	group: GroupWithStats;
	onEdit?: () => void;
	onDelete?: () => void;
	onFavoriteToggle?: () => void;
	isDeleting?: boolean;
	stats?: {
		totalGroups: number;
		totalElements: number;
		emptyGroups: number;
		favoriteGroups: number;
	};
}

export function GroupPreview({ group, onEdit, onDelete, onFavoriteToggle, isDeleting = false }: GroupPreviewProps) {
	// Crear objeto de conteos para GroupStats
	const groupCounts = {
		imágenes: group.stats.imageCount,
		vídeos: group.stats.videoCount,
		álbumes: group.stats.albumCount,
		colecciones: group.stats.collectionCount,
		etiquetas: group.stats.tagCount,
		personajes: group.stats.characterCount,
		lugares: group.stats.placeCount,
		conceptos: group.stats.conceptCount,
	};

	return (
		<>
			<GroupHeader
				emoji={group.emoji}
				name={group.name}
				isFavorite={group.isFavorite}
				onEdit={onEdit}
				onDelete={onDelete}
				onFavoriteToggle={onFavoriteToggle}
				isDeleting={isDeleting}
			/>

			<CardContent className="space-y-4 px-6">
				<GroupDetails
					description={group.description}
					category={group.category}
					shortcut={group.shortcut}
					sortBy={group.sortBy}
					color={group.color}
				/>

				<GroupFilters filtersString={group.filters} />

				<GroupStats count={groupCounts} />

				{/* Imagen destacada */}
				{group.featuredImage && (
					<div className="space-y-2">
						<h3 className="text-sm font-medium">Imagen destacada</h3>
						<div className="relative w-full h-32 bg-muted rounded-md overflow-hidden">
							<img src={group.featuredImage} alt={group.name} className="w-full h-full object-cover" />
						</div>
					</div>
				)}
			</CardContent>

			<CardFooter className="px-6">
				<div className="text-sm text-muted-foreground">Creado el {formatDate(group.createdAt)}</div>
			</CardFooter>
		</>
	);
}

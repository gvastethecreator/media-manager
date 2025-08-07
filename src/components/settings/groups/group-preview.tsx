import { CardContent, CardFooter } from '@/components/ui/card';
import { formatDate } from '@/lib/utils/format.utils';
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
				emoji={group.emoji || '📂'}
				isDeleting={isDeleting}
				isFavorite={group.isFavorite}
				name={group.name}
				onDelete={onDelete}
				onEdit={onEdit}
				onFavoriteToggle={onFavoriteToggle}
			/>

			<CardContent className="space-y-4 px-6">
				<GroupDetails
					category={group.category}
					color={group.color}
					description={group.description}
					shortcut={group.shortcut}
					sortBy={group.sortBy}
				/>

				<GroupFilters filtersString={group.filters} />

				<GroupStats count={groupCounts} />

				{/* Imagen destacada */}
				{group.featuredImage && (
					<div className="space-y-2">
						<h3 className="font-medium text-sm">Imagen destacada</h3>
						<div className="relative h-32 w-full overflow-hidden rounded-md bg-muted">
							<img alt={group.name} className="h-full w-full object-cover" src={group.featuredImage} />
						</div>
					</div>
				)}
			</CardContent>

			<CardFooter className="px-6">
				<div className="text-muted-foreground text-sm">Creado el {formatDate(group.createdAt)}</div>
			</CardFooter>
		</>
	);
}

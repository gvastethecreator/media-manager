import { CardContent, CardFooter } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { Group, GroupCount } from '@/types/entities/group/types';
import { GroupDetails } from './components/group-details';
import { GroupFilters } from './components/group-filters';
import { GroupHeader } from './components/group-header';
import { GroupStats } from './components/group-stats';

interface GroupPreviewProps {
	group: Group & {
		_count?: GroupCount;
	};
	onEdit?: () => void;
	onDelete?: () => void;
	onFavoriteToggle?: () => void;
	isDeleting?: boolean;
}

export function GroupPreview({ group, onEdit, onDelete, onFavoriteToggle, isDeleting = false }: GroupPreviewProps) {
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

				{group._count && <GroupStats count={group._count} />}

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

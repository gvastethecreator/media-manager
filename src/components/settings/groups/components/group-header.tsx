import { EditIcon, StarIcon, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle } from '@/components/ui/card';

interface GroupHeaderProps {
	emoji: string;
	name: string;
	isFavorite?: boolean;
	onEdit?: () => void;
	onDelete?: () => void;
	onFavoriteToggle?: () => void;
	isDeleting?: boolean;
}

export function GroupHeader({
	emoji,
	name,
	isFavorite = false,
	onEdit,
	onDelete,
	onFavoriteToggle,
	isDeleting = false,
}: GroupHeaderProps) {
	return (
		<CardHeader className="px-6 pb-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span aria-label="emoji" className="text-2xl" role="img">
						{emoji}
					</span>
					<div className="flex flex-col">
						<CardTitle className="flex items-center gap-2 font-bold text-xl">
							{name}
							{isFavorite && onFavoriteToggle && (
								<Button
									aria-label="Quitar de favoritos"
									className="h-4 w-4 p-0"
									onClick={onFavoriteToggle}
									size="icon"
									variant="ghost"
								>
									<StarIcon className="h-4 w-4 text-warning" />
								</Button>
							)}
						</CardTitle>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{onEdit && (
						<Button aria-label="Editar grupo" onClick={onEdit} size="icon" variant="ghost">
							<EditIcon className="h-4 w-4" />
						</Button>
					)}
					{onDelete && (
						<Button aria-label="Eliminar grupo" disabled={isDeleting} onClick={onDelete} size="icon" variant="ghost">
							<Trash className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>
		</CardHeader>
	);
}

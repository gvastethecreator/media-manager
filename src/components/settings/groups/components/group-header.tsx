import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { EditIcon, StarIcon, Trash } from 'lucide-react';

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
		<CardHeader className="pb-4 px-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span role="img" aria-label="emoji" className="text-2xl">
						{emoji}
					</span>
					<div className="flex flex-col">
						<CardTitle className="text-xl font-bold flex items-center gap-2">
							{name}
							{isFavorite && onFavoriteToggle && (
								<Button
									variant="ghost"
									size="icon"
									onClick={onFavoriteToggle}
									className="h-4 w-4 p-0"
									title="Favorito"
								>
									<StarIcon className="h-4 w-4 text-yellow-500" />
								</Button>
							)}
						</CardTitle>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{onEdit && (
						<Button
							variant="ghost"
							size="icon"
							onClick={onEdit}
							title="Editar"
						>
							<EditIcon className="h-4 w-4" />
						</Button>
					)}
					{onDelete && (
						<Button
							variant="ghost"
							size="icon"
							onClick={onDelete}
							disabled={isDeleting}
							title="Eliminar"
						>
							<Trash className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>
		</CardHeader>
	);
}
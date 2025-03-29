import { Button } from '@/components/ui/button';
import {
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Group } from '@prisma/client';
import { EditIcon, StarIcon, Trash } from 'lucide-react';

interface GroupPreviewProps {
	group: Group & {
		_count?: {
			images: number;
			videos: number;
			albums: number;
			collections: number;
			tags: number;
			characters: number;
			places: number;
			worldItems: number;
			concepts: number;
			prompts: number;
			notes: number;
			wildcards: number;
			properties: number;
		};
	};
	onEdit?: () => void;
	onDelete?: () => void;
	onFavoriteToggle?: () => void;
	isDeleting?: boolean;
}

export function GroupPreview({
	group,
	onEdit,
	onDelete,
	onFavoriteToggle,
	isDeleting = false,
}: GroupPreviewProps) {
	// Convertir el string JSON de filters a array
	const filters = group.filters !== 'empty_array'
		? JSON.parse(group.filters)
		: [];

	const totalElements = group._count
		? Object.entries(group._count).reduce((a, [_, b]) => a + b, 0)
		: 0;

	return (
		<>
			<CardHeader className="pb-4 px-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span role="img" aria-label="emoji" className="text-2xl">
							{group.emoji}
						</span>
						<div className="flex flex-col">
							<CardTitle className="text-xl font-bold flex items-center gap-2">
								{group.name}
							</CardTitle>
							{group.isFavorite && (
								<StarIcon className="h-4 w-4 text-yellow-500" />
							)}
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={onEdit}
							title="Editar"
						>
							<EditIcon className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={onDelete}
							disabled={isDeleting}
							title="Eliminar"
						>
							<Trash className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-4 px-6">
				{/* Descripción */}
				{group.description && (
					<div className="space-y-2">
						<h3 className="text-sm font-medium">Descripción</h3>
						<p className="text-sm text-muted-foreground">{group.description}</p>
					</div>
				)}

				{/* Categoría */}
				<div className="space-y-2">
					<h3 className="text-sm font-medium">Categoría</h3>
					<p className="text-sm text-muted-foreground">{group.category || 'Sin categoría'}</p>
				</div>

				{/* Atajo */}
				{group.shortcut && (
					<div className="space-y-2">
						<h3 className="text-sm font-medium">Atajo</h3>
						<p className="text-sm text-muted-foreground">{group.shortcut}</p>
					</div>
				)}

				{/* Orden */}
				<div className="space-y-2">
					<h3 className="text-sm font-medium">Ordenamiento</h3>
					<p className="text-sm text-muted-foreground">{group.sortBy || 'Por nombre'}</p>
				</div>

				{/* Color */}
				<div className="space-y-2">
					<h3 className="text-sm font-medium">Color</h3>
					<div className="flex items-center gap-2">
						<div
							className="w-4 h-4 rounded"
							style={{ backgroundColor: group.color }}
						/>
						<span className="text-sm text-muted-foreground">{group.color}</span>
					</div>
				</div>

				{/* Filtros */}
				{filters.length > 0 && (
					<div className="space-y-2">
						<h3 className="text-sm font-medium">Filtros</h3>
						<div className="grid grid-cols-2 gap-2">
							{filters.map((filter: any, index: number) => (
								<div
									key={index}
									className={cn(
										"rounded-md p-2",
										"bg-muted/30",
										"text-sm"
									)}
								>
									{JSON.stringify(filter)}
								</div>
							))}
						</div>
					</div>
				)}

				{/* Estadísticas */}
				{group._count && totalElements > 0 && (
					<div className="space-y-2">
						<h3 className="text-sm font-medium">Estadísticas</h3>
						<div className="grid grid-cols-3 gap-2">
							{Object.entries(group._count)
								.filter(([_, count]) => count > 0)
								.map(([key, count]) => (
									<div
										key={key}
										className={cn(
											"rounded-md p-2",
											"bg-muted/30 hover:bg-muted/50",
											"transition-colors duration-200"
										)}
									>
										<p className="text-xs font-medium capitalize">
											{key.replace(/([A-Z])/g, ' $1').trim()}
										</p>
										<p className="text-lg font-bold">{count}</p>
									</div>
								))}
						</div>
					</div>
				)}

				{/* Imagen destacada */}
				{group.featuredImage && (
					<div className="space-y-2">
						<h3 className="text-sm font-medium">Imagen destacada</h3>
						<div className="relative w-full h-32 bg-muted rounded-md overflow-hidden">
							<img
								src={group.featuredImage}
								alt={group.name}
								className="w-full h-full object-cover"
							/>
						</div>
					</div>
				)}
			</CardContent>

			<CardFooter className="px-6">
				<div className="text-sm text-muted-foreground">
					Creado el {new Date(group.createdAt).toLocaleDateString()}
				</div>
			</CardFooter>
		</>
	);
}
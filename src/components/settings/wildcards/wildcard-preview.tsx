import type { Wildcard } from '@prisma/client';
import { ChevronRight, EditIcon, StarIcon, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WildcardPreviewProps {
	wildcard: Wildcard & {
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
			properties: number;
			childWildcards: number;
		};
		parent?: Wildcard | null;
		childWildcards?: Wildcard[];
	};
	onEdit?: () => void;
	onDelete?: () => void;
	onFavoriteToggle?: () => void;
	isDeleting?: boolean;
}

export function WildcardPreview({
	wildcard,
	onEdit,
	onDelete,
	onFavoriteToggle,
	isDeleting = false,
}: WildcardPreviewProps) {
	// Convertir el string JSON de children a array
	const children = wildcard.children !== 'empty_array' ? JSON.parse(wildcard.children) : [];

	const totalElements = wildcard._count
		? Object.entries(wildcard._count)
				.filter(([key]) => key !== 'childWildcards')
				.reduce((a, [_, b]) => a + b, 0)
		: 0;

	return (
		<>
			<CardHeader className="pb-4 px-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span role="img" aria-label="emoji" className="text-2xl">
							{wildcard.emoji}
						</span>
						<div className="flex flex-col">
							<CardTitle className="text-xl font-bold flex items-center gap-2">
								{wildcard.parent && (
									<>
										<span className="text-sm text-muted-foreground">{wildcard.parent.name}</span>
										<ChevronRight className="h-4 w-4" />
									</>
								)}
								{wildcard.name}
							</CardTitle>
							{wildcard.isFavorite && <StarIcon className="h-4 w-4 text-yellow-500" />}
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="icon" onClick={onEdit} title="Editar">
							<EditIcon className="h-4 w-4" />
						</Button>
						<Button variant="ghost" size="icon" onClick={onDelete} disabled={isDeleting} title="Eliminar">
							<Trash className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-4 px-6">
				{/* Descripción */}
				{wildcard.description && (
					<div className="space-y-2">
						<h3 className="text-sm font-medium">Descripción</h3>
						<p className="text-sm text-muted-foreground">{wildcard.description}</p>
					</div>
				)}

				{/* Categoría */}
				<div className="space-y-2">
					<h3 className="text-sm font-medium">Categoría</h3>
					<p className="text-sm text-muted-foreground">{wildcard.category || 'Sin categoría'}</p>
				</div>

				{/* Atajo */}
				{wildcard.shortcut && (
					<div className="space-y-2">
						<h3 className="text-sm font-medium">Atajo</h3>
						<p className="text-sm text-muted-foreground">{wildcard.shortcut}</p>
					</div>
				)}

				{/* Color */}
				<div className="space-y-2">
					<h3 className="text-sm font-medium">Color</h3>
					<div className="flex items-center gap-2">
						<div className="w-4 h-4 rounded" style={{ backgroundColor: wildcard.color }} />
						<span className="text-sm text-muted-foreground">{wildcard.color}</span>
					</div>
				</div>

				{/* Estructura jerárquica */}
				<div className="space-y-2">
					<h3 className="text-sm font-medium">Estructura</h3>
					<div className="grid grid-cols-2 gap-4">
						<Card className="p-4 bg-muted/50">
							<p className="text-sm font-medium">Hijos directos</p>
							<p className="text-2xl font-bold">{wildcard._count?.childWildcards || 0}</p>
						</Card>
						<Card className="p-4 bg-muted/50">
							<p className="text-sm font-medium">Valores</p>
							<p className="text-2xl font-bold">{children.length}</p>
						</Card>
					</div>

					{/* Lista de hijos */}
					{wildcard.childWildcards && wildcard.childWildcards.length > 0 && (
						<div className="mt-4">
							<h4 className="text-sm font-medium mb-2">Comodines hijos</h4>
							<div className="grid grid-cols-2 gap-2">
								{wildcard.childWildcards.map((child) => (
									<div
										key={child.id}
										className={cn(
											'rounded-md p-2',
											'bg-muted/30 hover:bg-muted/50',
											'transition-colors duration-200',
											'flex items-center gap-2'
										)}
									>
										<span role="img" aria-label="emoji">
											{child.emoji}
										</span>
										<span className="text-sm font-medium">{child.name}</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Lista de valores */}
					{children.length > 0 && (
						<div className="mt-4">
							<h4 className="text-sm font-medium mb-2">Valores</h4>
							<div className="grid grid-cols-2 gap-2">
								{children.map((value: string, index: number) => (
									<div
										key={`value-${wildcard.id}-${value}-${index + 1}`}
										className={cn('rounded-md p-2', 'bg-muted/30', 'text-sm')}
									>
										{value}
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Estadísticas */}
				{wildcard._count && totalElements > 0 && (
					<div className="space-y-2">
						<h3 className="text-sm font-medium">Estadísticas</h3>
						<div className="grid grid-cols-3 gap-2">
							{Object.entries(wildcard._count)
								.filter(([key, count]) => key !== 'childWildcards' && count > 0)
								.map(([key, count]) => (
									<div
										key={key}
										className={cn('rounded-md p-2', 'bg-muted/30 hover:bg-muted/50', 'transition-colors duration-200')}
									>
										<p className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
										<p className="text-lg font-bold">{count}</p>
									</div>
								))}
						</div>
					</div>
				)}

				{/* Imagen destacada */}
				{wildcard.featuredImage && (
					<div className="space-y-2">
						<h3 className="text-sm font-medium">Imagen destacada</h3>
						<div className="relative w-full h-32 bg-muted rounded-md overflow-hidden">
							<img src={wildcard.featuredImage} alt={wildcard.name} className="w-full h-full object-cover" />
						</div>
					</div>
				)}
			</CardContent>

			<CardFooter className="px-6">
				<div className="text-sm text-muted-foreground">
					Creado el {new Date(wildcard.createdAt).toLocaleDateString()}
				</div>
			</CardFooter>
		</>
	);
}

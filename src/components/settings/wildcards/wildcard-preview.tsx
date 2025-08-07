import { ChevronRight, EditIcon, StarIcon, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { WildcardWithStats } from '@/types/entities/wildcard/base';

interface WildcardPreviewProps {
	wildcard: WildcardWithStats & {
		parent?: WildcardWithStats | null;
		childWildcards?: WildcardWithStats[];
	};
	onEdit?: () => void;
	onDelete?: () => void;
	isDeleting?: boolean;
}

export function WildcardPreview({ wildcard, onEdit, onDelete, isDeleting = false }: WildcardPreviewProps) {
	// Convertir el string JSON de children a array
	const children = wildcard.children && wildcard.children !== 'empty_array' ? JSON.parse(wildcard.children) : [];

	const totalElements = wildcard._count
		? Object.entries(wildcard._count)
				.filter(([key]) => key !== 'childWildcards')
				.reduce((a, [_, b]) => a + b, 0)
		: 0;

	return (
		<>
			<CardHeader className="px-6 pb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span aria-label="emoji" className="text-2xl" role="img">
							{wildcard.emoji || '🃏'}
						</span>
						<div className="flex flex-col">
							<CardTitle className="flex items-center gap-2 font-bold text-xl">
								{wildcard.parent && (
									<>
										<span className="text-muted-foreground text-sm">{wildcard.parent.name}</span>
										<ChevronRight className="h-4 w-4" />
									</>
								)}
								{wildcard.name}
							</CardTitle>
							{wildcard.isFavorite && <StarIcon className="h-4 w-4 text-yellow-500" />}
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button onClick={onEdit} size="icon" title="Editar" variant="ghost">
							<EditIcon className="h-4 w-4" />
						</Button>
						<Button disabled={isDeleting} onClick={onDelete} size="icon" title="Eliminar" variant="ghost">
							<Trash className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-4 px-6">
				{/* Descripción */}
				{wildcard.description && (
					<div className="space-y-2">
						<h3 className="font-medium text-sm">Descripción</h3>
						<p className="text-muted-foreground text-sm">{wildcard.description}</p>
					</div>
				)}

				{/* Categoría */}
				<div className="space-y-2">
					<h3 className="font-medium text-sm">Categoría</h3>
					<p className="text-muted-foreground text-sm">{wildcard.category || 'Sin categoría'}</p>
				</div>

				{/* Atajo */}
				{wildcard.shortcut && (
					<div className="space-y-2">
						<h3 className="font-medium text-sm">Atajo</h3>
						<p className="text-muted-foreground text-sm">{wildcard.shortcut}</p>
					</div>
				)}

				{/* Color */}
				<div className="space-y-2">
					<h3 className="font-medium text-sm">Color</h3>
					<div className="flex items-center gap-2">
						<div className="h-4 w-4 rounded" style={{ backgroundColor: wildcard.color || '#3b82f6' }} />
						<span className="text-muted-foreground text-sm">{wildcard.color || '#3b82f6'}</span>
					</div>
				</div>

				{/* Estructura jerárquica */}
				<div className="space-y-2">
					<h3 className="font-medium text-sm">Estructura</h3>
					<div className="grid grid-cols-2 gap-4">
						<Card className="bg-muted/50 p-4">
							<p className="font-medium text-sm">Hijos directos</p>
							<p className="font-bold text-2xl">{wildcard.childWildcards?.length || 0}</p>
						</Card>
						<Card className="bg-muted/50 p-4">
							<p className="font-medium text-sm">Valores</p>
							<p className="font-bold text-2xl">{children.length}</p>
						</Card>
					</div>

					{/* Lista de hijos */}
					{wildcard.childWildcards && wildcard.childWildcards.length > 0 && (
						<div className="mt-4">
							<h4 className="mb-2 font-medium text-sm">Comodines hijos</h4>
							<div className="grid grid-cols-2 gap-2">
								{wildcard.childWildcards.map((child) => (
									<div
										className={cn(
											'rounded-md p-2',
											'bg-muted/30 hover:bg-muted/50',
											'transition-colors duration-200',
											'flex items-center gap-2'
										)}
										key={child.id}
									>
										<span aria-label="emoji" role="img">
											{child.emoji || '🃏'}
										</span>
										<span className="font-medium text-sm">{child.name}</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Lista de valores */}
					{children.length > 0 && (
						<div className="mt-4">
							<h4 className="mb-2 font-medium text-sm">Valores</h4>
							<div className="grid grid-cols-2 gap-2">
								{children.map((value: string, index: number) => (
									<div
										className={cn('rounded-md p-2', 'bg-muted/30', 'text-sm')}
										key={`value-${wildcard.id}-${value}-${index + 1}`}
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
						<h3 className="font-medium text-sm">Estadísticas</h3>
						<div className="grid grid-cols-3 gap-2">
							{Object.entries(wildcard._count)
								.filter(([key, count]) => key !== 'childWildcards' && count > 0)
								.map(([key, count]) => (
									<div
										className={cn('rounded-md p-2', 'bg-muted/30 hover:bg-muted/50', 'transition-colors duration-200')}
										key={key}
									>
										<p className="font-medium text-xs capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
										<p className="font-bold text-lg">{count}</p>
									</div>
								))}
						</div>
					</div>
				)}

				{/* Imagen destacada */}
				{wildcard.featuredImage && (
					<div className="space-y-2">
						<h3 className="font-medium text-sm">Imagen destacada</h3>
						<div className="relative h-32 w-full overflow-hidden rounded-md bg-muted">
							<img alt={wildcard.name} className="h-full w-full object-cover" src={wildcard.featuredImage} />
						</div>
					</div>
				)}
			</CardContent>

			<CardFooter className="px-6">
				<div className="text-muted-foreground text-sm">
					Creado el {new Date(wildcard.createdAt).toLocaleDateString()}
				</div>
			</CardFooter>
		</>
	);
}

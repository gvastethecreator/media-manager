import { PencilIcon, StarIcon, TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_NEUTRAL_COLOR } from '@/lib/styles/color-tokens';
import type { PropertyWithStats } from '@/types/entities/property';

interface PropertyPreviewProps {
	property: PropertyWithStats;
	onEdit: () => void;
	onDelete: () => void;
	onFavoriteToggle: () => void;
	onContinue: () => void;
	isDeleting: boolean;
}

export function PropertyPreview({
	property,
	onEdit,
	onDelete,
	onFavoriteToggle,
	onContinue,
	isDeleting,
}: PropertyPreviewProps) {
	return (
		<>
			<CardHeader className="px-6 pb-4">
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2 font-bold text-xl">
						<span aria-label="emoji" role="img" title={property.name}>
							{property.emoji}
						</span>
						{property.name}
					</CardTitle>
					<div className="flex items-center gap-2">
						<Button
							onClick={onFavoriteToggle}
							size="icon"
							title={property.isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
							variant="ghost"
						>
							<StarIcon
								className={`h-4 w-4 ${property.isFavorite ? 'fill-[color:var(--entity-favorite)] text-[color:var(--entity-favorite)]' : ''}`}
							/>
						</Button>
						<Button onClick={onEdit} size="icon" title="Editar propiedad" variant="ghost">
							<PencilIcon className="h-4 w-4" />
						</Button>
						<Button disabled={isDeleting} onClick={onDelete} size="icon" title="Eliminar propiedad" variant="ghost">
							<TrashIcon className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardHeader>

			<CardContent className="px-6">
				<div className="space-y-6">
					{property.description && <p className="text-muted-foreground text-sm">{property.description}</p>}

					<div className="grid grid-cols-2 gap-4">
						<div>
							<h4 className="mb-2 font-medium text-sm">Detalles</h4>
							<dl className="space-y-2 text-sm">
								<div className="flex justify-between">
									<dt className="text-muted-foreground">Categoría</dt>
									<dd className="font-medium">{property.category}</dd>
								</div>
								<div className="flex justify-between">
									<dt className="text-muted-foreground">Color</dt>
									<dd className="font-medium">
										<div className="flex items-center gap-2">
											<div
												className="h-4 w-4 rounded-full"
												style={{ backgroundColor: property.color || DEFAULT_NEUTRAL_COLOR }}
											/>
											{property.color || DEFAULT_NEUTRAL_COLOR}
										</div>
									</dd>
								</div>
								{property.shortcut && (
									<div className="flex justify-between">
										<dt className="text-muted-foreground">Atajo</dt>
										<dd className="font-medium">{property.shortcut}</dd>
									</div>
								)}
							</dl>
						</div>

						<div>
							<h4 className="mb-2 font-medium text-sm">Elementos asociados</h4>
							<dl className="space-y-2 text-sm">
								{property._count &&
									Object.entries(property._count as Record<string, number>).map(
										([key, count]) =>
											typeof count === 'number' &&
											count > 0 && (
												<div className="flex justify-between" key={key}>
													<dt className="text-muted-foreground capitalize">
														{key.replace(/([A-Z])/g, ' $1').toLowerCase()}
													</dt>
													<dd className="font-medium">{count}</dd>
												</div>
											)
									)}
							</dl>
						</div>
					</div>
				</div>

				<div className="mt-8 flex justify-end">
					<Button onClick={onContinue} variant="secondary">
						Continuar
					</Button>
				</div>
			</CardContent>
		</>
	);
}

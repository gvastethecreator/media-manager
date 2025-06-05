'use client';

import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PencilIcon, StarIcon, TrashIcon } from 'lucide-react';
import type { PropertyWithStats } from './properties-settings';

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
			<CardHeader className="pb-4 px-6">
				<div className="flex items-center justify-between">
					<CardTitle className="text-xl font-bold flex items-center gap-2">
						<span role="img" aria-label="emoji">
							{property.emoji}
						</span>
						{property.name}
					</CardTitle>
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={onFavoriteToggle}
							title={property.isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
						>
							<StarIcon className={`h-4 w-4 ${property.isFavorite ? 'text-yellow-500 fill-yellow-500' : ''}`} />
						</Button>
						<Button variant="ghost" size="icon" onClick={onEdit} title="Editar propiedad">
							<PencilIcon className="h-4 w-4" />
						</Button>
						<Button variant="ghost" size="icon" onClick={onDelete} disabled={isDeleting} title="Eliminar propiedad">
							<TrashIcon className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardHeader>

			<CardContent className="px-6">
				<div className="space-y-6">
					{property.description && <p className="text-sm text-muted-foreground">{property.description}</p>}

					<div className="grid grid-cols-2 gap-4">
						<div>
							<h4 className="text-sm font-medium mb-2">Detalles</h4>
							<dl className="space-y-2 text-sm">
								<div className="flex justify-between">
									<dt className="text-muted-foreground">Categoría</dt>
									<dd className="font-medium">{property.category}</dd>
								</div>
								<div className="flex justify-between">
									<dt className="text-muted-foreground">Color</dt>
									<dd className="font-medium">
										<div className="flex items-center gap-2">
											<div className="w-4 h-4 rounded-full" style={{ backgroundColor: property.color }} />
											{property.color}
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
							<h4 className="text-sm font-medium mb-2">Elementos asociados</h4>
							<dl className="space-y-2 text-sm">
								{Object.entries(property._count).map(
									([key, count]) =>
										count > 0 && (
											<div key={key} className="flex justify-between">
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

				<div className="flex justify-end mt-8">
					<Button variant="secondary" onClick={onContinue}>
						Continuar
					</Button>
				</div>
			</CardContent>
		</>
	);
}

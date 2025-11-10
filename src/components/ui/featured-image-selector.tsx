/**
 * @file Selector de imagen destacada para entidades
 * @module components/ui/featured-image-selector
 * @description Componente reutilizable para seleccionar/actualizar featured image
 */

import { Check, Image as ImageIcon, X } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface FeaturedImageSelectorProps {
	/** URL de la imagen destacada actual */
	currentFeaturedImage?: string | null;
	/** IDs de imágenes asociadas a la entidad */
	imageIds?: string[];
	/** Imágenes disponibles para seleccionar */
	images?: Array<{
		id: string;
		name: string;
		thumbnailUrl?: string | null;
		path?: string;
	}>;
	/** Callback cuando se selecciona una nueva imagen */
	onSelect: (imageId: string | null) => void;
	/** Si el selector está deshabilitado */
	disabled?: boolean;
	/** Clase CSS adicional */
	className?: string;
}

/**
 * Componente para seleccionar una imagen destacada de las asociadas a una entidad
 */
export function FeaturedImageSelector({
	currentFeaturedImage,
	imageIds = [],
	images = [],
	onSelect,
	disabled = false,
	className,
}: FeaturedImageSelectorProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

	// Filtrar solo las imágenes que están asociadas
	const availableImages = images.filter((img) => imageIds.includes(img.id));

	const handleSelect = (imageId: string) => {
		setSelectedImageId(imageId);
	};

	const handleConfirm = () => {
		if (selectedImageId) {
			onSelect(selectedImageId);
			setIsOpen(false);
		}
	};

	const handleRemove = () => {
		onSelect(null);
		setSelectedImageId(null);
	};

	return (
		<div className={cn('space-y-2', className)}>
			<Label>Imagen Destacada</Label>

			{/* Vista previa actual */}
			<div className="flex items-center gap-3">
				{currentFeaturedImage ? (
					<div className="relative group">
						<img
							alt="Featured"
							className="h-24 w-24 rounded-lg border-2 border-primary object-cover"
							src={currentFeaturedImage}
						/>
						<button
							className={cn(
								'absolute -right-2 -top-2 rounded-full bg-destructive p-1',
								'opacity-0 group-hover:opacity-100 transition-opacity',
								'hover:bg-destructive/90'
							)}
							disabled={disabled}
							onClick={handleRemove}
							type="button"
						>
							<X className="h-3 w-3 text-white" />
						</button>
					</div>
				) : (
					<div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
						<ImageIcon className="h-8 w-8 text-gray-400" />
					</div>
				)}

				<div className="flex-1">
					<Button
						disabled={disabled || availableImages.length === 0}
						onClick={() => setIsOpen(true)}
						type="button"
						variant="outline"
					>
						{currentFeaturedImage ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
					</Button>
					{availableImages.length === 0 && (
						<p className="mt-1 text-muted-foreground text-xs">No hay imágenes asociadas disponibles</p>
					)}
				</div>
			</div>

			{/* Modal de selección */}
			<Dialog onOpenChange={setIsOpen} open={isOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Seleccionar Imagen Destacada</DialogTitle>
						<DialogDescription>Elige una imagen de las asociadas a esta entidad</DialogDescription>
					</DialogHeader>

					<ScrollArea className="max-h-[400px] pr-4">
						<div className="grid grid-cols-3 gap-3">
							{availableImages.map((image) => {
								const imageUrl = image.thumbnailUrl || image.path || `/api/images/${image.id}/thumbnail`;
								const isSelected = selectedImageId === image.id;

								return (
									<button
										className={cn(
											'relative aspect-square overflow-hidden rounded-lg border-2 transition-all',
											isSelected
												? 'border-primary ring-2 ring-primary ring-offset-2'
												: 'border-transparent hover:border-gray-300'
										)}
										key={image.id}
										onClick={() => handleSelect(image.id)}
										type="button"
									>
										<img
											alt={image.name}
											className="h-full w-full object-cover"
											loading="lazy"
											src={imageUrl}
										/>

										{/* Indicador de selección */}
										{isSelected && (
											<div className="absolute inset-0 flex items-center justify-center bg-primary/20">
												<div className="rounded-full bg-primary p-1">
													<Check className="h-4 w-4 text-white" />
												</div>
											</div>
										)}

										{/* Nombre en hover */}
										<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
											<p className="truncate text-white text-xs" title={image.name}>
												{image.name}
											</p>
										</div>
									</button>
								);
							})}
						</div>
					</ScrollArea>

					<div className="flex justify-end gap-2">
						<Button onClick={() => setIsOpen(false)} type="button" variant="outline">
							Cancelar
						</Button>
						<Button disabled={!selectedImageId} onClick={handleConfirm} type="button">
							Confirmar Selección
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

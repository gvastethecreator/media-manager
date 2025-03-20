'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Edit, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import type * as React from 'react';
import { useEffect, useState } from 'react';
import { ImageGrid, type ImageGridImage } from './layouts/refactored/base/image-grid';
import type { CardOptions } from './types/unified-card-types';

export interface EntityCardContentProps {
	// Contenido básico
	title?: string;
	description?: string;

	// Props para imágenes
	image?: string;
	images?: ImageGridImage[];
	imageLayout?: 'single' | 'dual' | 'quad' | 'six'; // Tipos correspondientes a layouts/image-grid.tsx
	imageStyle?: 'standard' | 'polaroid' | 'rounded' | 'bordered'; // Tipos correspondientes a layouts/image-grid.tsx
	options?: CardOptions;

	// Props opcionales
	className?: string;
	children?: React.ReactNode;
	entityId?: string;
	onEdit?: () => void;
	onDelete?: () => void;
	icon?: React.ReactNode;
	badges?: {
		key: string;
		label: React.ReactNode;
		variant?: 'default' | 'secondary' | 'outline';
	}[];
	isPreview?: boolean;
}

/**
 * Componente para renderizar el contenido principal de una EntityCard
 * 🔍 Este componente separa la lógica de presentación del contenido
 * de la lógica estructural y de efectos de la tarjeta
 */
export function EntityCardContent({
	title,
	description,
	image,
	images = [],
	imageLayout = 'single',
	imageStyle = 'standard',
	options = {},
	className,
	children,
	entityId,
	onEdit,
	onDelete,
	icon,
	badges = [],
	isPreview = false,
}: EntityCardContentProps) {
	const [isLoaded, setIsLoaded] = useState(false);

	// Determinar si se debe mostrar el título, descripción, etc.
	const showTitle = options.showTitle !== false;
	const showDescription = options.showDescription !== false;
	const showImage = options.showImage !== false;
	const showImageCount = options.showImageCount === true;

	// Preparamos un array de strings para cuando solo tenemos URLs
	let stringImages: string[] = [];

	// Si hay una imagen principal como string, la usamos
	if (image) {
		stringImages = [image];
	}

	// Efecto para animación de carga
	useEffect(() => {
		const timer = setTimeout(() => {
			setIsLoaded(true);
		}, 100);
		return () => clearTimeout(timer);
	}, []);

	// Si hay children, renderizarlos directamente
	if (children) {
		return <div className={cn('entity-card-content w-full h-full', className)}>{children}</div>;
	}

	// Determinar si mostrar imágenes
	const hasImage = image || images.length > 0;

	return (
		<div className={cn('entity-card-content w-full h-full flex flex-col', className)}>
			{/* Título */}
			{title && showTitle && (
				<div className="entity-card-title-container p-3">
					<h3 className="entity-card-title text-lg font-semibold">{title}</h3>
				</div>
			)}

			{/* Imágenes */}
			{hasImage && showImage && (
				<div className="entity-card-image-container flex-1">
					{imageLayout === 'single' && image && (
						<div className="entity-card-image relative w-full h-full">
							<Image
								src={image}
								alt={title || 'Imagen'}
								fill
								className="object-cover"
								sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
							/>
						</div>
					)}

					{(imageLayout !== 'single' || images.length > 0) && (
						<ImageGrid
							images={images.length > 0 ? images : stringImages}
							layout={imageLayout}
							style={imageStyle}
							className="w-full h-full"
						/>
					)}
				</div>
			)}

			{/* Descripción */}
			{description && showDescription && (
				<div className="entity-card-description-container p-3">
					<p className="entity-card-description text-sm">{description}</p>
				</div>
			)}

			{/* Etiquetas */}
			{badges && badges.length > 0 && (
				<div className="flex flex-wrap gap-1 mb-2">
					{badges.map((badge) => (
						<Badge key={badge.key} variant={badge.variant || 'secondary'} className="text-xs">
							{badge.label}
						</Badge>
					))}
				</div>
			)}

			{/* Acciones */}
			{!isPreview && (onEdit || onDelete) && (
				<div className="mt-auto pt-3 flex justify-end gap-2">
					{onEdit && (
						<motion.button
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.95 }}
							onClick={(e) => {
								e.stopPropagation();
								onEdit();
							}}
							className="rounded-full bg-[--black]/10 p-1.5 text-[--muted-foreground] transition-colors hover:bg-[--background] hover:text-[--foreground]"
							aria-label="Editar"
						>
							<Edit className="h-3.5 w-3.5" />
						</motion.button>
					)}
					{onDelete && (
						<motion.button
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.95 }}
							onClick={(e) => {
								e.stopPropagation();
								onDelete();
							}}
							className="rounded-full bg-[--black]/10 p-1.5 text-[--muted-foreground] transition-colors hover:bg-[--destructive] hover:text-[--destructive-foreground]"
							aria-label="Eliminar"
						>
							<Trash2 className="h-3.5 w-3.5" />
						</motion.button>
					)}
				</div>
			)}
		</div>
	);
}

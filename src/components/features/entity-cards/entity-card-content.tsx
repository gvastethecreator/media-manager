'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Edit, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useEffect, useState } from 'react';
import type { ImageGridImage } from './layouts/image-grid';
import { ImageGrid } from './layouts/image-grid';
import type { CardOptions } from './types/unified-card-types';

export interface EntityCardContentProps {
	// Contenido básico
	title?: string;
	description?: string;

	// Props para imágenes
	image?: string;
	images?: ImageGridImage[];
	imageLayout?: 'single' | 'dual' | 'triple' | 'quad' | 'six';
	imageStyle?: 'standard' | 'masonry' | 'carousel' | 'polaroid' | 'overlap';
	options?: Partial<CardOptions>;

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

	// Preparar imágenes para el grid
	const gridImages: ImageGridImage[] = [];

	// Si hay una imagen principal, añadirla primero
	if (image) {
		gridImages.push({ src: image, alt: title || 'Imagen principal' });
	}

	// Añadir el resto de imágenes
	if (images && images.length > 0) {
		gridImages.push(...images);
	}

	// Efecto para animación de carga
	useEffect(() => {
		const timer = setTimeout(() => {
			setIsLoaded(true);
		}, 100);
		return () => clearTimeout(timer);
	}, []);

	return (
		<div className={cn('relative z-10 flex flex-col h-full', className)}>
			{/* Cabecera con título e ícono */}
			<div className="flex items-center gap-2 mb-2">
				{icon && <div className="flex-shrink-0">{icon}</div>}
				<div className="flex-grow min-w-0">
					<h3 className="text-lg font-semibold truncate">{title}</h3>
				</div>
			</div>

			{/* Imagen si existe */}
			{showImage && gridImages.length > 0 && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: isLoaded ? 1 : 0 }}
					transition={{ duration: 0.3 }}
					className="entity-card-image-container"
				>
					<ImageGrid
						images={gridImages}
						layout={imageLayout}
						style={imageStyle}
						showCount={showImageCount}
						aspectRatio={options.imageGridAspectRatio || options.imageGrid?.aspectRatio || '1:1'}
						gap={options.imageGridGap || options.imageGrid?.gap || 4}
					/>
				</motion.div>
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

			{/* Contenido de texto */}
			<div className="entity-card-text-content">
				{/* Título */}
				{showTitle && title && (
					<motion.h3
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 5 }}
						transition={{ duration: 0.3, delay: 0.1 }}
						className="entity-card-title"
					>
						{title}
					</motion.h3>
				)}

				{/* Descripción */}
				{showDescription && description && (
					<motion.p
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 5 }}
						transition={{ duration: 0.3, delay: 0.2 }}
						className="entity-card-description"
					>
						{description}
					</motion.p>
				)}

				{/* Contenido adicional */}
				{children && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: isLoaded ? 1 : 0 }}
						transition={{ duration: 0.3, delay: 0.3 }}
						className="entity-card-children"
					>
						{children}
					</motion.div>
				)}
			</div>

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

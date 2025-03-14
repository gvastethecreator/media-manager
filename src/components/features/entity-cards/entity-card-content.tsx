'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Edit, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import * as React from 'react';
import type { ImageGridImage } from './layouts/image-grid';
import { ImageGrid } from './layouts/image-grid';
import type { CardOptions } from './types/card-settings-types';

export interface EntityCardContentProps {
	// Contenido básico
	title?: React.ReactNode;
	description?: React.ReactNode;

	// Props para imágenes
	image?: string | null;
	images?: ImageGridImage[];
	imageLayout?: 'single' | 'dual' | 'quad' | 'six' | 'grid' | 'carousel' | 'none';
	imageStyle?: 'standard' | 'polaroid' | 'rounded' | 'bordered' | 'framed';
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
		variant?: 'default' | 'secondary' | 'destructive' | 'outline';
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
	// Procesar imágenes para el grid
	const hasImageGrid = images && images.length > 0;
	const hasSimpleImage = typeof image === 'string' && image.length > 0;
	const hasImage = image || (images && images.length > 0);

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
			{hasImage && imageLayout !== 'none' && (
				<div className="relative aspect-video rounded-md overflow-hidden mb-3">
					{hasSimpleImage && (
						<Image
							src={image as string}
							alt={typeof title === 'string' ? title : 'Entity image'}
							fill
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
							className={cn('object-cover', {
								'border border-[--border] p-1': imageStyle === 'bordered',
								'border-4 border-[--background] shadow-md': imageStyle === 'polaroid',
								'border border-[--border] p-2 shadow-md': imageStyle === 'framed',
							})}
						/>
					)}

					{/* Grid de imágenes si existe */}
					{hasImageGrid && (
						<div className="absolute inset-0">
							<ImageGrid images={images} layout={imageLayout} style={imageStyle} />
						</div>
					)}
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

			{/* Descripción */}
			{description && <p className="text-sm text-[--muted-foreground] line-clamp-3 mb-3">{description}</p>}

			{/* Contenido personalizado */}
			{children}

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

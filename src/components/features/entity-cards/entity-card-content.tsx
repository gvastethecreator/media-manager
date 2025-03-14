'use client';

import { cn } from '@/lib/utils';
import type React from 'react';
import type { ImageGridImage, ImageGridLayout, ImageGridStyle } from './modules/image-grid';
import { ImageGrid } from './modules/image-grid';
import type { CardOptions } from './types/card-settings-types';

export interface EntityCardContentProps {
	// Contenido básico
	title?: string;
	description?: string;

	// Props para imágenes
	image?: string | ImageGridImage[];
	imageLayout?: ImageGridLayout;
	imageStyle?: ImageGridStyle;
	options?: CardOptions;

	// Props opcionales
	className?: string;
	children?: React.ReactNode;
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
	imageLayout = 'single',
	imageStyle = 'standard',
	options = {},
	className,
	children,
}: EntityCardContentProps) {
	// Procesar imágenes para el grid
	const imageGridContent = Array.isArray(image)
		? image
		: image
			? [{ src: image, alt: title || 'Entity card image' }]
			: [];

	return (
		<div className={cn('entity-card-content', className)}>
			{/* Grid de imágenes */}
			{imageGridContent.length > 0 && (
				<ImageGrid images={imageGridContent} layout={imageLayout} style={imageStyle} options={options.imageGrid} />
			)}

			{/* Título y descripción */}
			{(title || description) && (
				<div className="entity-card-text">
					{title && <h3 className="entity-card-title">{title}</h3>}
					{description && <p className="entity-card-description">{description}</p>}
				</div>
			)}

			{/* Contenido personalizado */}
			{children}
		</div>
	);
}

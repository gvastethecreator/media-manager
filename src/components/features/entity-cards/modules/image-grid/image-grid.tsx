'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ImageOff, Images, Plus } from 'lucide-react';
import type * as React from 'react';
import { useEffect, useState } from 'react';

// Tipos de layouts disponibles para el grid de imágenes
export type ImageGridLayout = 'single' | 'dual' | 'triple' | 'quad' | 'six';

// Estilos de grid disponibles
export type ImageGridStyle = 'standard' | 'masonry' | 'carousel' | 'polaroid' | 'overlap';

// Tipos de interfaz
export interface ImageGridImage {
	id: string;
	src: string;
	alt?: string;
	width?: number;
	height?: number;
	aspectRatio?: string;
	blurDataUrl?: string;
}

export interface ImageGridProps {
	images: ImageGridImage[];
	layout?: ImageGridLayout;
	style?: ImageGridStyle;
	gap?: number;
	className?: string;
	aspectRatio?: string;
	fallbackImage?: string;
	showCount?: boolean;
	totalCount?: number;
	onImageClick?: (image: ImageGridImage) => void;
	animated?: boolean;
	loading?: 'eager' | 'lazy';
}

export const defaultImages: ImageGridImage[] = [
	{
		id: 'placeholder-1',
		src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YxZjVmOSIvPjxwYXRoIGQ9Ik02MCw0MCBMNjAsNjAgTDQwLDYwIEw0MCw0MCBaIiBmaWxsPSIjOTRhM2I4Ii8+PHBhdGggZD0iTTQwLDQwIEw0MCw4MCBMODAsODAgTDgwLDQwIFoiIGZpbGw9IiM0NzU1NjkiLz48cGF0aCBkPSJNMTIwLDEyMCBMMTIwLDE0MCBMMTQwLDE0MCBMMTQWLDI0MCBMMTQwLDEyMCBaIiBmaWxsPSIjOTRhM2I4Ii8+PHBhdGggZD0iTTEyMCwxNDAgTDEyMCwxODAgTDE2MCwxODAgTDE2MCwxNDAgWiIgZmlsbD0iIzQ3NTU2OSIvPjwvc3ZnPg==',
		alt: 'Imagen de muestra',
	},
];

export const ImageGrid: React.FC<ImageGridProps> = ({
	images = defaultImages,
	layout = 'single',
	style = 'standard',
	gap = 4,
	className,
	aspectRatio = '16/9',
	fallbackImage,
	showCount = false,
	totalCount,
	onImageClick,
	animated = true,
	loading = 'lazy',
}) => {
	// Estado para controlar las imágenes cargadas y errores
	const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
	const [errorImages, setErrorImages] = useState<Record<string, boolean>>({});

	// Manejar clic en imagen
	const handleImageClick = (image: ImageGridImage) => {
		if (onImageClick) {
			onImageClick(image);
		}
	};

	// Determinar cuántas imágenes mostrar según el layout
	const getMaxImagesToShow = (layout: ImageGridLayout): number => {
		switch (layout) {
			case 'single':
				return 1;
			case 'dual':
				return 2;
			case 'triple':
				return 3;
			case 'quad':
				return 4;
			case 'six':
				return 6;
			default:
				return 1;
		}
	};

	// Obtener el número correcto de imágenes a mostrar
	const maxImages = getMaxImagesToShow(layout);
	const displayImages = images.slice(0, maxImages);
	const remainingCount = Math.max(0, (totalCount || images.length) - maxImages);

	// Restablecer estado cuando cambian las imágenes
	useEffect(() => {
		setLoadedImages({});
		setErrorImages({});
	}, []);

	// Manejar imagen cargada
	const handleImageLoad = (id: string) => {
		setLoadedImages((prev) => ({
			...prev,
			[id]: true,
		}));
	};

	// Manejar error de carga de imagen
	const handleImageError = (id: string) => {
		setErrorImages((prev) => ({
			...prev,
			[id]: true,
		}));
	};

	// Determinar las clases CSS según el layout y estilo
	const gridClasses = {
		single: 'grid-cols-1',
		dual: 'grid-cols-2',
		triple: 'grid-cols-3',
		quad: 'grid-cols-2 grid-rows-2',
		six: 'grid-cols-3 grid-rows-2',
	};

	// Diferentes estilos de grid
	const styleClasses = {
		standard: 'grid',
		masonry: 'columns-2 md:columns-3',
		carousel: 'flex overflow-x-auto snap-x',
		polaroid: 'grid rotate-2',
		overlap: 'relative',
	};

	// Clases de imagen según el estilo
	const imageClasses = {
		standard: 'object-cover w-full h-full',
		masonry: 'break-inside-avoid mb-4 w-full',
		carousel: 'flex-shrink-0 snap-center w-full h-full',
		polaroid: 'object-cover w-full h-full shadow-md p-1 bg-white rotate-1',
		overlap: 'object-cover absolute',
	};

	return (
		<div
			className={cn(
				'image-grid overflow-hidden rounded-md relative',
				styleClasses[style],
				style === 'standard' && gridClasses[layout],
				className
			)}
			style={{ gap: `${gap}px` }}
		>
			{displayImages.length > 0 ? (
				displayImages.map((image, index) => {
					// Definir estilos específicos para overlap
					const overlapStyles: React.CSSProperties =
						style === 'overlap'
							? {
								top: `${index * 10}px`,
								left: `${index * 10}px`,
								zIndex: displayImages.length - index,
								width: '100%',
								height: '100%',
								transform: `rotate(${(index % 2 === 0 ? 1 : -1) * (index + 1)}deg)`,
							}
							: {};

					// Definir estilos para carousel
					const carouselStyles: React.CSSProperties =
						style === 'carousel'
							? {
								minWidth: '85%',
								scrollSnapAlign: 'center',
							}
							: {};

					// Combinar estilos
					const combinedStyles = {
						...overlapStyles,
						...carouselStyles,
						aspectRatio: image.aspectRatio || aspectRatio,
					};

					return (
						<div
							key={image.id}
							className={cn(
								'image-container relative overflow-hidden transition-transform',
								animated && 'duration-300 hover:scale-105',
								style === 'polaroid' && 'p-2 bg-white shadow-md',
								errorImages[image.id] && 'bg-muted'
							)}
							style={combinedStyles}
							onClick={() => handleImageClick(image)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									handleImageClick(image);
								}
							}}
							tabIndex={0}
							role="button"
							aria-label={`Ver imagen ${image.alt || ''}`}
						>
							{errorImages[image.id] ? (
								<div className="flex h-full w-full items-center justify-center bg-muted/50">
									<ImageOff className="h-8 w-8 text-muted-foreground/50" />
								</div>
							) : (
								<>
									<img
										src={image.src}
										alt={image.alt || 'Image'}
										width={image.width}
										height={image.height}
										onLoad={() => handleImageLoad(image.id)}
										onError={() => handleImageError(image.id)}
										className={cn(
											'transition-opacity',
											imageClasses[style],
											loadedImages[image.id] ? 'opacity-100' : 'opacity-0'
										)}
										loading={loading}
									/>
									{!loadedImages[image.id] && (
										<div className="absolute inset-0 flex items-center justify-center bg-muted/50">
											<div className="h-8 w-8 animate-pulse rounded-full bg-muted-foreground/20" />
										</div>
									)}
								</>
							)}
						</div>
					);
				})
			) : (
				<div
					className="flex h-full w-full items-center justify-center bg-muted/30 min-h-[120px]"
					style={{ aspectRatio }}
				>
					<div className="flex flex-col items-center justify-center text-muted-foreground">
						<Images className="h-10 w-10 mb-2 opacity-20" />
						<span className="text-xs">Sin imágenes</span>
					</div>
				</div>
			)}

			{/* Indicador de imágenes adicionales */}
			{showCount && remainingCount > 0 && (
				<Badge className="absolute bottom-2 right-2 z-10 bg-background/80 backdrop-blur-sm" variant="outline">
					<Plus className="h-3 w-3 mr-1" />
					{remainingCount} más
				</Badge>
			)}
		</div>
	);
};

// Componente para mostrar una cuadrícula vacía con un mensaje personalizado
export const EmptyImageGrid: React.FC<{
	message?: string;
	aspectRatio?: string;
	className?: string;
}> = ({ message = 'Sin imágenes', aspectRatio = '16/9', className }) => {
	return (
		<div
			className={cn('flex h-full w-full items-center justify-center bg-muted/30 rounded-md', className)}
			style={{ aspectRatio }}
		>
			<div className="flex flex-col items-center justify-center text-muted-foreground">
				<Images className="h-10 w-10 mb-2 opacity-20" />
				<span className="text-xs">{message}</span>
			</div>
		</div>
	);
};

"use client";

import type { RandomImage } from "@/app/actions/images/images-random.action";
import * as thumbnailActions from "@/app/actions/thumbnails/thumbnails.actions";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbnailQuality } from "@/lib/config/thumbnail.config";
import { cn } from "@/lib/utils";
import { AlertCircle, Image as ImageIcon } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import * as React from "react";

export interface ImageGridImage {
	id: string;
	path?: string;
	thumbnail?: string | null;
	alt?: string;
	width?: number;
	height?: number;
}

export interface ImageGridProps {
	images: ImageGridImage[] | string[];
	className?: string;
	layout?: 'single' | 'dual' | 'quad' | 'six';
	loading?: boolean;
	style?: 'standard' | 'polaroid' | 'rounded' | 'bordered';
	gap?: number;
	aspectRatio?: string;
	onClick?: (image: ImageGridImage | string, index: number) => void;
}

/**
 * Grid de imágenes para mostrar vistas previas
 *
 * @param {ImageGridProps} props - Propiedades del componente
 * @returns {JSX.Element} - Componente de grid de imágenes
 */
export function ImageGrid({
	images,
	className,
	layout = 'quad',
	loading = false,
	style = 'standard',
	gap = 4,
	aspectRatio = '1:1',
	onClick,
}: ImageGridProps) {
	// Normalizar las imágenes al formato esperado
	const normalizedImages: ImageGridImage[] = React.useMemo(() => {
		// Si las imágenes son strings, convertirlas al formato ImageGridImage
		if (images.length > 0 && typeof images[0] === 'string') {
			return (images as string[]).map((img, index) => ({
				id: `image-${index}`,
				path: img,
				thumbnail: img,
				alt: `Image ${index + 1}`,
			}));
		}
		// Si ya son ImageGridImage, simplemente devolverlas
		return images as ImageGridImage[];
	}, [images]);

	// Determinar el número de imágenes a mostrar según el layout
	const imagesToShow =
		layout === 'single' ? 1 :
		layout === 'dual' ? 2 :
		layout === 'quad' ? 4 : 6;

	// Crear array de imágenes con placeholders si es necesario
	const displayImages = React.useMemo(() => {
		// Si estamos cargando, devolver placeholders
		if (loading) {
			return Array(imagesToShow).fill(null);
		}

		// Si no hay suficientes imágenes, rellenar con placeholders
		const result = [...normalizedImages];
		while (result.length < imagesToShow) {
			result.push({
				id: `placeholder-${result.length}`,
				thumbnail: null,
			});
		}

		// Devolver solo las imágenes que necesitamos mostrar
		return result.slice(0, imagesToShow);
	}, [normalizedImages, imagesToShow, loading]);

	// Determinar las clases CSS para el contenedor según el layout
	const containerClasses = {
		single: 'grid-cols-1',
		dual: 'grid-cols-2',
		quad: 'grid-cols-2 grid-rows-2',
		six: 'grid-cols-3 grid-rows-2',
	};

	// Determinar las clases CSS para los items según el estilo
	const itemClasses = {
		standard: 'overflow-hidden bg-card/40',
		polaroid: 'overflow-hidden bg-white p-1 pb-3 shadow-md',
		rounded: 'overflow-hidden rounded-md bg-card/40',
		bordered: 'overflow-hidden border border-border bg-card/40',
	};

	// Función para renderizar una imagen
	const renderImage = (image: ImageGridImage | null, index: number) => {
		if (!image) {
			// Placeholder para loading o no hay imagen
			return (
				<div className="flex h-full w-full items-center justify-center bg-muted/50">
					{loading ? (
						<Skeleton className="h-4/5 w-4/5 rounded" />
					) : (
						<ImageIcon className="h-1/4 w-1/4 text-muted-foreground/30" />
					)}
				</div>
			);
		}

		// Determinar si el thumbnail es base64, una URL o null
		const isThumbnailBase64 =
			image.thumbnail &&
			(image.thumbnail.startsWith('data:') || image.thumbnail.startsWith('blob:'));

		// Renderizar según el tipo de thumbnail
		return (
			<div
				className="relative h-full w-full overflow-hidden"
				onClick={onClick ? () => onClick(image, index) : undefined}
				onKeyDown={onClick ? (e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						onClick(image, index);
					}
				} : undefined}
				role={onClick ? "button" : undefined}
				tabIndex={onClick ? 0 : undefined}
			>
				{image.thumbnail ? (
					isThumbnailBase64 ? (
						// Para base64 o blob URLs, usar img directo
						<img
							src={image.thumbnail}
							alt={image.alt || `Imagen ${index + 1}`}
							className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
						/>
					) : (
						// Para URLs normales, usar Next Image
						<Image
							src={image.thumbnail}
							alt={image.alt || `Imagen ${index + 1}`}
							fill
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
							className="object-cover transition-transform duration-300 hover:scale-105"
						/>
					)
				) : (
					// No hay thumbnail, mostrar placeholder
					<div className="flex h-full w-full items-center justify-center bg-muted/30">
						<ImageIcon className="h-1/3 w-1/3 text-muted-foreground/30" />
					</div>
				)}
			</div>
		);
	};

	return (
		<div
			className={cn(
				'grid h-full w-full',
				containerClasses[layout],
				gap > 0 && `gap-${gap}`,
				className
			)}
			style={{ aspectRatio }}
		>
			{displayImages.map((image, index) => (
				<motion.div
					key={image?.id || `image-${index}`}
					className={cn('relative h-full w-full', itemClasses[style])}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: index * 0.1, duration: 0.2 }}
				>
					{renderImage(image, index)}
				</motion.div>
			))}
		</div>
	);
}

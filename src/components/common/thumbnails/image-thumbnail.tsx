/**
 * @file Componente de thumbnail de imagen
 * @description Componente para mostrar thumbnails de imágenes con carga lazy y fallbacks
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { FileImage, Image as ImageIcon } from 'lucide-react';

interface ImageThumbnailProps {
	path: string;
	name: string;
	size?: number;
	className?: string;
	fallbackIcon?: React.ReactNode;
}

/**
 * Componente de thumbnail de imagen con carga lazy
 */
export function ImageThumbnail({
	path,
	name,
	size = 48,
	className = '',
	fallbackIcon,
}: ImageThumbnailProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);
	const [imageSrc, setImageSrc] = useState<string>('');

	useEffect(() => {
		// Generar URL del thumbnail basado en el path
		const thumbnailUrl = `/api/thumbnails/${encodeURIComponent(path)}`;
		setImageSrc(thumbnailUrl);
		setIsLoading(true);
		setHasError(false);
	}, [path]);

	const handleLoad = () => {
		setIsLoading(false);
		setHasError(false);
	};

	const handleError = () => {
		setIsLoading(false);
		setHasError(true);
	};

	// Si hay error, mostrar icono de fallback
	if (hasError) {
		return (
			<div
				className={cn(
					'flex items-center justify-center bg-muted text-muted-foreground rounded border',
					className
				)}
				style={{ width: size, height: size }}
			>
				{fallbackIcon || <FileImage className="h-4 w-4" />}
			</div>
		);
	}

	return (
		<div
			className={cn('relative overflow-hidden rounded border', className)}
			style={{ width: size, height: size }}
		>
			{/* Loading placeholder */}
			{isLoading && (
				<div
					className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse"
					style={{ width: size, height: size }}
				>
					<ImageIcon className="h-4 w-4 text-muted-foreground" />
				</div>
			)}

			{/* Imagen real */}
			<img
				src={imageSrc}
				alt={name}
				className={cn(
					'w-full h-full object-cover transition-opacity duration-200',
					isLoading ? 'opacity-0' : 'opacity-100'
				)}
				onLoad={handleLoad}
				onError={handleError}
				loading="lazy"
			/>
		</div>
	);
}

export default ImageThumbnail;

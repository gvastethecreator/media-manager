/**
 * @file Componente de thumbnail de imagen
 * @description Componente para mostrar thumbnails de imágenes con carga lazy y fallbacks
 */

import { FileImage, Image as ImageIcon } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface ImageThumbnailProps {
	className?: string;
	fallbackIcon?: React.ReactNode;
	id?: string; // opcional: id explícito de imagen
	name: string;
	path: string; // Puede ser ruta o id; preferimos id cuando venga
	size?: number;
	thumbnailUrl?: string; // opcional: si ya viene resuelto
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
	id,
	thumbnailUrl,
}: ImageThumbnailProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);

	// Calcular URL final sin usar estado para evitar src vacíos en el primer render
	const finalUrl = useMemo(() => {
		return (
			(thumbnailUrl && typeof thumbnailUrl === 'string' && thumbnailUrl) ||
			(id ? `/api/images/${encodeURIComponent(id)}/thumbnail` : undefined) ||
			`/api/thumbnails/${encodeURIComponent(path)}`
		);
	}, [path, id, thumbnailUrl]);

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
				className={cn('flex items-center justify-center rounded border bg-muted text-muted-foreground', className)}
				style={{ width: size, height: size }}
			>
				{fallbackIcon || <FileImage className="h-4 w-4" />}
			</div>
		);
	}

	return (
		<div className={cn('relative overflow-hidden rounded border', className)} style={{ width: size, height: size }}>
			{/* Loading placeholder */}
			{isLoading && (
				<div
					className="absolute inset-0 flex animate-pulse items-center justify-center bg-muted"
					style={{ width: size, height: size }}
				>
					<ImageIcon className="h-4 w-4 text-muted-foreground" />
				</div>
			)}

			{/* Imagen real */}
			<img
				alt={name}
				className={cn(
					'h-full w-full object-cover transition-opacity duration-200',
					isLoading ? 'opacity-0' : 'opacity-100'
				)}
				loading="lazy"
				onError={handleError}
				onLoad={handleLoad}
				src={finalUrl}
			/>
		</div>
	);
}

export default ImageThumbnail;

'use client';

import { ImageIcon } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

// Propiedades básicas para el componente
type ImageFallbackProps = {
	src?: string;
	alt: string;
	className?: string;
	fallbackClassName?: string;
	width?: number | string;
	height?: number | string;
	onLoad?: () => void;
	onError?: () => void;
};

/**
 * Componente que muestra una imagen con un fallback para cuando la imagen
 * no puede cargarse o mientras está en proceso de carga.
 */
export function ImageFallback({
	src,
	alt,
	className,
	fallbackClassName,
	width,
	height,
	onLoad,
	onError,
}: ImageFallbackProps) {
	const [hasError, setHasError] = React.useState(false);
	const [isLoaded, setIsLoaded] = React.useState(false);
	const imgRef = React.useRef<HTMLImageElement>(null);

	// Manejadores de eventos
	const handleError = React.useCallback(() => {
		setHasError(true);
		setIsLoaded(false);
		onError?.();
	}, [onError]);

	const handleLoad = React.useCallback(() => {
		setIsLoaded(true);
		onLoad?.();
	}, [onLoad]);

	// Estilos para el contenedor
	const containerStyle: React.CSSProperties = {
		width: width || 'auto',
		height: height || 'auto',
		position: 'relative',
	};

	// Si hay error, mostrar un placeholder
	if (hasError) {
		return (
			<div
				className={cn('flex items-center justify-center bg-muted/50 rounded-md', className, fallbackClassName)}
				style={containerStyle}
				role="img"
				aria-label={alt}
			>
				<ImageIcon className="w-8 h-8 text-muted-foreground/40" aria-hidden="true" />
			</div>
		);
	}

	// Renderizar la imagen con su placeholder
	return (
		<div className={cn('relative', className)} style={containerStyle}>
			<img
				ref={imgRef}
				src={src}
				alt={alt}
				className="w-full h-full object-cover transition-opacity duration-300"
				style={{ opacity: isLoaded ? 1 : 0 }}
				onError={handleError}
				onLoad={handleLoad}
			/>

			{!isLoaded && (
				<div
					className={cn('absolute inset-0 flex items-center justify-center bg-muted/50', fallbackClassName)}
					aria-hidden="true"
				>
					<ImageIcon className="w-8 h-8 text-muted-foreground/40" aria-hidden="true" />
				</div>
			)}
		</div>
	);
}

// Nombre para DevTools
ImageFallback.displayName = 'ImageFallback';

import { ImageIcon } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

// Propiedades básicas para el componente
interface ImageFallbackProps {
	alt: string;
	className?: string;
	fallbackClassName?: string;
	height?: number | string;
	onError?: () => void;
	onLoad?: () => void;
	src?: string;
	width?: number | string;
}

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
				aria-label={alt}
				className={cn('flex items-center justify-center rounded-md bg-muted/50', className, fallbackClassName)}
				role="img"
				style={containerStyle}
			>
				<ImageIcon aria-hidden="true" className="h-8 w-8 text-muted-foreground/40" />
			</div>
		);
	}

	// Renderizar la imagen con su placeholder
	return (
		<div className={cn('relative', className)} style={containerStyle}>
			<img
				alt={alt}
				className="h-full w-full object-cover transition-opacity duration-dt-normal ease-dt-out"
				onError={handleError}
				onLoad={handleLoad}
				ref={imgRef}
				src={src}
				style={{ opacity: isLoaded ? 1 : 0 }}
			/>

			{!isLoaded && (
				<div
					aria-hidden="true"
					className={cn('absolute inset-0 flex items-center justify-center bg-muted/50', fallbackClassName)}
				>
					<ImageIcon aria-hidden="true" className="h-8 w-8 text-muted-foreground/40" />
				</div>
			)}
		</div>
	);
}

// Nombre para DevTools
ImageFallback.displayName = 'ImageFallback';

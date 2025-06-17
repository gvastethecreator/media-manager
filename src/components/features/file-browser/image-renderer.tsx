'use client';

import { cn } from '@/lib/utils';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

interface ImageRendererProps {
	src: string | null;
	alt: string;
	className?: string;
	style?: React.CSSProperties;
	width?: number;
	height?: number;
	quality?: number;
	objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
	priority?: boolean;
	onLoad?: () => void;
	onError?: () => void;
	isScrolling?: boolean;
	shouldLoad?: boolean;
}

/**
 * Componente optimizado para renderizar imágenes con carga diferida
 * y cancelación de solicitudes durante el scroll
 */
export const ImageRenderer = memo<ImageRendererProps>(function ImageRenderer({
	src,
	alt,
	className,
	style,
	width,
	height,
	quality = 80,
	objectFit = 'cover',
	priority = false,
	onLoad,
	onError,
	isScrolling = false,
	shouldLoad = true,
}) {
	// Estados
	const [loaded, setLoaded] = useState(false);
	const [error, setError] = useState(false);
	const [imageSrc, setImageSrc] = useState<string | null>(null);

	// Referencias
	const abortControllerRef = useRef<AbortController | null>(null);
	const imageRef = useRef<HTMLImageElement>(null);
	const observerRef = useRef<IntersectionObserver | null>(null);
	const attemptCountRef = useRef<number>(0);

	// Función para cargar la imagen
	const loadImage = useCallback(async () => {
		if (!src || !shouldLoad) return;

		// Si está en scroll, no cargar nuevas imágenes a menos que sea prioritaria
		if (isScrolling && !loaded && !priority) return;

		// Si la imagen ya está cargada o hay error, no hacer nada
		if (loaded || error) return;

		// Crear un nuevo AbortController para poder cancelar la solicitud
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		abortControllerRef.current = new AbortController();

		try {
			// Si es una URL directa, usarla
			if (src.startsWith('data:') || src.startsWith('blob:')) {
				setImageSrc(src);
				return;
			}

			// Si es una URL http/https, cargarla directamente pero con manejo de errores
			if (src.startsWith('http')) {
				setImageSrc(src);
				return;
			}

			// Si es una ruta API, hacer fetch con AbortController
			const response = await fetch(src, {
				signal: abortControllerRef.current?.signal,
				headers: {
					'Cache-Control': 'max-age=31536000',
					'Pragma': 'no-cache', // Para evitar problemas con caché
				},
				// Añadir un parámetro de consulta único para evitar caché
				cache: 'no-store',
			});

			if (!response.ok) {
				throw new Error(`Error loading image: ${response.statusText}`);
			}

			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			setImageSrc(url);
		} catch (err) {
			// Ignorar errores de abort
			if (err instanceof DOMException && err.name === 'AbortError') {
				return;
			}

			// Reintentar hasta 3 veces con un retraso exponencial
			if (attemptCountRef.current < 3) {
				attemptCountRef.current++;
				const delay = 2 ** attemptCountRef.current * 500;
				setTimeout(() => loadImage(), delay);
				return;
			}

			console.error('Error loading image:', err);
			setError(true);
			onError?.();
		}
	}, [src, shouldLoad, isScrolling, loaded, error, priority, onError]);

	// Efecto para cargar la imagen cuando sea visible
	useEffect(() => {
		if (!src || !shouldLoad) return;

		// Resetear el contador de intentos cuando cambia la fuente
		attemptCountRef.current = 0;

		// Usar IntersectionObserver para carga diferida
		const setupIntersectionObserver = () => {
			if (!imageRef.current || priority) return;

			// Limpiar observer anterior si existe
			observerRef.current?.disconnect();

			observerRef.current = new IntersectionObserver(
				(entries) => {
					const [entry] = entries;
					if (entry.isIntersecting) {
						loadImage();
						observerRef.current?.disconnect();
					}
				},
				{
					threshold: 0.1,
					rootMargin: '200px', // Cargar imágenes antes de que sean visibles
				}
			);

			observerRef.current.observe(imageRef.current);
		};

		// Si es prioritaria, cargar inmediatamente
		if (priority) {
			loadImage();
		} else {
			setupIntersectionObserver();
		}

		// Cleanup
		return () => {
			abortControllerRef.current?.abort();
			observerRef.current?.disconnect();
			// Liberar URL.createObjectURL
			if (imageSrc && imageSrc.startsWith('blob:')) {
				URL.revokeObjectURL(imageSrc);
			}
		};
	}, [src, shouldLoad, priority, loadImage, imageSrc]);

	// Manejadores de eventos
	const handleLoad = () => {
		setLoaded(true);
		onLoad?.();
	};

	const handleError = () => {
		// Solo marcar como error si ya hemos agotado los reintentos
		if (attemptCountRef.current >= 3) {
			setError(true);
			onError?.();
		} else {
			// Reintentar
			attemptCountRef.current++;
			const delay = 2 ** attemptCountRef.current * 500;
			setTimeout(() => loadImage(), delay);
		}
	};

	// Estilo para el object-fit
	const imageStyle = {
		...style,
		objectFit,
	};

	// Renderizar placeholder si está cargando o hay error
	if (!imageSrc || error) {
		return (
			<div
				ref={imageRef}
				className={cn(
					'bg-muted/30 flex items-center justify-center',
					error ? 'bg-red-100/10 dark:bg-red-900/10' : '',
					className
				)}
				style={{
					width: width || '100%',
					height: height || '100%',
					...style,
				}}
			>
				{error ? (
					<span className="text-xs text-muted-foreground">Error</span>
				) : (
					<div className="w-6 h-6 rounded-full border-2 border-t-transparent border-primary/30 animate-spin" />
				)}
			</div>
		);
	}

	// Renderizar la imagen
	return (
		<img
			ref={imageRef}
			src={imageSrc}
			alt={alt}
			className={className}
			style={imageStyle as React.CSSProperties}
			width={width}
			height={height}
			loading="lazy"
			decoding="async"
			onLoad={handleLoad}
			onError={handleError}
		/>
	);
});

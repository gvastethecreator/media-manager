'use client';

import { cn } from '@/lib/utils';
import React, { useEffect, useMemo, useRef, useState } from 'react';

interface ImageRendererProps extends React.ImgHTMLAttributes<HTMLImageElement> {
	src: string | null;
	alt?: string;
	className?: string;
	objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
	priority?: boolean; // Indica si la imagen debe cargarse con prioridad alta
	blur?: boolean; // Aplicar efecto de desenfoque durante la carga
	onLoad?: () => void;
	onError?: () => void;
}

// Caché global de imágenes para evitar recargas
const imageCache = new Map<string, boolean>();
// Cola de precarga de imágenes
const preloadQueue: string[] = [];
// Estado global de precarga
let isPreloading = false;

// Función para precargar imágenes en segundo plano
const preloadImages = (urls: string[], highPriority = false) => {
	// Filtrar las URLs que aún no están en caché o en la cola
	const newUrls = urls.filter(url =>
		url &&
		!imageCache.has(url) &&
		!preloadQueue.includes(url)
	);

	// Si hay prioridad alta, poner al inicio de la cola
	if (highPriority) {
		preloadQueue.unshift(...newUrls);
	} else {
		preloadQueue.push(...newUrls);
	}

	// Iniciar el proceso de precarga si no está en curso
	if (!isPreloading) {
		processNextPreload();
	}
};

// Procesar el siguiente elemento de la cola de precarga
const processNextPreload = () => {
	if (preloadQueue.length === 0) {
		isPreloading = false;
		return;
	}

	isPreloading = true;
	const url = preloadQueue.shift();

	if (!url) {
		processNextPreload();
		return;
	}

	const img = new Image();
	img.onload = () => {
		imageCache.set(url, true);
		// Procesar el siguiente después de un pequeño retraso
		setTimeout(processNextPreload, 50);
	};
	img.onerror = () => {
		imageCache.set(url, false);
		// Procesar el siguiente inmediatamente en caso de error
		processNextPreload();
	};
	img.src = url;
};

/**
 * 🖼️ Componente para renderizar imágenes con optimizaciones
 *
 * Características:
 * - Manejo de carga y errores
 * - Caché compartido entre instancias
 * - Precarga inteligente
 * - Efectos de carga progresiva
 */
export function ImageRenderer({
	src,
	alt = '',
	className,
	objectFit = 'cover',
	priority = false,
	blur = true,
	onLoad,
	onError,
	...props
}: ImageRendererProps) {
	const [isLoaded, setIsLoaded] = useState(false);
	const [hasError, setHasError] = useState(false);
	const imgRef = useRef<HTMLImageElement>(null);
	const observer = useRef<IntersectionObserver | null>(null);

	// Filtrar props no válidas para elementos DOM
	const filteredProps = { ...props };
	// Eliminar props que React no reconoce en elementos DOM
	const propsToRemove = [
		'isScrolling',
		'isSelected',
		'isActive',
		'virtualizer',
		'index',
		'observerRef',
		'measureRef',
		'resizeRef',
		'isVisible',
		'isInView',
		'data-index'
	];
	propsToRemove.forEach(prop => {
		if (prop in filteredProps) {
			delete filteredProps[prop as keyof typeof filteredProps];
		}
	});

	// Normalizar la URL
	const imageUrl = useMemo(() => {
		// Si no hay src o es null, retornar undefined para evitar el error de cadena vacía
		if (!src) return undefined;

		// Asegurarse de que la URL es absoluta
		if (src.startsWith('/')) {
			// Solo convertir a absoluta en el cliente
			if (typeof window !== 'undefined') {
				return `${window.location.origin}${src}`;
			}
			return src;
		}
		return src;
	}, [src]);

	// Comprobar si la imagen ya está en caché
	const isCached = useMemo(() => {
		return imageUrl ? imageCache.has(imageUrl) : false;
	}, [imageUrl]);

	// Aplicar estilos según el estado de la imagen
	const imageStyles = useMemo(() => {
		return cn(
			'transition-opacity duration-300',
			objectFit && `object-${objectFit}`,
			{
				'opacity-0': !isLoaded && blur,
				'opacity-100': isLoaded || !blur,
			},
			className
		);
	}, [className, objectFit, isLoaded, blur]);

	// Manejar la carga de la imagen
	const handleLoad = () => {
		setIsLoaded(true);
		setHasError(false);
		// Agregar a caché
		if (imageUrl) {
			imageCache.set(imageUrl, true);
		}
		onLoad?.();
	};

	// Manejar errores
	const handleError = () => {
		setHasError(true);
		// Marcar como fallido en caché
		if (imageUrl) {
			imageCache.set(imageUrl, false);
		}
		onError?.();
	};

	// Establecer Observer para detección de visibilidad y precarga
	useEffect(() => {
		if (!imageUrl || priority || isCached) return;

		// Inicializar IntersectionObserver para carga lazy
		observer.current = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry.isIntersecting) {
					// La imagen es visible, cargarla
					if (imgRef.current) {
						imgRef.current.src = imageUrl;
					}

					// Desconectar observer después de cargar
					observer.current?.disconnect();
					observer.current = null;

					// Precargar las siguientes imágenes similares (misma URL base)
					if (imageUrl) {
						const urlParts = imageUrl.split('/');
						const lastPart = urlParts.pop() || '';
						const basePath = urlParts.join('/');
						const idMatch = lastPart.match(/(\d+)/);

						if (idMatch) {
							const currentId = parseInt(idMatch[0], 10);
							// Precargar las próximas imágenes cercanas
							const nextIds = [
								currentId + 1,
								currentId + 2,
								currentId + 3,
								currentId - 1,
								currentId - 2
							].filter(id => id > 0);

							const preloadUrls = nextIds.map(id => {
								return imageUrl.replace(/(\d+)/, id.toString());
							});

							preloadImages(preloadUrls);
						}
					}
				}
			},
			{
				root: null,
				rootMargin: '100px', // Cargar cuando esté a 100px de ser visible
				threshold: 0.1,
			}
		);

		if (imgRef.current) {
			observer.current.observe(imgRef.current);
		}

		return () => {
			observer.current?.disconnect();
		};
	}, [imageUrl, priority, isCached]);

	// Para imágenes prioritarias, cargamos inmediatamente
	useEffect(() => {
		if (priority && imageUrl && !isCached) {
			if (imgRef.current) {
				imgRef.current.src = imageUrl;
			}
			// Agregar a la cola de precarga con alta prioridad
			preloadImages([imageUrl], true);
		}
	}, [priority, imageUrl, isCached]);

	// Si la imagen ya está en caché y cargada correctamente, mostrarla directamente
	useEffect(() => {
		if (isCached && imageCache.get(imageUrl) === true) {
			setIsLoaded(true);
		}
	}, [isCached, imageUrl]);

	// Si no hay URL, mostrar un placeholder
	if (!imageUrl) {
		return (
			<div
				className={cn(
					'bg-muted/30 flex items-center justify-center rounded-md',
					className
				)}
			>
				<span className="text-xs text-muted-foreground">Sin imagen</span>
			</div>
		);
	}

	return (
		<div className="relative w-full h-full overflow-hidden">
			{/* Imagen principal */}
			<img
				ref={imgRef}
				src={priority || isCached ? imageUrl : undefined} // Usar undefined en lugar de cadena vacía
				alt={alt}
				className={imageStyles}
				onLoad={handleLoad}
				onError={handleError}
				loading={priority ? 'eager' : 'lazy'}
				{...filteredProps}
			/>

			{/* Placeholder mientras carga */}
			{!isLoaded && blur && (
				<div
					className={cn(
						'absolute inset-0 bg-muted/20 animate-pulse flex items-center justify-center',
						className
					)}
				>
					<span className="sr-only">Cargando imagen...</span>
				</div>
			)}

			{/* Placeholder en caso de error */}
			{hasError && (
				<div
					className={cn(
						'absolute inset-0 bg-muted/10 flex items-center justify-center',
						className
					)}
				>
					<span className="text-xs text-muted-foreground">Error al cargar</span>
				</div>
			)}
		</div>
	);
}

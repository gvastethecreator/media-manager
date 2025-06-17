'use client';

import Image from 'next/image';
import React from 'react';
import { cn } from '@/lib/utils';

interface ImageRendererProps extends React.ImgHTMLAttributes<HTMLImageElement> {
	width?: number;
	height?: number;
	priority?: boolean;
	quality?: number;
	placeholder?: 'blur' | 'empty';
	blurDataURL?: string;
	isLoading?: boolean;
	showPlaceholder?: boolean;
}

// Caché global de imágenes para evitar recargas
const imageCache = new Map<string, boolean>();
// Cola de precarga de imágenes
const preloadQueue: string[] = [];
// Estado global de precarga
let isPreloading = false;

// Función para precargar imágenes en segundo plano
const _preloadImages = (urls: string[], highPriority = false) => {
	// Filtrar las URLs que aún no están en caché o en la cola
	const newUrls = urls.filter((url) => url && !imageCache.has(url) && !preloadQueue.includes(url));

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
 * 🖼️ Componente para renderizar imágenes optimizado
 *
 * Utiliza Image de Next.js para imágenes estáticas cuando es posible,
 * y cae de vuelta a img para imágenes dinámicas o externas.
 */
export const ImageRenderer = React.memo(function ImageRenderer({
	src,
	alt = '',
	width,
	height,
	className,
	priority = false,
	quality = 80,
	placeholder = 'empty',
	blurDataURL,
	isLoading,
	showPlaceholder,
	...rest
}: ImageRendererProps) {
	// Si no tenemos src o src es un objeto (error común), mostramos un placeholder
	if (!src || typeof src === 'object') {
		return (
			<div className={cn('bg-muted/30 flex items-center justify-center', className)} {...rest}>
				<span className="text-xs text-muted-foreground">
					{typeof src === 'object' ? 'Error de formato' : 'Sin imagen'}
				</span>
			</div>
		);
	}

	// Determinar si la imagen es un blob o una URL de datos
	const isBlobOrDataUrl = src.startsWith('blob:') || src.startsWith('data:');

	// Determinar si la imagen es local o remota
	const isRemoteImage = src.startsWith('http') && !isBlobOrDataUrl;

	// Si la imagen es local y no es un blob ni una URL de datos, usar Image de Next.js
	if (!isRemoteImage && !isBlobOrDataUrl && src.startsWith('/')) {
		// Filtrar las propiedades no soportadas por Next Image
		const {
			onLoad,
			onError,
			loading,
			crossOrigin,
			referrerPolicy,
			decoding,
			sizes,
			srcSet,
			useMap,
			fetchPriority,
			...imgProps
		} = rest;

		return (
			<Image
				src={src}
				alt={alt}
				width={width || 300}
				height={height || 300}
				className={className}
				priority={priority}
				quality={quality}
				placeholder={placeholder}
				blurDataURL={blurDataURL}
				{...imgProps}
			/>
		);
	}

	// Para imágenes remotas o blobs, usar img estándar
	return (
		<img
			src={src}
			alt={alt}
			width={width}
			height={height}
			className={className}
			loading={priority ? 'eager' : 'lazy'}
			{...rest}
		/>
	);
});

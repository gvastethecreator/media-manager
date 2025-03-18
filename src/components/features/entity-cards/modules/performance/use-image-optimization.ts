'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PerformanceOptions } from './types';

/**
 * Formato de imagen optimizado
 */
export type ImageFormat = 'original' | 'webp' | 'avif' | 'jpeg';

/**
 * Configuración para optimización de imágenes
 */
export interface ImageOptimizationConfig {
	enabled: boolean;
	format: ImageFormat;
	quality: number;
	placeholder: boolean;
	lazyLoad: boolean;
	preload: boolean;
	maxWidth: number | null;
	maxHeight: number | null;
	devicePixelRatio: number;
}

/**
 * Props para el hook useImageOptimization
 */
export interface UseImageOptimizationProps {
	options: PerformanceOptions;
	enabled?: boolean;
}

/**
 * Hook especializado para optimizar imágenes en Entity Cards
 *
 * Este hook proporciona utilidades para:
 * - Cargar imágenes de manera óptima (lazy loading)
 * - Generar URLs optimizadas para diferentes dispositivos
 * - Utilizar formatos modernos (WebP, AVIF) cuando están disponibles
 * - Gestionar placeholders durante la carga
 *
 * @param props - Propiedades para el hook
 * @returns Funciones y valores para optimizar imágenes
 */
export function useImageOptimization({ options, enabled = true }: UseImageOptimizationProps) {
	// Estados
	const [supportsWebP, setSupportsWebP] = useState<boolean | null>(null);
	const [supportsAVIF, setSupportsAVIF] = useState<boolean | null>(null);
	const [devicePixelRatio, setDevicePixelRatio] = useState(1);

	// Configuración derivada de las opciones
	const config = useMemo<ImageOptimizationConfig>(
		() => ({
			enabled: enabled && (options.imageOptimization ?? true),
			format: 'original',
			quality: 85,
			placeholder: options.useSkeletonLoading ?? true,
			lazyLoad: options.lazyLoad ?? true,
			preload: options.enablePreloading ?? false,
			maxWidth: null,
			maxHeight: null,
			devicePixelRatio: devicePixelRatio,
		}),
		[
			enabled,
			options.imageOptimization,
			options.useSkeletonLoading,
			options.lazyLoad,
			options.enablePreloading,
			devicePixelRatio,
		]
	);

	// Detectar soporte de formatos modernos y DPR al montar
	useEffect(() => {
		if (typeof window === 'undefined') return;

		// Actualizar devicePixelRatio
		setDevicePixelRatio(window.devicePixelRatio || 1);

		// Detectar soporte de WebP
		const checkWebPSupport = async () => {
			if (supportsWebP !== null) return; // Ya se ha comprobado

			try {
				const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
				const blob = await fetch(webpData).then((r) => r.blob());
				setSupportsWebP(blob.size > 0);
			} catch (e) {
				setSupportsWebP(false);
			}
		};

		// Detectar soporte de AVIF
		const checkAVIFSupport = async () => {
			if (supportsAVIF !== null) return; // Ya se ha comprobado

			try {
				const avifData =
					'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
				const blob = await fetch(avifData).then((r) => r.blob());
				setSupportsAVIF(blob.size > 0);
			} catch (e) {
				setSupportsAVIF(false);
			}
		};

		checkWebPSupport();
		checkAVIFSupport();
	}, [supportsWebP, supportsAVIF]);

	// Determinar el mejor formato disponible
	const bestAvailableFormat = useMemo<ImageFormat>(() => {
		if (!config.enabled) return 'original';
		if (supportsAVIF) return 'avif';
		if (supportsWebP) return 'webp';
		return 'jpeg';
	}, [config.enabled, supportsAVIF, supportsWebP]);

	/**
	 * Generar URL optimizada para una imagen
	 */
	const getOptimizedImageUrl = useCallback(
		(src: string, width?: number, height?: number, format?: ImageFormat) => {
			// Si la optimización está deshabilitada, devolver URL original
			if (!config.enabled || !src) {
				return src;
			}

			// Si la URL ya está optimizada o es una URL de datos, devolver tal cual
			if (src.startsWith('data:') || src.includes('_next/image')) {
				return src;
			}

			// Para URLs externas, necesitamos que estén en dominios permitidos
			// Esto depende de la configuración de Next.js
			const isExternalUrl = src.startsWith('http') && !src.includes(window.location.hostname);
			if (isExternalUrl) {
				// Comprobar si es una URL de una CDN conocida que soporta transformaciones
				const supportedCdns = ['cloudinary.com', 'imgix.net', 'imagekit.io'];
				const isSupportedCdn = supportedCdns.some((cdn) => src.includes(cdn));

				if (!isSupportedCdn) {
					return src; // No podemos optimizar URLs externas no soportadas
				}
			}

			// Determinar dimensiones
			const targetWidth = width || config.maxWidth;
			const targetHeight = height || config.maxHeight;

			// Determinar formato
			const targetFormat = format || bestAvailableFormat;

			// Construir objecto de parámetros para la API de Next.js Image
			const params = new URLSearchParams();

			if (targetWidth) {
				params.append('w', Math.round(targetWidth * config.devicePixelRatio).toString());
			}

			if (targetHeight) {
				params.append('h', Math.round(targetHeight * config.devicePixelRatio).toString());
			}

			if (targetFormat !== 'original') {
				params.append('f', targetFormat);
			}

			params.append('q', config.quality.toString());

			// URLs de Next.js Image normalizadas
			const imgPath = `/_next/image?url=${encodeURIComponent(src)}&${params.toString()}`;

			return imgPath;
		},
		[config.enabled, config.devicePixelRatio, config.quality, config.maxWidth, config.maxHeight, bestAvailableFormat]
	);

	/**
	 * Obtener atributos para imagen optimizada
	 */
	const getImageProps = useCallback(
		(src: string, alt = '', width?: number, height?: number) => {
			// Props básicos
			const props: Record<string, unknown> = {
				src,
				alt,
			};

			// Si width y height están definidos, añadirlos
			if (width) props.width = width;
			if (height) props.height = height;

			// Si la optimización está habilitada
			if (config.enabled) {
				// Usar URL optimizada
				props.src = getOptimizedImageUrl(src, width, height);

				// Configurar lazy loading si está habilitado
				if (config.lazyLoad) {
					props.loading = 'lazy';
					props.decoding = 'async';
				}

				// Configurar preload si está habilitado
				if (config.preload) {
					props['data-preload'] = 'true';
				}

				// Añadir soporte para placeholder si está habilitado
				if (config.placeholder) {
					props['data-placeholder'] = 'true';
					props.className = `image-with-placeholder ${props.className || ''}`.trim();
				}

				// Añadir srcset para diferentes densidades de píxeles si tenemos dimensiones
				if (width && height && config.devicePixelRatio > 1) {
					const srcSet = [
						`${getOptimizedImageUrl(src, width, height, bestAvailableFormat)} 1x`,
						`${getOptimizedImageUrl(src, width * 2, height * 2, bestAvailableFormat)} 2x`,
					];

					if (config.devicePixelRatio >= 3) {
						srcSet.push(`${getOptimizedImageUrl(src, width * 3, height * 3, bestAvailableFormat)} 3x`);
					}

					props.srcSet = srcSet.join(', ');
				}
			}

			return props;
		},
		[
			config.enabled,
			config.lazyLoad,
			config.preload,
			config.placeholder,
			config.devicePixelRatio,
			getOptimizedImageUrl,
			bestAvailableFormat,
		]
	);

	/**
	 * Precargar una imagen
	 */
	const preloadImage = useCallback(
		(src: string, width?: number, height?: number) => {
			if (!config.enabled || !src || typeof window === 'undefined') {
				return Promise.resolve();
			}

			return new Promise<void>((resolve, reject) => {
				const optimizedSrc = getOptimizedImageUrl(src, width, height);
				const img = new Image();

				img.onload = () => resolve();
				img.onerror = () => reject(new Error(`Failed to preload image: ${optimizedSrc}`));

				img.src = optimizedSrc;
			});
		},
		[config.enabled, getOptimizedImageUrl]
	);

	/**
	 * Generar un placeholder para la imagen
	 */
	const getPlaceholderStyle = useCallback(
		(width?: number, height?: number) => {
			if (!config.placeholder) {
				return {};
			}

			return {
				backgroundColor: '#f0f0f0',
				width: width ? `${width}px` : '100%',
				height: height ? `${height}px` : '100%',
				display: 'inline-block',
				animation: 'pulse 1.5s ease-in-out infinite',
			};
		},
		[config.placeholder]
	);

	return {
		// Estado y configuración
		config,
		supportsWebP,
		supportsAVIF,
		devicePixelRatio,
		bestAvailableFormat,

		// Funciones principales
		getOptimizedImageUrl,
		getImageProps,
		preloadImage,
		getPlaceholderStyle,
	};
}

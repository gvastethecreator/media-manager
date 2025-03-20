'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useImageStore } from '../actions/image-config.action';

// 🖼️ Props del componente
interface ImageLayerProps {
	/** Ancho de la imagen */
	width: number;
	/** Alto de la imagen */
	height: number;
	/** URL de la imagen */
	imageUrl?: string;
	/** Título de la imagen */
	title?: string;
	/** Clase CSS adicional */
	className?: string;
	/** Si está en modo explotado */
	isExploded?: boolean;
	/** Si está siendo hover */
	isHovered?: boolean;
	/** Capa activa */
	activeLayer?: number;
}

// 🎯 Imagen por defecto
const DEFAULT_IMAGE = '/placeholders/character-placeholder.jpg';

// 🔍 Validar URL de imagen
function isValidImageUrl(url: string): boolean {
	if (!url || typeof url !== 'string' || url.trim() === '') return false;

	try {
		if (url.startsWith('http://') || url.startsWith('https://')) {
			new URL(url);
			return true;
		}
		if (url.startsWith('/')) return true;
		return false;
	} catch {
		return false;
	}
}

/**
 * 🧩 Componente de capa de imagen
 * Renderiza una imagen con efectos y optimizaciones
 */
export function ImageLayer({
	width,
	height,
	imageUrl,
	title,
	className,
	isExploded,
	isHovered,
	activeLayer,
}: ImageLayerProps) {
	// 🏪 Estado global
	const { config } = useImageStore();

	// 🎭 Estados locales
	const [imageError, setImageError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [hasLoaded, setHasLoaded] = useState(false);

	// 🔄 Resetear estados cuando cambia la URL
	useEffect(() => {
		setImageError(false);
		setIsLoading(true);
		setHasLoaded(false);
	}, [imageUrl]);

	// ⛔ No renderizar si está deshabilitado
	if (!config.enabled) return null;

	// 🖼️ Obtener URL de imagen
	const imageSrc = imageError || !isValidImageUrl(imageUrl || '') ? DEFAULT_IMAGE : imageUrl;

	// 🎨 Obtener clase de borde redondeado
	const getBorderRadiusClass = () => {
		switch (config.borderRadius) {
			case 'sm': return 'rounded-sm';
			case 'md': return 'rounded-md';
			case 'lg': return 'rounded-lg';
			case 'full': return 'rounded-full';
			default: return '';
		}
	};

	// 🎭 Generar filtros CSS
	const getFilterStyle = () => {
		const filters = [];
		if (config.blur > 0) filters.push(`blur(${config.blur}px)`);
		if (config.grayscale > 0) filters.push(`grayscale(${config.grayscale}%)`);
		if (config.brightness !== 100) filters.push(`brightness(${config.brightness}%)`);
		if (config.contrast !== 100) filters.push(`contrast(${config.contrast}%)`);
		if (config.saturate !== 100) filters.push(`saturate(${config.saturate}%)`);
		return filters.length > 0 ? filters.join(' ') : 'none';
	};

	// ♿ Obtener props de accesibilidad
	const getAccessibilityProps = () => ({
		alt: config.accessibility?.alt || title || 'Imagen',
		'aria-label': config.accessibility?.alt,
		'aria-description': config.accessibility?.description,
		role: 'img',
	});

	// 🎨 Obtener clase de ajuste de imagen
	const getObjectFitClass = () => {
		switch (config.objectFit) {
			case 'cover': return 'object-cover';
			case 'contain': return 'object-contain';
			case 'fill': return 'object-fill';
			case 'none': return 'object-none';
			default: return 'object-cover';
		}
	};

	// 🎭 Renderizar componente
	return (
		<motion.div
			className={cn(
				'relative overflow-hidden',
				getBorderRadiusClass(),
				config.aspectRatio !== 'auto' && `aspect-[${config.aspectRatio}]`,
				isLoading && !hasLoaded && 'animate-pulse bg-muted',
				isHovered && 'image-hovered',
				activeLayer === config.layerIndex && 'image-active',
				className
			)}
			style={{
				zIndex: config.layerIndex,
				filter: getFilterStyle(),
			}}
			initial={{ opacity: 0 }}
			animate={{
				opacity: 1,
				scale: isHovered && !config.visibleOnHover ? 1.05 : 1,
			}}
			transition={{ duration: 0.3 }}
		>
			{/* 🌟 Placeholder de carga */}
			{isLoading && !hasLoaded && config.placeholder === 'shimmer' && (
				<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
			)}

			{/* 🖼️ Imagen */}
			<Image
				src={imageSrc || DEFAULT_IMAGE}
				width={width}
				height={height}
				{...getAccessibilityProps()}
				className={cn(
					'w-full h-full transition-all duration-300',
					getObjectFitClass(),
					!hasLoaded && 'opacity-0',
					hasLoaded && 'opacity-100'
				)}
				loading={config.loading}
				onError={() => {
					setImageError(true);
					setIsLoading(false);
				}}
				onLoad={() => {
					setIsLoading(false);
					setHasLoaded(true);
				}}
				priority={config.loading === 'eager'}
				quality={90}
			/>
		</motion.div>
	);
}
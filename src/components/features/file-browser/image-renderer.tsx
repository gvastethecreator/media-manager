'use client';

import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

// Logger para depuración
const logger = clientLogger.withContext('ImageRenderer');

interface ImageRendererProps {
	src: string;
	alt: string;
	width?: number;
	height?: number;
	className?: string;
	priority?: boolean;
	onLoad?: () => void;
	onError?: () => void;
	onClick?: () => void;
	quality?: number;
	objectFit?: 'cover' | 'contain';
	sizes?: string;
}

// Componente memoizado para evitar renderizados innecesarios
const ImageRendererComponent = ({
	src,
	alt,
	width = 300,
	height = 300,
	className,
	priority = false,
	onLoad,
	onError,
	onClick,
	quality = 85,
	objectFit = 'cover',
	sizes,
}: ImageRendererProps) => {
	const [error, setError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const isFirstRender = useRef(true);
	const prevSrc = useRef(src);

	// Depuración: Registrar cuando se renderiza con una nueva URL
	useEffect(() => {
		// if (isFirstRender.current) {
		// 	logger.debug(`🖼️ Primera renderización: ${src.substring(0, 50)}${src.length > 50 ? '...' : ''}`);
		// 	isFirstRender.current = false;
		// } else if (prevSrc.current !== src) {
		// 	logger.debug(`🔄 URL cambiada: ${src.substring(0, 50)}${src.length > 50 ? '...' : ''}`);
		// }
	}, []);

	// Solo resetear el estado de carga si la fuente cambia realmente
	useEffect(() => {
		// No hacemos nada en el primer renderizado
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}

		// Solo resetear si la URL realmente cambió
		if (prevSrc.current !== src) {
			setError(false);
			setIsLoading(true);
			prevSrc.current = src;
		}
	}, [src]);

	const handleError = useCallback(() => {
		logger.warn(`❌ Error al cargar imagen: ${src.substring(0, 50)}${src.length > 50 ? '...' : ''}`);
		setError(true);
		setIsLoading(false);
		if (onError) {
			onError();
		}
	}, [src, onError]);

	const handleLoad = useCallback(() => {
		// logger.debug(`✅ Imagen cargada: ${src.substring(0, 50)}${src.length > 50 ? '...' : ''}`);
		setIsLoading(false);
		if (onLoad) {
			onLoad();
		}
	}, [onLoad]);

	const handleClick = useCallback(() => {
		if (onClick && !error) {
			onClick();
		}
	}, [onClick, error]);

	// Memoizamos los estilos para reducir cálculos innecesarios
	const imageStyles = cn(
		'transition-all duration-300 object-contain w-full h-full',
		objectFit === 'cover' ? 'object-cover' : 'object-contain',
		isLoading ? 'scale-80 blur-xs brightness-10' : 'scale-100 blur-0 brightness-100'
	);

	// Memoizamos las propiedades del componente Image para reducir recreaciones
	const imageProps = {
		src,
		alt,
		width,
		height,
		className: imageStyles,
		priority,
		quality,
		sizes,
		loading: priority ? 'eager' : 'lazy',
		onError: handleError,
		onLoad: handleLoad,
		onClick: handleClick,
	};

	// Depuración: Verificar si la URL es válida
	useEffect(() => {
		if (!src) {
			logger.warn('⚠️ URL de imagen vacía');
		} else if (!src.startsWith('http') && !src.startsWith('/')) {
			logger.warn(`⚠️ URL de imagen posiblemente inválida: ${src.substring(0, 50)}${src.length > 50 ? '...' : ''}`);
		}
	}, [src]);

	if (error) {
		return (
			<div className={cn('flex items-center justify-center bg-muted', className)} style={{ width, height }}>
				<span className="text-xs text-muted-foreground">Error al cargar imagen</span>
			</div>
		);
	}

	return (
		<div className={cn('relative overflow-hidden', className)}>
			{isLoading && <div className="absolute inset-0 bg-muted animate-shiny-text" />}
			<Image {...imageProps} />
		</div>
	);
};

// Exportamos una versión memoizada del componente
export const ImageRenderer = memo(ImageRendererComponent);

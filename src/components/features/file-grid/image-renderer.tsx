'use client';

import { cn } from '@/lib/utils/utils';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

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

export function ImageRenderer({
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
}: ImageRendererProps) {
	const [error, setError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (src) {
			setError(false);
			setIsLoading(true);
		}
	}, [src]);

	const handleError = useCallback(() => {
		setError(true);
		setIsLoading(false);
		if (onError) {
			onError();
		}
	}, [onError]);

	const handleLoad = useCallback(() => {
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

	if (error) {
		return (
			<div className={cn('flex items-center justify-center bg-muted', className)} style={{ width, height }}>
				<span className="text-xs text-muted-foreground">Error al cargar imagen</span>
			</div>
		);
	}

	return (
		<div className={cn('relative overflow-hidden', className)}>
			{isLoading && <div className="absolute inset-0 bg-muted animate-pulse" />}

			<Image
				src={src}
				alt={alt}
				width={width}
				height={height}
				className={cn(
					'transition-all duration-300 object-contain w-full h-full',
					objectFit === 'cover' ? 'object-cover' : 'object-contain',
					isLoading ? 'scale-80 blur-xs brightness-10' : 'scale-100 blur-0 brightness-100'
				)}
				priority={priority}
				quality={quality}
				sizes={sizes}
				loading={priority ? 'eager' : 'lazy'}
				onError={handleError}
				onLoad={handleLoad}
				onClick={handleClick}
			/>
		</div>
	);
}

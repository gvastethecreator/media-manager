"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { FileItem } from "@/types/file-item";
import { useState, useEffect } from "react";
import { ImageFallback } from "@/components/ui/image-fallback";

export interface ImageCardProps {
	src?: string;
	alt?: string;
	width?: number;
	height?: number;
	className?: string;
	priority?: boolean;
	file?: FileItem & { thumbnail?: string };
	onClick?: () => void;
	onError?: () => void;
}

const getMetadata = (metadata: string | null) => {
	if (!metadata) return null;
	try {
		return JSON.parse(metadata);
	} catch {
		return null;
	}
};

export function ImageCard({
	src,
	alt,
	width = 300,
	height = 300,
	className,
	priority = false,
	file,
	onClick,
	onError,
}: ImageCardProps) {
	const [error, setError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Resetear estados cuando cambia la fuente
		if (src) {
			setError(false);
			setIsLoading(true);
		}
	}, [src]);

	const handleError = () => {
		setError(true);
		setIsLoading(false);
		if (onError) onError();
	};

	const handleLoad = () => {
		setIsLoading(false);
	};

	const handleClick = () => {
		if (onClick && !error) onClick();
	};

	const metadata = file?.metadata ? getMetadata(file.metadata) : null;
	const imageSrc = src || (file?.path ? `/local-files/${file.path}` : null);

	if (!imageSrc) {
		return (
			<ImageFallback
				className={cn("rounded-lg", className)}
				width={width}
				height={height}
				showPlaceholder
			/>
		);
	}

	if (error) {
		return (
			<ImageFallback
				className={cn("rounded-lg", className)}
				width={width}
				height={height}
				showPlaceholder
				gradientColors={[
					`hsl(${
						(parseInt(file?.id?.split("-")[1] || "0") * 40) % 360
					}, 95%, 75%)`,
					`hsl(${
						(parseInt(file?.id?.split("-")[1] || "0") * 40 + 60) % 360
					}, 95%, 75%)`,
				]}
			/>
		);
	}

	return (
		<div className={cn("relative", className)}>
			{isLoading && (
				<div className="absolute inset-0 bg-background/10 animate-pulse rounded-lg" />
			)}
			<Image
				src={imageSrc}
				alt={alt || file?.name || "Image"}
				width={width}
				height={height}
				className={cn(
					"rounded-lg object-cover transition-all duration-200",
					error ? "opacity-0" : "opacity-100",
					isLoading ? "scale-105 blur-sm" : "scale-100 blur-0"
				)}
				priority={priority}
				onError={handleError}
				onLoad={handleLoad}
				onClick={handleClick}
				quality={90}
				loading={priority ? "eager" : "lazy"}
			/>
		</div>
	);
}

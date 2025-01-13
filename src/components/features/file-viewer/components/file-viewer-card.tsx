"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { FileItem } from "@/types/file-item";

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
	const handleError = () => {
		if (onError) onError();
	};

	const handleClick = () => {
		if (onClick) onClick();
	};

	const imageSrc = file?.thumbnail
		? `data:${file.metadata?.mimeType || "image/webp"};base64,${file.thumbnail}`
		: src;

	if (!imageSrc) {
		return null;
	}

	return (
		<Image
			src={imageSrc}
			alt={alt || file?.name || "Image"}
			width={width}
			height={height}
			className={cn("object-contain", className)}
			priority={priority}
			onError={handleError}
			onClick={handleClick}
			quality={90}
		/>
	);
}

import Image from "next/image";
import { cn } from "@/lib/utils";

export interface ImageCardProps {
	src: string;
	alt: string;
	width?: number;
	height?: number;
	className?: string;
	priority?: boolean;
	onClick?: () => void;
	onLoadingComplete?: () => void;
}

export function ImageCard({
	src,
	alt,
	width = 300,
	height = 300,
	className,
	priority = false,
	onClick,
	onLoadingComplete,
}: ImageCardProps) {
	return (
		<Image
			src={src}
			alt={alt}
			width={width}
			height={height}
			className={cn(
				"object-cover transition-all duration-300 hover:scale-105",
				className
			)}
			priority={priority}
			onClick={onClick}
			onLoadingComplete={onLoadingComplete}
		/>
	);
}

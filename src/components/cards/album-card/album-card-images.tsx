'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';

interface AlbumCardImagesProps {
	recentImages?: string[];
	recentVideos?: string[];
	compact?: boolean;
	className?: string;
}

/**
 * Componente para mostrar imágenes recientes del álbum
 */
export function AlbumCardImages({
	recentImages = [],
	recentVideos = [],
	compact = false,
	className
}: AlbumCardImagesProps) {
	// Combinar imágenes y videos, limitando a 6 items
	const allImages = [...recentImages, ...recentVideos].slice(0, 6);

	// Si no hay imágenes, mostrar placeholder
	if (allImages.length === 0) {
		return (
			<div
				className={cn(
					"flex items-center justify-center p-4 bg-background/10",
					className
				)}
			>
				<p className="text-xs text-muted-foreground">No hay imágenes</p>
			</div>
		);
	}

	// Determinar la estructura de la cuadrícula según la cantidad de imágenes
	const getGridClass = () => {
		if (compact) {
			return "grid-cols-2 grid-rows-2 h-[100px]";
		}

		switch (allImages.length) {
			case 1:
				return "grid-cols-1 grid-rows-1 h-[180px]";
			case 2:
				return "grid-cols-2 grid-rows-1 h-[120px]";
			case 3:
				return "grid-cols-3 grid-rows-1 h-[100px]";
			case 4:
				return "grid-cols-2 grid-rows-2 h-[160px]";
			case 5:
			case 6:
				return "grid-cols-3 grid-rows-2 h-[140px]";
			default:
				return "grid-cols-3 grid-rows-2 h-[140px]";
		}
	};

	// Renderizar la cuadrícula de imágenes
	return (
		<div
			className={cn(
				"grid gap-1 p-1.5 relative overflow-hidden",
				getGridClass(),
				className
			)}
		>
			{allImages.map((imgSrc, index) => (
				<div
					key={`album-img-${imgSrc.substring(imgSrc.lastIndexOf('/') + 1)}`}
					className={cn(
						"relative rounded overflow-hidden bg-background/20",
						index < 3 && "border-b border-white/10"
					)}
				>
					<Image
						src={imgSrc}
						alt={`Imagen de álbum ${index + 1}`}
						fill
						sizes="(max-width: 768px) 100vw, 33vw"
						className="object-cover"
						unoptimized
					/>
					{/* Indicador de video */}
					{recentVideos.includes(imgSrc) && (
						<div className="absolute top-1 right-1 bg-black/50 rounded-full w-4 h-4 flex items-center justify-center">
							<div className="w-0 h-0 border-t-4 border-t-transparent border-l-4 border-l-white border-b-4 border-b-transparent ml-0.5" />
						</div>
					)}
				</div>
			))}
		</div>
	);
}
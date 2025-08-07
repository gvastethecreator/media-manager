import { cn } from '@/lib/utils';

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
	className,
}: AlbumCardImagesProps) {
	// Combinar imágenes y videos, limitando a 6 items
	const allImages = [...recentImages, ...recentVideos].slice(0, 6);

	// Si no hay imágenes, mostrar placeholder
	if (allImages.length === 0) {
		return (
			<div className={cn('flex items-center justify-center bg-background/10 p-4', className)}>
				<p className="text-muted-foreground text-xs">No hay imágenes</p>
			</div>
		);
	}

	// Determinar la estructura de la cuadrícula según la cantidad de imágenes
	const getGridClass = () => {
		if (compact) {
			return 'grid-cols-2 grid-rows-2 h-[100px]';
		}

		switch (allImages.length) {
			case 1:
				return 'grid-cols-1 grid-rows-1 h-[180px]';
			case 2:
				return 'grid-cols-2 grid-rows-1 h-[120px]';
			case 3:
				return 'grid-cols-3 grid-rows-1 h-[100px]';
			case 4:
				return 'grid-cols-2 grid-rows-2 h-[160px]';
			case 5:
			case 6:
				return 'grid-cols-3 grid-rows-2 h-[140px]';
			default:
				return 'grid-cols-3 grid-rows-2 h-[140px]';
		}
	};

	// Renderizar la cuadrícula de imágenes
	return (
		<div className={cn('relative grid gap-1 overflow-hidden p-1.5', getGridClass(), className)}>
			{allImages.map((imgSrc, index) => (
				<div
					className={cn('relative overflow-hidden rounded bg-background/20', index < 3 && 'border-white/10 border-b')}
					key={`album-img-${imgSrc.substring(imgSrc.lastIndexOf('/') + 1)}`}
				>
					<img alt={`Imagen de álbum ${index + 1}`} className="h-full w-full object-cover" src={imgSrc} />
					{/* Indicador de video */}
					{recentVideos.includes(imgSrc) && (
						<div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/50">
							<div className="ml-0.5 h-0 w-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-white" />
						</div>
					)}
				</div>
			))}
		</div>
	);
}

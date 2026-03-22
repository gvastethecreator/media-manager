import { ImageOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAlbumRecentMedia } from '@/lib/api/albums';
import { cn } from '@/lib/utils';

interface AlbumCardImagesProps {
	albumId: string;
	className?: string;
	compact?: boolean;
	recentImages?: string[];
	recentVideos?: string[];
}

/**
 * Componente para mostrar imágenes recientes del álbum
 * Carga automáticamente los thumbnails si no se proporcionan
 */
export function AlbumCardImages({
	albumId,
	recentImages = [],
	recentVideos = [],
	compact = false,
	className,
}: AlbumCardImagesProps) {
	// Cargar thumbnails desde API si no se proporcionan
	const { data: mediaData, isLoading } = useAlbumRecentMedia(albumId, 6);

	// Usar datos proporcionados o cargados desde API
	const images =
		recentImages.length > 0 ? recentImages : (mediaData?.filter((m) => !m.isVideo).map((m) => m.thumbnailUrl) ?? []);
	const videos =
		recentVideos.length > 0 ? recentVideos : (mediaData?.filter((m) => m.isVideo).map((m) => m.thumbnailUrl) ?? []);

	// Combinar imágenes y videos, limitando a 6 items
	const allImages = [...images, ...videos].slice(0, 6);

	// Estado de carga
	if (isLoading && recentImages.length === 0) {
		return (
			<div className={cn('grid grid-cols-3 gap-1 p-1.5', compact ? 'h-25' : 'h-35', className)}>
				{[...new Array(compact ? 4 : 6)].map((_, i) => (
					<Skeleton className="h-full w-full rounded bg-primary/10" key={i} />
				))}
			</div>
		);
	}

	// Si no hay imágenes, mostrar placeholder
	if (allImages.length === 0) {
		return (
			<div className={cn('flex flex-col items-center justify-center gap-2 bg-background/10 p-4', className)}>
				<ImageOff className="h-8 w-8 text-muted-foreground/50" />
				<p className="text-muted-foreground text-sm">Sin imágenes</p>
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
					className={cn('relative overflow-hidden rounded bg-background/20', index < 3 && 'border-border/40 border-b')}
					key={`album-img-${index}-${imgSrc.substring(imgSrc.lastIndexOf('/') + 1)}`}
				>
					<img alt={`Imagen de álbum ${index + 1}`} className="h-full w-full object-cover" src={imgSrc} />
					{/* Indicador de video */}
					{videos.includes(imgSrc) && (
						<div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-muted/50">
							<div className="ml-0.5 h-0 w-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-white" />
						</div>
					)}
				</div>
			))}
		</div>
	);
}

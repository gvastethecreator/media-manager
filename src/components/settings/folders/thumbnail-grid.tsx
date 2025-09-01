import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeThumbailUrl } from './utils/folder-helpers';

interface ThumbnailGridProps {
	images: Array<{ id: string; name: string; thumbnailUrl?: string; thumbnail?: string }>;
	totalImages: number;
	className?: string;
	showCount?: boolean;
}

export function ThumbnailGrid({ images, totalImages, className, showCount = true }: ThumbnailGridProps) {
	// Mostrar máximo 4 thumbnails (2x2)
	const displayImages = images.slice(0, 4);
	const remainingCount = Math.max(0, totalImages - displayImages.length);

	// Si no hay imágenes, no mostrar nada
	if (displayImages.length === 0) {
		return null;
	}

	return (
		<div className={cn('h-full w-full', className)}>
			{/* Grilla fija 2x2 que ocupa todo el contenedor */}
			<div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5">
				{/* Mostrar imágenes disponibles */}
				{Array.from({ length: 4 }).map((_, index) => {
					const image = displayImages[index];
					const rawThumb = image?.thumbnailUrl || image?.thumbnail;
					// Normaliza a data URL si parece base64 sin prefijo
					const normalizedUrl = normalizeThumbailUrl(rawThumb);

					return (
						<div
							className="overflow-hidden border-1 border-muted bg-muted"
							key={image?.id || `slot-${index}`}
						>
							{normalizedUrl ? (
								<div
									className="h-full w-full bg-center bg-cover hover:scale-110"
									style={{ backgroundImage: `url(${normalizedUrl})` }}
									title={image?.name}
								/>
							) : image ? (
								<div className="flex h-full w-full items-center justify-center bg-muted/50">
									<ImageIcon className="h-3 w-3 text-muted-foreground/60" />
								</div>
							) : (
								<div className="h-full w-full border-2 border-muted-foreground/20 border-dashed bg-muted/30" />
							)}
						</div>
					);
				})}
			</div>

			{/* Contador de imágenes restantes */}
			{showCount && remainingCount > 0 && (
				<div className="mt-1 text-center">
					<span className="font-medium text-[9px] text-muted-foreground">+{remainingCount} más</span>
				</div>
			)}
		</div>
	);
}

import { Image as ImageIcon } from 'lucide-react';
import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { normalizeThumbailUrl } from './utils/folder-helpers';

interface ThumbnailGridProps {
	className?: string;
	images: Array<{ id: string; name: string; thumbnailUrl?: string; thumbnail?: string }>;
	showCount?: boolean;
	totalImages: number;
}

export const ThumbnailGrid = memo(function ThumbnailGrid({
	images,
	totalImages,
	className,
	showCount = true,
}: ThumbnailGridProps) {
	// Memoizar cálculos costosos
	const { displayImages, remainingCount } = useMemo(() => {
		const displayImages = images.slice(0, 4);
		const remainingCount = Math.max(0, totalImages - displayImages.length);
		return { displayImages, remainingCount };
	}, [images, totalImages]);

	// Memoizar las URLs normalizadas para evitar recálculos
	const normalizedImages = useMemo(() => {
		return displayImages.map((image) => {
			const rawThumb = image?.thumbnailUrl || image?.thumbnail;
			return {
				...image,
				normalizedUrl: normalizeThumbailUrl(rawThumb),
			};
		});
	}, [displayImages]);

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
					const normalizedImage = normalizedImages[index];
					const image = displayImages[index];

					return (
						<div className="overflow-hidden border-1 border-muted bg-muted" key={image?.id || `slot-${index}`}>
							{normalizedImage?.normalizedUrl ? (
								<div
									className="h-full w-full bg-center bg-cover hover:scale-110"
									style={{ backgroundImage: `url(${normalizedImage.normalizedUrl})` }}
									title={normalizedImage.name}
								/>
							) : image ? (
								<div className="flex h-full w-full items-center justify-center bg-muted/50">
									<ImageIcon className="h-3 w-3 text-muted-foreground/60" />
								</div>
							) : (
								<div className="h-full w-full border border-muted-foreground/20 border-dashed bg-muted/30" />
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
});

import { Image as ImageIcon } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';
import { motion } from '@/components/ui/motion-shim';
import { cn } from '@/lib/utils';
import { useImageResources } from '@/store/image-resources.store';
import type { ImageItem } from './file-viewer.types';
import { isValidSrc, THUMBNAIL_SIZES } from './file-viewer.types';

export const ThumbnailItem = memo(function ThumbnailItemImpl({
	image,
	isActive,
	onClick,
}: {
	image: ImageItem;
	isActive: boolean;
	onClick: () => void;
}) {
	const imageResources = useImageResources();
	const [error, setError] = useState(false);
	const [thumbnail, setThumbnail] = useState<string | null>(null);

	// Obtener la miniatura de forma optimizada
	useEffect(() => {
		// Prioridad:
		// 1. thumbnailUrl directo del item (si existe)
		// 2. thumbnail del store de recursos
		// 3. Construcción manual de URL si tenemos ID

		let url = image.thumbnailUrl;

		if (!url && image.id) {
			if (image.type === 'video' || image.mimeType?.startsWith('video/')) {
				url = `/api/videos/${image.id}/thumbnail`;
			} else {
				url = `/api/images/${image.id}/thumbnail`;
			}
		}

		if (url !== thumbnail) {
			setThumbnail(url || null);
		}

		// Resetear error si conseguimos thumbnail
		if (url && error) setError(false);
	}, [image.id, image.thumbnailUrl, image.type, image.mimeType, thumbnail, error]);

	// Memoizar la clase base
	const baseClassName = useMemo(
		() =>
			cn(
				'relative mr-2 cursor-pointer overflow-hidden rounded-md',
				isActive ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-primary/50'
			),
		[isActive]
	);

	// Renderizado condicional memoizado
	const thumbnailContent = useMemo(() => {
		if (error || !thumbnail) {
			return (
				<div className="flex h-full w-full items-center justify-center bg-muted">
					<ImageIcon className="h-6 w-6 text-muted-foreground/50" />
				</div>
			);
		}

		return (
			<div className="h-full w-full">
				{isValidSrc(thumbnail) ? (
					<img
						alt={image.name}
						className="h-full w-full object-cover"
						loading="lazy"
						onError={() => setError(true)}
						src={thumbnail}
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-muted">
						<ImageIcon className="h-6 w-6 text-muted-foreground/50" />
					</div>
				)}
			</div>
		);
	}, [error, thumbnail, image.name]);

	// Memoizar los estilos de animación
	const animateStyles = useMemo(
		() => ({
			scale: isActive ? 1.07 : 1,
			opacity: isActive ? 1 : 0.9,
		}),
		[isActive]
	);

	return (
		<motion.div
			animate={animateStyles}
			className={baseClassName}
			layout
			onClick={onClick}
			style={{ width: THUMBNAIL_SIZES.normal.width, height: THUMBNAIL_SIZES.normal.height }}
			transition={{ type: 'spring', stiffness: 260, damping: 24, mass: 0.6 }}
			whileHover={{ opacity: 1, scale: 1.05 }}
			whileTap={{ scale: 0.98 }}
		>
			{thumbnailContent}
			{isActive && (
				<motion.div
					animate={{ opacity: 1 }}
					className="pointer-events-none absolute inset-0 bg-primary/10"
					initial={{ opacity: 0 }}
					layout
					transition={{ duration: 0.25 }}
				/>
			)}
		</motion.div>
	);
});

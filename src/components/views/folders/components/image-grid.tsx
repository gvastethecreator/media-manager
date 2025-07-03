/**
 * @file ImageGrid - Componente especializado para mostrar imágenes de una carpeta
 * @module components/views/folders/components/image-grid
 */

import { Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientLogger } from '@/lib/logger/client-logger';
import { useImageStore } from '@/store/entities/image';
import type { ImageWithStats } from '@/types/entities/image';

const logger = clientLogger.withContext('ImageGrid');

interface ImageGridProps {
	folderId: string;
	onImageClick?: (image: ImageWithStats) => void;
	onImageDoubleClick?: (image: ImageWithStats) => void;
}

const ImageCard = memo(function ImageCard({
	image,
	onClick,
	onDoubleClick,
}: {
	image: ImageWithStats;
	onClick?: () => void;
	onDoubleClick?: () => void;
}) {
	return (
		<button
			type="button"
			className="group relative aspect-square overflow-hidden rounded-lg bg-muted/50 border border-border/50 hover:border-border transition-all duration-200 cursor-pointer w-full p-0"
			onClick={onClick}
			onDoubleClick={onDoubleClick}
			aria-label={`Imagen: ${image.name}`}
		>
			{/* Thumbnail */}
			<div className="absolute inset-0 flex items-center justify-center">
				{image.path ? (
					<div
						className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-200"
						style={{ backgroundImage: `url(/api/images/thumbnail/${image.id})` }}
					>
						{/* Fallback content en caso de error */}
						<div className="hidden w-full h-full flex-col items-center justify-center text-muted-foreground">
							<ImageIcon className="w-8 h-8 mb-2" />
							<span className="text-xs text-center px-2">{image.name}</span>
						</div>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground">
						<ImageIcon className="w-8 h-8 mb-2" />
						<span className="text-xs text-center px-2">{image.name}</span>
					</div>
				)}
			</div>

			{/* Overlay con información */}
			<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />

			{/* Información de la imagen */}
			<div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
				<p className="text-white text-xs font-medium truncate">{image.name}</p>
				<p className="text-white/70 text-xs">
					{image.width}×{image.height} • {Math.round(image.size / 1024)}KB
				</p>
			</div>
		</button>
	);
});

export const ImageGrid = memo(function ImageGrid({ folderId, onImageClick, onImageDoubleClick }: ImageGridProps) {
	// Obtener imágenes de la carpeta específica
	const images = useImageStore((state) => state.getImagesByFolder(folderId));

	// Ordenar imágenes por fecha de actualización
	const sortedImages = useMemo(() => {
		return images.sort(
			(a: ImageWithStats, b: ImageWithStats) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
		);
	}, [images]);

	logger.debug(`🖼️ Mostrando ${sortedImages.length} imágenes para carpeta ${folderId}`);

	if (sortedImages.length === 0) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<div className="text-center text-muted-foreground">
					<ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
					<p className="text-lg font-medium mb-2">No hay imágenes</p>
					<p className="text-sm">Esta carpeta está vacía o no se han indexado imágenes aún.</p>
				</div>
			</div>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="p-6">
				{/* Grid de imágenes */}
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
					{sortedImages.map((image: ImageWithStats, index: number) => (
						<motion.div
							key={image.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.02, duration: 0.3 }}
						>
							<ImageCard
								image={image}
								onClick={() => onImageClick?.(image)}
								onDoubleClick={() => onImageDoubleClick?.(image)}
							/>
						</motion.div>
					))}
				</div>

				{/* Footer con información */}
				<div className="mt-8 pt-6 border-t border-border">
					<p className="text-sm text-muted-foreground text-center">
						{sortedImages.length} {sortedImages.length === 1 ? 'imagen' : 'imágenes'}
					</p>
				</div>
			</div>
		</ScrollArea>
	);
});

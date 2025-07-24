import React from 'react';
/**
 * @file Vista masonry V2 - Layout tipo Pinterest
 * @module components/features/file-browser/views/masonry-view-v2
 */

import { PlayCircleIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useImageResources } from '@/store/image-resources.store';
import { AnyEntityWithStats, isImageWithStats, isVideoWithStats } from '@/types/migration';

interface MasonryViewProps {
	items: AnyEntityWithStats[];
	itemSize: number;
	selectedIds: string[];
	containerWidth: number;
	onItemClick: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: AnyEntityWithStats) => void;
}

interface MasonryItem {
	id: string;
	aspectRatio: number;
	columnIndex: number;
	top: number;
}

// Componente interno para manejar thumbnails de imágenes
const ImageThumbnail = memo(function ImageThumbnail({
	imageId,
	imageName,
	className,
}: {
	imageId: string;
	imageName: string;
	className: string;
}) {
	const { getThumbnail, isLoading: isResourceLoading } = useImageResources();
	const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
	const [thumbnailLoading, setThumbnailLoading] = useState(false);

	useEffect(() => {
		const loadThumbnail = async () => {
			if (!imageId || thumbnailUrl) return;

			setThumbnailLoading(true);
			try {
				const url = await getThumbnail(imageId);
				if (url) {
					setThumbnailUrl(url);
				}
			} catch (error) {
				console.error('Error cargando thumbnail:', error);
			} finally {
				setThumbnailLoading(false);
			}
		};

		loadThumbnail();
	}, [imageId, getThumbnail, thumbnailUrl]);

	const displayThumbnailUrl = thumbnailUrl || `/api/images/${imageId}/thumbnail`;
	const shouldShowLoading = thumbnailLoading || isResourceLoading(imageId);

	if (shouldShowLoading) {
		return <div className={cn(className, 'animate-pulse bg-muted')} />;
	}

	return (
		<img
			src={displayThumbnailUrl}
			alt={imageName}
			className={className}
			loading="lazy"
			onError={(e) => {
				console.warn(`Error cargando thumbnail para ${imageId}:`, e);
			}}
		/>
	);
});

export const MasonryView = memo<MasonryViewProps>(function MasonryView({
	items,
	itemSize,
	selectedIds,
	containerWidth,
	onItemClick,
	onItemDoubleClick,
}) {
	// Calcular columnas y layout masonry
	const { columns, columnWidth, layoutItems, totalHeight, itemsMap } = useMemo(() => {
		const gap = 16;
		const padding = 24;
		const minColumnWidth = Math.max(150, Math.min(itemSize * 1.5, 300));
		const availableWidth = containerWidth - padding * 2;
		const cols = Math.max(2, Math.floor((availableWidth + gap) / (minColumnWidth + gap)));
		const colWidth = (availableWidth - gap * (cols - 1)) / cols;

		// Arrays para rastrear la altura de cada columna
		const columnHeights = new Array(cols).fill(0);

		// Calcular posiciones para cada item
		const positioned = items.map((item) => {
			// Obtener aspect ratio
			let aspectRatio = 1;
			if (isImageWithStats(item) && 'width' in item && 'height' in item) {
				aspectRatio = (item.width && item.height) ? item.width / item.height : 1;
			} else if (isVideoWithStats(item) && 'width' in item && 'height' in item) {
				aspectRatio = (item.width ?? 1) / (item.height ?? 1);
			}

			// Limitar aspect ratio para evitar items muy altos o muy anchos
			aspectRatio = Math.max(0.5, Math.min(aspectRatio, 2));

			// Encontrar la columna más corta
			const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
			const itemHeight = colWidth / aspectRatio;

			const positioned: MasonryItem = {
				id: item.id,
				aspectRatio,
				columnIndex: shortestColumnIndex,
				top: columnHeights[shortestColumnIndex],
			};

			// Actualizar altura de la columna
			columnHeights[shortestColumnIndex] += itemHeight + gap;

			return positioned;
		});

		// Crear un mapa para acceso rápido a los items originales
		const itemsMap = new Map(items.map(item => [item.id, item]));

		const maxHeight = Math.max(...columnHeights);

		return {
			columns: cols,
			columnWidth: colWidth,
			layoutItems: positioned,
			totalHeight: maxHeight,
			itemsMap,
		};
	}, [items, itemSize, containerWidth]);

	return (
		<div className="relative p-6" style={{ height: `${totalHeight}px` }}>
			{layoutItems.map((layoutItem, index) => {
				const item = itemsMap.get(layoutItem.id);
				if (!item) return null;
				
				const isSelected = selectedIds.includes(item.id);
				const isImage = isImageWithStats(item);
				const isVideo = isVideoWithStats(item);
				const itemHeight = columnWidth / layoutItem.aspectRatio;
				const gap = 16;
				const left = layoutItem.columnIndex * (columnWidth + gap);

				return (
					<motion.div
						key={item.id}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{
							delay: Math.min(index * 0.02, 0.3),
							duration: 0.3,
							ease: 'easeOut',
						}}
						className={cn(
							'absolute cursor-pointer group',
							'rounded-lg overflow-hidden',
							'bg-muted/10',
							'transition-all duration-300',
							'hover:shadow-xl hover:scale-[1.02]',
							isSelected && 'ring-2 ring-primary ring-offset-2'
						)}
						style={{
					width: `${columnWidth}px`,
					height: `${itemHeight}px`,
					left: `${left}px`,
					top: `${layoutItem.top}px`,
				}}
						onClick={(e) => {
							e.stopPropagation();
							onItemClick(item, e);
						}}
						onDoubleClick={(e) => {
							e.stopPropagation();
							onItemDoubleClick(item);
						}}
					>
						{/* Contenido principal */}
						{isImage && item.id ? (
							<>
								<ImageThumbnail
									imageId={item.id}
									imageName={item.name || item.id}
									className="w-full h-full object-cover"
								/>
								<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
							</>
						) : (
							<div className="w-full h-full bg-muted/20 flex items-center justify-center">
								<span className="text-4xl opacity-50">{('emoji' in item ? item.emoji : undefined) || '📄'}</span>
							</div>
						)}

						{/* Información en hover */}
						<div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
							<h3 className="text-white text-sm font-medium truncate drop-shadow-md">{'name' in item ? item.name : item.id}</h3>
							{isImage && 'width' in item && 'height' in item && (
							<p className="text-white/80 text-xs drop-shadow-md">
								{item.width}x{item.height} • {'size' in item && item.size ? `${(item.size / 1024 / 1024).toFixed(1)} MB` : 'N/A'}
							</p>
						)}
						</div>

						{/* Indicadores */}
						{isVideo && (
							<div className="absolute top-2 right-2">
								<PlayCircleIcon className="h-6 w-6 text-white drop-shadow-lg" />
							</div>
						)}

						{'isFavorite' in item && item.isFavorite && (
							<div className="absolute top-2 left-2">
								<span className="text-yellow-500 text-lg drop-shadow-lg">★</span>
							</div>
						)}

						{/* Badge de estadísticas */}
				{'stats' in item && typeof item.stats === 'object' && item.stats && 'totalAssociations' in item.stats && typeof (item.stats as any).totalAssociations === 'number' && (item.stats as any).totalAssociations > 0 && (
					<div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded-md">
						<span className="text-white text-xs">{(item.stats as any).totalAssociations} elementos</span>
					</div>
				)}
					</motion.div>
				);
			})}
		</div>
	);
});

/**
 * 📝 Características:
 * - Layout masonry dinámico tipo Pinterest
 * - Cálculo inteligente de columnas según ancho
 * - Respeta aspect ratio de imágenes
 * - Animaciones escalonadas suaves
 * - Información detallada en hover
 * - Indicadores visuales para diferentes tipos
 * - Optimizado para galería de imágenes
 */

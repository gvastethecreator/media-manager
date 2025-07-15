import React from 'react';
/**
 * @file Vista masonry V2 - Layout tipo Pinterest
 * @module components/features/file-browser/views/masonry-view-v2
 */

import { PlayCircleIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { EntityWithStats } from '@/types/migration';
import { isImageWithStats, isVideoWithStats } from '@/types/migration';

interface MasonryViewProps {
	items: EntityWithStats[];
	itemSize: number;
	selectedIds: string[];
	containerWidth: number;
	onItemClick: (item: EntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: EntityWithStats) => void;
}

interface MasonryItem extends EntityWithStats {
	aspectRatio: number;
	columnIndex: number;
	top: number;
}

export const MasonryView = memo<MasonryViewProps>(function MasonryView({
	items,
	itemSize,
	selectedIds,
	containerWidth,
	onItemClick,
	onItemDoubleClick,
}) {
	// Calcular columnas y layout masonry
	const { columns, columnWidth, layoutItems, totalHeight } = useMemo(() => {
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
			if (isImageWithStats(item) && item.statistics) {
				aspectRatio = item.statistics.aspectRatio || 1;
			} else if (isVideoWithStats(item) && 'width' in item && 'height' in item) {
				aspectRatio = item.width / item.height;
			}

			// Limitar aspect ratio para evitar items muy altos o muy anchos
			aspectRatio = Math.max(0.5, Math.min(aspectRatio, 2));

			// Encontrar la columna más corta
			const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
			const itemHeight = colWidth / aspectRatio;

			const positioned: MasonryItem = {
				...item,
				aspectRatio,
				columnIndex: shortestColumnIndex,
				top: columnHeights[shortestColumnIndex],
			};

			// Actualizar altura de la columna
			columnHeights[shortestColumnIndex] += itemHeight + gap;

			return positioned;
		});

		const maxHeight = Math.max(...columnHeights);

		return {
			columns: cols,
			columnWidth: colWidth,
			layoutItems: positioned,
			totalHeight: maxHeight,
		};
	}, [items, itemSize, containerWidth]);

	return (
		<div className="relative p-6" style={{ height: `${totalHeight}px` }}>
			{layoutItems.map((item, index) => {
				const isSelected = selectedIds.includes(item.id);
				const isImage = isImageWithStats(item);
				const isVideo = isVideoWithStats(item);
				const itemHeight = columnWidth / item.aspectRatio;
				const gap = 16;
				const left = item.columnIndex * (columnWidth + gap);

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
							top: `${item.top}px`,
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
						{isImage && item.thumbnailUrl ? (
							<>
								<img
									src={item.thumbnailUrl}
									alt={item.name || 'Imagen'}
									className="w-full h-full object-cover"
									loading="lazy"
								/>
								<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
							</>
						) : (
							<div className="w-full h-full bg-muted/20 flex items-center justify-center">
								<span className="text-4xl opacity-50">{item.emoji || '📄'}</span>
							</div>
						)}

						{/* Información en hover */}
						<div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
							<h3 className="text-white text-sm font-medium truncate drop-shadow-md">{item.name || 'Sin nombre'}</h3>
							{isImage && item.statistics && (
								<p className="text-white/80 text-xs drop-shadow-md">
									{item.statistics.dimensions} • {item.formattedSize}
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
						{item.statistics && item.statistics.totalAssociations > 0 && (
							<div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded-md">
								<span className="text-white text-xs">{item.statistics.totalAssociations} elementos</span>
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

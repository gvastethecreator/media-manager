/**
 * @file Vista de grid simple V2 - Miniaturas optimizadas
 * @module components/features/file-browser/views/simple-grid-view-v2
 */
'use client';

import { cn } from '@/lib/utils';
import type { EntityWithStats } from '@/types/migration';
import { getEntityStatsType, isImageWithStats, isVideoWithStats } from '@/types/migration';
import { FileIcon, FileTextIcon, FolderIcon, ImageIcon, MusicIcon, PlayCircleIcon, VideoIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { memo } from 'react';

interface SimpleGridViewProps {
	items: EntityWithStats[];
	itemSize: number;
	selectedIds: string[];
	containerWidth: number;
	onItemClick: (item: EntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: EntityWithStats) => void;
}

export const SimpleGridView = memo<SimpleGridViewProps>(function SimpleGridView({
	items,
	itemSize,
	selectedIds,
	containerWidth,
	onItemClick,
	onItemDoubleClick,
}) {
	// Calcular grid responsivo
	const minItemSize = Math.max(80, Math.min(itemSize, 200));
	const gap = 8;
	const padding = 16;
	const availableWidth = containerWidth - padding * 2;
	const columns = Math.max(2, Math.floor((availableWidth + gap) / (minItemSize + gap)));
	const actualItemSize = (availableWidth - gap * (columns - 1)) / columns;

	return (
		<div className="p-4">
			<div
				className="grid gap-2"
				style={{
					gridTemplateColumns: `repeat(${columns}, 1fr)`,
				}}
			>
				{items.map((item, index) => {
					const isSelected = selectedIds.includes(item.id);
					const type = getEntityStatsType(item);
					const isImage = isImageWithStats(item);
					const isVideo = isVideoWithStats(item);

					return (
						<motion.div
							key={item.id}
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{
								delay: Math.min(index * 0.01, 0.2),
								duration: 0.2,
							}}
							className={cn(
								'relative cursor-pointer group',
								'rounded-lg overflow-hidden',
								'bg-muted/20 hover:bg-muted/40',
								'transition-all duration-200',
								isSelected && 'ring-2 ring-primary ring-offset-1'
							)}
							onClick={(e) => {
								e.stopPropagation();
								onItemClick(item, e);
							}}
							onDoubleClick={(e) => {
								e.stopPropagation();
								onItemDoubleClick(item);
							}}
							style={{
								width: `${actualItemSize}px`,
								height: `${actualItemSize}px`,
							}}
						>
							{/* Miniatura o ícono */}
							{isImage && item.thumbnailUrl ? (
								<img
									src={item.thumbnailUrl}
									alt={item.name || 'Imagen'}
									className="absolute inset-0 w-full h-full object-cover"
									loading="lazy"
								/>
							) : (
								<div className="absolute inset-0 flex items-center justify-center">
									{type === 'image' && <ImageIcon className="h-8 w-8 text-muted-foreground" />}
									{type === 'video' && <VideoIcon className="h-8 w-8 text-muted-foreground" />}
									{type === 'folder' && <FolderIcon className="h-8 w-8 text-muted-foreground" />}
									{type === 'audio' && <MusicIcon className="h-8 w-8 text-muted-foreground" />}
									{type === 'document' && <FileTextIcon className="h-8 w-8 text-muted-foreground" />}
									{!['image', 'video', 'folder', 'audio', 'document'].includes(type) && (
										<FileIcon className="h-8 w-8 text-muted-foreground" />
									)}
								</div>
							)}

							{/* Overlay con información en hover */}
							<div
								className={cn(
									'absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent',
									'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
									'flex flex-col justify-end p-2'
								)}
							>
								<p className="text-white text-xs font-medium truncate">{item.name || 'Sin nombre'}</p>
								{isImage && item.formattedDimensions && (
									<p className="text-white/70 text-[10px]">{item.formattedDimensions}</p>
								)}
							</div>

							{/* Indicador de video */}
							{isVideo && (
								<div className="absolute top-1 right-1">
									<PlayCircleIcon className="h-4 w-4 text-white drop-shadow-md" />
								</div>
							)}

							{/* Badge de favorito */}
							{'isFavorite' in item && item.isFavorite && (
								<div className="absolute top-1 left-1">
									<span className="text-yellow-500 text-sm drop-shadow-md">★</span>
								</div>
							)}

							{/* Indicador de selección */}
							{isSelected && (
								<div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										className="w-3 h-3 text-white"
										aria-label="Seleccionado"
									>
										<title>Seleccionado</title>
										<polyline points="20 6 9 17 4 12" />
									</svg>
								</div>
							)}
						</motion.div>
					);
				})}
			</div>
		</div>
	);
});

/**
 * 📝 Características:
 * - Grid compacto con miniaturas cuadradas
 * - Carga perezosa de imágenes
 * - Información en hover
 * - Indicadores visuales (video, favorito, selección)
 * - Animaciones sutiles
 * - Responsive basado en itemSize
 */

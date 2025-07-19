/**
 * @file Vista de lista virtualizada usando TanStack Virtual
 * @module components/features/file-browser/views/virtualized-list-view
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'motion/react';
import React, { memo, useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { EntityWithStats } from '@/types/migration';
import { useImageResources } from '@/store/image-resources.store';

interface VirtualizedListViewProps {
	items: EntityWithStats[];
	itemSize: number;
	selectedIds: string[];
	containerWidth: number;
	onItemClick: (item: EntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: EntityWithStats) => void;
}

// Componente interno para manejar thumbnails de imágenes
const ImageThumbnail = memo(function ImageThumbnail({
	imageId,
	imageName,
	className
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
		return (
			<div className={cn(className, "animate-pulse bg-muted")} />
		);
	}

	return (
		<img
			src={displayThumbnailUrl}
			alt={imageName}
			className={className}
			onError={(e) => {
				console.warn(`Error cargando thumbnail para ${imageId}:`, e);
				// Fallback visual
				const target = e.target as HTMLImageElement;
				target.style.display = 'none';
			}}
		/>
	);
});

export const VirtualizedListView = memo<VirtualizedListViewProps>(function VirtualizedListView({
	items,
	selectedIds,
	onItemClick,
	onItemDoubleClick,
}) {
	const parentRef = useRef<any>(null);

	// Configurar virtualizador
	const rowVirtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 60, // Altura estimada por fila
		overscan: 10,
	});

	return (
		<div
			ref={parentRef}
			className="h-full w-full overflow-auto"
			style={{
				contain: 'strict',
			}}
		>
			<div
				style={{
					height: `${rowVirtualizer.getTotalSize()}px`,
					width: '100%',
					position: 'relative',
				}}
			>
				{rowVirtualizer.getVirtualItems().map((virtualItem) => {
					const item = items[virtualItem.index];
					const isSelected = selectedIds.includes(item.id);

					return (
						<motion.div
							key={item.id}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{
								delay: Math.min(virtualItem.index * 0.01, 0.3),
								duration: 0.3,
							}}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: `${virtualItem.size}px`,
								transform: `translateY(${virtualItem.start}px)`,
							}}
							className={cn(
								'flex items-center gap-3 px-4 py-2 cursor-pointer transition-all duration-200',
								'hover:bg-accent/50',
								isSelected && 'bg-accent ring-2 ring-primary'
							)}
							onClick={(e) => {
								e.stopPropagation();
								onItemClick(item, e);
							}}
							onDoubleClick={(e) => {
								e.stopPropagation();
								onItemDoubleClick(item);
							}}
						>
							{/* Thumbnail o icono */}
							<div className="w-12 h-12 bg-muted rounded flex-shrink-0 flex items-center justify-center">
								{item.entityType === 'image' && item.id ? (
									<ImageThumbnail
										imageId={item.id}
										imageName={item.name}
										className="w-12 h-12 object-cover rounded"
									/>
								) : (
									<div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center">
										<span className="text-xs font-semibold text-primary">{item.name.charAt(0).toUpperCase()}</span>
									</div>
								)}
							</div>

							{/* Información del item */}
							<div className="flex-1 min-w-0">
								<div className="font-medium text-sm truncate">{item.name}</div>
								<div className="text-xs text-muted-foreground">
									{item.entityType} • {item.stats?.imageCount || 0} imágenes
								</div>
							</div>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
});

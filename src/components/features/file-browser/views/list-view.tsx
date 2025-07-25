/**
 * @file Vista de lista usando TanStack Virtual
 * @module components/features/file-browser/views/list-view
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'motion/react';
import React, { memo, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useImageResources } from '@/store/image-resources.store';
import type { AnyEntityWithStats } from '@/types/migration';

interface ListViewProps {
	items: AnyEntityWithStats[];
	itemSize: number;
	selectedIds: string[];
	containerWidth: number;
	onItemClick: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: AnyEntityWithStats) => void;
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
			onError={(e) => {
				console.warn(`Error cargando thumbnail para ${imageId}:`, e);
				// Fallback visual
				const target = e.target as HTMLImageElement;
				target.style.display = 'none';
			}}
		/>
	);
});

export const ListView = memo<ListViewProps>(function ListView({
	items,
	selectedIds,
	containerWidth,
	onItemClick,
	onItemDoubleClick,
}) {
	const parentRef = useRef<any>(null);
	const [containerHeight, setContainerHeight] = useState<number>(600);

	// Efecto para medir y establecer altura del contenedor
	useEffect(() => {
		if (parentRef.current) {
			const scrollAreaViewport = parentRef.current.closest('[data-radix-scroll-area-viewport]');
			if (scrollAreaViewport) {
				const observer = new ResizeObserver((entries) => {
					for (const entry of entries) {
						const height = entry.contentRect.height;
						if (height > 0) {
							setContainerHeight(height - 48); // Restar padding
						}
					}
				});
				observer.observe(scrollAreaViewport);
				return () => observer.disconnect();
			}
			// Fallback: usar el viewport más cercano
			const viewport = parentRef.current.closest('.flex-1, .h-full');
			if (viewport) {
				setContainerHeight(viewport.clientHeight - 48);
			}
		}
	}, []);

	// Configurar virtualizador con altura fija para evitar solapamiento
	const rowVirtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 88, // Altura aumentada: 72px + 16px margin/padding
		overscan: 5,
	});

	return (
		<div
			ref={parentRef}
			className="w-full overflow-auto"
			style={{
				height: `${containerHeight}px`,
				contain: 'strict',
				padding: '8px 16px',
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
								height: '80px', // Altura aumentada para evitar solapamiento
								transform: `translateY(${virtualItem.start}px)`,
							}}
							className={cn(
								'flex items-center gap-3 px-3 py-3 mx-1 mb-2 rounded-md cursor-pointer transition-all duration-200',
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
								{'entityType' in item && item.entityType === 'image' && item.id ? (
									<ImageThumbnail
										imageId={item.id}
										imageName={('name' in item ? item.name : undefined) || item.id || 'unknown'}
										className="w-12 h-12 object-cover rounded"
									/>
								) : (
									<div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center">
										<span className="text-xs font-semibold text-primary">
											{'name' in item && item.name ? item.name.charAt(0).toUpperCase() : 'U'}
										</span>
									</div>
								)}
							</div>

							{/* Información del item */}
							<div className="flex-1 min-w-0">
								<div className="font-medium text-sm truncate">
									{('name' in item ? item.name : undefined) || item.id || 'Unknown'}
								</div>
								<div className="text-xs text-muted-foreground">
									{'entityType' in item ? item.entityType : 'unknown'} •
									{'stats' in item && item.stats && typeof item.stats === 'object' && 'imageCount' in item.stats
										? item.stats.imageCount
										: 0}{' '}
									imágenes
								</div>
							</div>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
});

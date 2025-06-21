'use client';

import { cn } from '@/lib/utils';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import type { AnyEntity } from '@/types/entities';
import { Meh, Star } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { memo, useEffect, useRef, useState } from 'react';
import { ImageRenderer } from '../image-renderer';
import '../styles/scrollbar.css';

/**
 * Un componente de Grid View simplificado que no utiliza virtualización para evitar loops
 * de renderizado en situaciones complejas.
 */

interface SimpleGridViewProps {
	items: AnyEntity[];
	onItemClick?: (item: AnyEntity, index: number, e: React.MouseEvent) => void;
	onItemDoubleClick?: (item: AnyEntity) => void;
	onContextMenu?: (item: AnyEntity, e: React.MouseEvent) => void;
	className?: string;
}

export const SimpleGridView = memo<SimpleGridViewProps>(function SimpleGridView({
	items,
	onItemClick,
	onItemDoubleClick,
	onContextMenu,
	className,
}) {
	const { selectedIds, activeId } = useSelectionStore();
	const itemSize = useViewOptionsStore((state) => state.itemSize);
	const containerRef = useRef<HTMLDivElement>(null);
	const [columnCount, setColumnCount] = useState(4);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const calculateColumns = () => {
			const containerWidth = container.clientWidth;
			const gap = 16;
			const effectiveItemSize = itemSize + gap;
			const columns = Math.max(1, Math.floor((containerWidth - gap) / effectiveItemSize));
			setColumnCount(columns);
		};

		calculateColumns();

		const resizeObserver = new ResizeObserver(calculateColumns);
		resizeObserver.observe(container);

		return () => {
			resizeObserver.unobserve(container);
		};
	}, [itemSize]);

	return (
		<div
			ref={containerRef}
			className={cn('grid p-4 gap-4', className)}
			style={{
				gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
			}}
		>
			{items.map((item, index) => {
				const isSelected = selectedIds.includes(item.id);

				const handleClick = (e: React.MouseEvent) => {
					onItemClick?.(item, index, e);
				};

				const handleDoubleClick = () => {
					onItemDoubleClick?.(item);
				};

				const handleContextMenu = (e: React.MouseEvent) => {
					e.preventDefault();
					onContextMenu?.(item, e);
				};

				return (
					<motion.div
						key={item.id}
						layout
						className={cn(
							'flex flex-col rounded-md border overflow-hidden',
							'transition-all duration-200',
							isSelected ? 'ring-2 ring-primary border-primary' : 'ring-0'
						)}
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						onClick={handleClick}
						onDoubleClick={handleDoubleClick}
						onContextMenu={handleContextMenu}
					>
						<div className="aspect-square w-full bg-muted/50 relative">
							{item.thumbnail ? (
								<ImageRenderer src={item.thumbnail} alt={item.name || ''} className="h-full w-full object-cover" />
							) : (
								<div className="flex items-center justify-center h-full">
									<Meh className="h-10 w-10 text-muted-foreground/50" />
								</div>
							)}

							{item.isFavorite && (
								<div className="absolute top-1.5 right-1.5 bg-background/80 rounded-full p-0.5">
									<Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
								</div>
							)}
						</div>

						<div className="p-2 text-xs">
							<div className="truncate font-medium">{item.name}</div>
						</div>
					</motion.div>
				);
			})}
		</div>
	);
});

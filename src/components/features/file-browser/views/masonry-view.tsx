'use client';

import { cn } from '@/lib/utils';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import type { FileItem } from '@/types/file-item';
import { Star } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImageRenderer } from '../image-renderer';

interface MasonryItemProps {
	item: FileItem;
	isSelected?: boolean;
	isActive?: boolean;
	onClick?: (item: FileItem, e: React.MouseEvent) => void;
	onDoubleClick?: (item: FileItem) => void;
	onContextMenu?: (item: FileItem, e: React.MouseEvent) => void;
	style?: React.CSSProperties;
}

const getMetadata = (metadata: string | null) => {
	if (!metadata) {
		return null;
	}
	try {
		return JSON.parse(metadata);
	} catch {
		return null;
	}
};

function formatBytes(bytes: number): string {
	if (bytes === 0) {
		return '0 B';
	}
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

export const MasonryItem = memo(function MasonryItem({
	item,
	isSelected,
	isActive,
	onClick,
	onDoubleClick,
	onContextMenu,
	style,
}: MasonryItemProps) {
	// Memoizamos los handlers para evitar recreaciones
	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			onClick?.(item, e);
		},
		[onClick, item]
	);

	const handleDoubleClick = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			onDoubleClick?.(item);
		},
		[onDoubleClick, item]
	);

	const handleContextMenu = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			onContextMenu?.(item, e);
		},
		[onContextMenu, item]
	);

	// Memoizamos la clase para evitar recálculos
	const itemClassName = useMemo(() => {
		return cn(
			'relative overflow-hidden rounded-md border border-border/40 bg-card transition-all',
			isSelected && 'ring-2 ring-primary ring-offset-2',
			isActive && 'ring-2 ring-secondary ring-offset-1'
		);
	}, [isSelected, isActive]);

	const metadata = getMetadata(item.metadata);
	const thumbnailUrl = item.thumbnail || `/api/images/${item.id}/thumbnail`;

	return (
		<motion.div
			className={itemClassName}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
			onContextMenu={handleContextMenu}
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			style={style}
			layout
		>
			{/* Imagen */}
			<div className="w-full h-full overflow-hidden">
				<ImageRenderer
					src={thumbnailUrl}
					alt={item.name}
					className="h-full w-full object-cover transition-transform"
					onError={() => { }}
				/>
			</div>

			{/* Overlay con información al pasar el mouse */}
			<div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-colors flex flex-col justify-end p-2 opacity-0 hover:opacity-100">
				<div className="text-white text-sm font-medium truncate">{item.name}</div>
				{item.isFavorite && (
					<div className="absolute top-2 right-2">
						<Star className="h-4 w-4 text-yellow-500 fill-current" />
					</div>
				)}
			</div>
		</motion.div>
	);
});

export interface MasonryViewProps {
	items: FileItem[];
	onItemClick?: (item: FileItem, e: React.MouseEvent) => void;
	onItemDoubleClick?: (item: FileItem) => void;
	onContextMenu?: (item: FileItem, e: React.MouseEvent) => void;
	className?: string;
}

export const MasonryView = memo(function MasonryView({
	items,
	onItemClick,
	onItemDoubleClick,
	onContextMenu,
	className,
}: MasonryViewProps) {
	const { selectedIds, activeId } = useSelectionStore();
	const { itemSize } = useViewOptionsStore();
	const containerRef = useRef<HTMLDivElement>(null);
	const [columns, setColumns] = useState(3);

	// Calcular el número de columnas según el ancho del contenedor
	useEffect(() => {
		const updateColumns = () => {
			if (!containerRef.current) return;
			const width = containerRef.current.clientWidth;
			const newColumns = Math.max(1, Math.floor(width / (itemSize + 16)));
			setColumns(newColumns);
		};

		updateColumns();
		window.addEventListener('resize', updateColumns);
		return () => window.removeEventListener('resize', updateColumns);
	}, [itemSize]);

	// Distribuir elementos en columnas para crear el efecto mosaico
	const masonryColumns = useMemo(() => {
		const cols: FileItem[][] = Array.from({ length: columns }, () => []);

		items.forEach((item, index) => {
			const columnIndex = index % columns;
			cols[columnIndex].push(item);
		});

		return cols;
	}, [items, columns]);

	return (
		<div ref={containerRef} className={cn('w-full h-full p-4 overflow-auto', className)}>
			<div className="flex gap-4">
				{masonryColumns.map((column, colIndex) => (
					<div key={`column-${colIndex}-${column.length}`} className="flex-1 flex flex-col gap-4">
						{column.map((item) => {
							const isSelected = selectedIds.includes(item.id);
							const isActive = activeId === item.id;

							// Calcular altura según las dimensiones de la imagen
							const aspectRatio = item.width && item.height ? item.width / item.height : 1;
							const height = Math.floor(itemSize / aspectRatio);

							return (
								<MasonryItem
									key={item.id}
									item={item}
									isSelected={isSelected}
									isActive={isActive}
									onClick={onItemClick}
									onDoubleClick={onItemDoubleClick}
									onContextMenu={onContextMenu}
									style={{ height }}
								/>
							);
						})}
					</div>
				))}
			</div>
		</div>
	);
});

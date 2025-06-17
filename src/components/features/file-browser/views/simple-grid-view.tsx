'use client';

import { cn } from '@/lib/utils';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import type { FileItem } from '@/types/file-item';
import { Meh, Star } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImageRenderer } from '../image-renderer';

/**
 * Un componente de Grid View simplificado que no utiliza virtualización para evitar loops
 * de renderizado en situaciones complejas.
 */

interface SimpleGridViewProps {
	items: FileItem[];
	onItemClick?: (item: FileItem, e: React.MouseEvent) => void;
	onItemDoubleClick?: (item: FileItem) => void;
	onContextMenu?: (item: FileItem, e: React.MouseEvent) => void;
	className?: string;
}

export const SimpleGridView = memo<SimpleGridViewProps>(function SimpleGridView({
	items,
	onItemClick,
	onItemDoubleClick,
	onContextMenu,
	className,
}) {
	// Obtener estado de selección
	const { selectedIds, activeId } = useSelectionStore();
	// Obtener tamaño de los items
	const itemSize = useViewOptionsStore((state) => state.itemSize);

	// Referencia al contenedor
	const containerRef = useRef<HTMLDivElement>(null);

	// Calcular número de columnas basado en el tamaño del contenedor
	const [columnCount, setColumnCount] = useState(4);

	// Efecto para calcular número de columnas
	useEffect(() => {
		if (!containerRef.current) return;

		const calculateColumns = () => {
			const containerWidth = containerRef.current?.clientWidth || 0;
			const gap = 16;
			const effectiveItemSize = itemSize + gap;
			const columns = Math.max(1, Math.floor((containerWidth - gap) / effectiveItemSize));
			setColumnCount(columns);
		};

		// Calcular inicialmente
		calculateColumns();

		// Recalcular al cambiar tamaño de ventana
		const resizeObserver = new ResizeObserver(() => {
			calculateColumns();
		});

		if (containerRef.current) {
			resizeObserver.observe(containerRef.current);
		}

		return () => {
			if (containerRef.current) {
				resizeObserver.unobserve(containerRef.current);
			}
			resizeObserver.disconnect();
		};
	}, [itemSize]);

	// Renderizar un item de la grid
	const renderGridItem = useCallback((item: FileItem, index: number) => {
		const isSelected = selectedIds.includes(item.id);
		const isActive = activeId === item.id;

		// Determinar si es una imagen
		const isImage = item.type?.startsWith('image/') ||
			item.type === 'image' ||
			item.mimeType?.startsWith('image/');

		// Url para la imagen
		const imageUrl = item.thumbnail || item.src || `/api/images/${item.id}/thumbnail`;

		// Manejar click
		const handleClick = (e: React.MouseEvent) => {
			if (onItemClick) {
				onItemClick(item, e);
			}
		};

		// Manejar doble click
		const handleDoubleClick = () => {
			if (onItemDoubleClick) {
				onItemDoubleClick(item);
			}
		};

		// Manejar menu contextual
		const handleContextMenu = (e: React.MouseEvent) => {
			e.preventDefault();
			if (onContextMenu) {
				onContextMenu(item, e);
			}
		};

		return (
			<motion.div
				key={item.id}
				className={cn(
					'flex flex-col rounded-md border overflow-hidden',
					'transition-all duration-200',
					isSelected ? 'ring-2 ring-primary border-primary' : 'ring-0'
				)}
				style={{
					width: `calc((100% - ${(columnCount - 1) * 16}px) / ${columnCount})`,
				}}
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
				onClick={handleClick}
				onDoubleClick={handleDoubleClick}
				onContextMenu={handleContextMenu}
			>
				<div className="aspect-square w-full bg-muted/50 relative">
					{/* Imagen */}
					{isImage ? (
						<ImageRenderer
							src={imageUrl}
							alt={item.name || ''}
							className="h-full w-full object-cover"
						/>
					) : (
						<div className="flex items-center justify-center h-full">
							<Meh className="h-10 w-10 text-muted-foreground/50" />
						</div>
					)}

					{/* Indicador favorito */}
					{item.isFavorite && (
						<div className="absolute top-1.5 right-1.5 bg-background/80 rounded-full p-0.5">
							<Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
						</div>
					)}
				</div>

				{/* Nombre */}
				<div className="p-2 text-xs">
					<div className="truncate font-medium">{item.name}</div>
				</div>
			</motion.div>
		);
	}, [activeId, onContextMenu, onItemClick, onItemDoubleClick, selectedIds, columnCount]);

	return (
		<div
			ref={containerRef}
			className={cn("h-full w-full overflow-auto p-4", className)}
		>
			<div
				className="flex flex-wrap gap-4 pb-8"
				style={{ gap: '16px' }}
			>
				{items.map((item, index) => renderGridItem(item, index))}
			</div>
		</div>
	);
});
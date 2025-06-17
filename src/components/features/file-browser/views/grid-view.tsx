'use client';

import { cn } from '@/lib/utils';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import type { FileItem } from '@/types/file-item';
import { Meh, Star } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type * as React from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileContextMenu } from '../context-menu/context-menu';
import type { ContextMenuAction } from '../context-menu/types';
import { ImageRenderer } from '../image-renderer';
import { VirtualizerWrapper } from './virtualizer-wrapper';

interface GridItemProps {
	item: FileItem;
	isSelected?: boolean;
	isActive?: boolean;
	isScrolling?: boolean;
	shouldLoad?: boolean;
	onClick?: (item: FileItem, e: React.MouseEvent) => void;
	onDoubleClick?: (item: FileItem) => void;
	onContextAction?: (action: ContextMenuAction, item: FileItem, data?: Record<string, unknown>) => void;
	style?: React.CSSProperties;
}

/**
 * Componente para renderizar un elemento en la vista de cuadrícula
 */
const GridItem = memo<GridItemProps>(function GridItem({
	item,
	isSelected,
	isActive,
	isScrolling = false,
	shouldLoad = true,
	onClick,
	onDoubleClick,
	onContextAction,
	style,
}) {
	// Referencias
	const itemRef = useRef<HTMLDivElement>(null);

	// Memoizar clases
	const itemClassName = useMemo(
		() =>
			cn(
				'relative aspect-square overflow-hidden rounded-md transition-all border',
				'group hover:ring-2 hover:ring-primary/30 hover:border-primary/30',
				isSelected
					? 'ring-2 ring-primary border-primary'
					: 'ring-0 border-border',
				isActive && 'ring-2 ring-primary/70 border-primary/70'
			),
		[isSelected, isActive]
	);

	// Memoizar manejadores de eventos
	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			if (onClick) {
				onClick(item, e);
			}
		},
		[item, onClick]
	);

	const handleDoubleClick = useCallback(() => {
		if (onDoubleClick) {
			onDoubleClick(item);
		}
	}, [item, onDoubleClick]);

	const handleContextAction = useCallback(
		(action: ContextMenuAction, file: FileItem, data?: Record<string, unknown>) => {
			if (onContextAction) {
				onContextAction(action, file, data);
			}
		},
		[onContextAction]
	);

	// Determinar si es una imagen
	const isImage = useMemo(() => {
		return item.type?.startsWith('image/') || false;
	}, [item.type]);

	// Renderizar el elemento
	return (
		<FileContextMenu file={item} onAction={handleContextAction}>
			<div
				ref={itemRef}
				className={itemClassName}
				onClick={handleClick}
				onDoubleClick={handleDoubleClick}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleClick(e as unknown as React.MouseEvent);
					}
				}}
				style={style}
				data-selected={isSelected}
				data-active={isActive}
				aria-selected={isSelected}
				tabIndex={0}
				role="button"
			>
				{/* Renderizar imagen o icono según el tipo */}
				{isImage ? (
					<ImageRenderer
						src={item.thumbnail || item.src || null}
						alt={item.name}
						className="w-full h-full"
						isScrolling={isScrolling}
						shouldLoad={shouldLoad}
						objectFit="cover"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center bg-muted/30">
						<Meh className="h-10 w-10 text-muted-foreground/50" />
					</div>
				)}

				{/* Indicador de favorito */}
				{item.isFavorite && (
					<div className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5">
						<Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
					</div>
				)}

				{/* Nombre del archivo */}
				<div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6 text-white">
					<div className="truncate text-xs">{item.name}</div>
				</div>

				{/* Overlay de selección */}
				{isSelected && (
					<motion.div
						className="absolute inset-0 bg-primary/10"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
					/>
				)}
			</div>
		</FileContextMenu>
	);
});

interface GridViewProps {
	items: FileItem[];
	onItemClick?: (item: FileItem, e: React.MouseEvent) => void;
	onItemDoubleClick?: (item: FileItem) => void;
	onContextAction?: (action: ContextMenuAction, item: FileItem, data?: Record<string, unknown>) => void;
	className?: string;
}

/**
 * Vista de cuadrícula para mostrar archivos
 */
export const GridView = memo<GridViewProps>(function GridView({
	items,
	onItemClick,
	onItemDoubleClick,
	onContextAction,
	className,
}) {
	// Estados y referencias
	const [isScrolling, setIsScrolling] = useState(false);
	const scrollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Stores
	const { selectedIds, activeId } = useSelectionStore();
	const { itemSize } = useViewOptionsStore();

	// Manejar eventos de scroll
	const handleScrollStart = useCallback(() => {
		setIsScrolling(true);
	}, []);

	const handleScrollEnd = useCallback(() => {
		// Usar un timeout para evitar cambios de estado frecuentes
		if (scrollingTimeoutRef.current) {
			clearTimeout(scrollingTimeoutRef.current);
		}

		scrollingTimeoutRef.current = setTimeout(() => {
			setIsScrolling(false);
			scrollingTimeoutRef.current = null;
		}, 150);
	}, []);

	// Limpiar timeout al desmontar
	useEffect(() => {
		return () => {
			if (scrollingTimeoutRef.current) {
				clearTimeout(scrollingTimeoutRef.current);
			}
		};
	}, []);

	// Renderizar un elemento de la lista
	const renderItem = useCallback(
		(index: number, item: FileItem) => {
			const isSelected = selectedIds.includes(item.id);
			const isActive = activeId === item.id;

			// Calcular si el elemento debe cargarse (para optimizar rendimiento)
			const shouldLoad = !isScrolling || index < 20;

			return (
				<GridItem
					key={item.id}
					item={item}
					isSelected={isSelected}
					isActive={isActive}
					isScrolling={isScrolling}
					shouldLoad={shouldLoad}
					onClick={onItemClick}
					onDoubleClick={onItemDoubleClick}
					onContextAction={onContextAction}
				/>
			);
		},
		[selectedIds, activeId, isScrolling, onItemClick, onItemDoubleClick, onContextAction]
	);

	return (
		<AnimatePresence mode="wait">
			<VirtualizerWrapper
				type="grid"
				data={items}
				itemContent={renderItem}
				itemSize={itemSize}
				gridClassName={cn('w-full h-full p-4', className)}
				layoutId="grid-view"
				onScrollStart={handleScrollStart}
				onScrollEnd={handleScrollEnd}
			/>
		</AnimatePresence>
	);
});

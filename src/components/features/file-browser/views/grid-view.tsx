'use client';

import { cn } from '@/lib/utils';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import type { FileItem } from '@/types/file-item';
import { Meh, Star } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import type * as React from 'react';
import { memo, useCallback, useMemo, useRef } from 'react';
import type { ContextMenuAction } from '../context-menu/context-menu';
import { FileContextMenu } from '../context-menu/context-menu';
import { ImageRenderer } from '../image-renderer';
import { VirtualizerWrapper } from './virtualizer-wrapper';

interface GridItemProps {
	item: FileItem;
	isSelected?: boolean;
	isActive?: boolean;
	isScrolling?: boolean;
	shouldLoad?: boolean;
	thumbnail?: string | null;
	onClick?: (item: FileItem, e: React.MouseEvent) => void;
	onDoubleClick?: (item: FileItem) => void;
	onContextAction?: (action: ContextMenuAction, item: FileItem, data?: Record<string, unknown>) => void;
	style?: React.CSSProperties;
}

export const GridItem = memo(function GridItem({
	item,
	isSelected,
	isActive,
	isScrolling,
	shouldLoad,
	thumbnail,
	onClick,
	onDoubleClick,
	onContextAction,
	style,
}: GridItemProps) {
	// Usamos un ref para capturar el botón
	const buttonRef = useRef<HTMLButtonElement>(null);

	// Memoizamos los handlers para evitar recreaciones
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				onClick?.(item, e as any);
			}
		},
		[onClick, item]
	);

	// Simplificamos la función de manejo de mouse
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

	// Memoizamos la clase para evitar recálculos
	const buttonClassName = useMemo(() => {
		return cn(
			'relative w-full h-full overflow-hidden group text-left',
			isSelected && 'ring-2 ring-primary ring-offset-2',
			isActive && 'ring-2 ring-secondary ring-offset-1',
			isScrolling && 'opacity-50'
		);
	}, [isSelected, isActive, isScrolling]);

	// Memoizamos el elemento interno para evitar renderizados innecesarios
	const ButtonContent = useMemo(() => {
		// Calculamos si debemos mostrar el contenido real
		const shouldShowContent = shouldLoad && thumbnail;

		return (
			<div className="w-full h-full bg-muted/30 cursor-pointer">
				{shouldShowContent ? (
					<div className="relative w-full h-full p-2">
						<div
							className="absolute inset-0 bg-cover bg-center blur-lg opacity-80 brightness-20"
							style={{
								backgroundImage: `url(${thumbnail})`,
							}}
						/>
						<div className="absolute inset-0 scale-80 w-auto h-auto group-hover:scale-90 transition-all duration-100 ease-out">
							<ImageRenderer
								src={thumbnail}
								alt={item.name}
								objectFit="contain"
								className="h-full w-full rounded-sm transition-all duration-200 ease-out"
							/>
						</div>
					</div>
				) : (
					<div className="flex items-center justify-center h-full">
						<Meh className="h-12 w-12 text-muted-foreground/50 animate-spin" />
					</div>
				)}

				{item.isFavorite && (
					<div className="absolute top-2 right-2">
						<Star className="h-4 w-4 text-yellow-500 fill-current drop-shadow-lg shadow-black" />
					</div>
				)}
			</div>
		);
	}, [shouldLoad, thumbnail, item.name, item.isFavorite]);

	// Optimizamos la acción del menú contextual para evitar recreaciones
	const handleContextAction = useCallback(
		(action: ContextMenuAction, data?: Record<string, unknown>) => {
			onContextAction?.(action, item, data);
		},
		[onContextAction, item]
	);

	return (
		<FileContextMenu file={item} onAction={handleContextAction}>
			<button
				ref={buttonRef}
				type="button"
				className={buttonClassName}
				style={style}
				onClick={handleClick}
				onDoubleClick={handleDoubleClick}
				onKeyDown={handleKeyDown}
				aria-pressed={isSelected}
			>
				{ButtonContent}
			</button>
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

export const GridView = memo(function GridView({
	items,
	onItemClick,
	onItemDoubleClick,
	onContextAction,
	className,
}: GridViewProps) {
	const { selectedIds, activeId, toggleSelectedId, addSelectedId, setSelectedIds } = useSelectionStore();
	const { itemSize } = useViewOptionsStore();

	const handleItemClick = useCallback(
		(item: FileItem, e: React.MouseEvent) => {
			// Si se mantiene presionada la tecla Ctrl, toggle la selección
			if (e.ctrlKey || e.metaKey) {
				toggleSelectedId(item.id);
			}
			// Si se mantiene presionada la tecla Shift, seleccionar rango
			else if (e.shiftKey && activeId) {
				const activeIndex = items.findIndex((i) => i.id === activeId);
				const clickedIndex = items.findIndex((i) => i.id === item.id);

				if (activeIndex !== -1 && clickedIndex !== -1) {
					const start = Math.min(activeIndex, clickedIndex);
					const end = Math.max(activeIndex, clickedIndex);

					const idsToSelect = items.slice(start, end + 1).map((i) => i.id);
					setSelectedIds(idsToSelect);
				}
			}
			// Caso normal: limpiar selección y seleccionar solo este item
			else {
				setSelectedIds([item.id]);
			}

			// Propagar el evento si es necesario
			onItemClick?.(item, e);
		},
		[items, activeId, toggleSelectedId, setSelectedIds, onItemClick, addSelectedId]
	);

	const renderItem = useCallback(
		(index: number, item: FileItem) => {
			const isSelected = selectedIds.includes(item.id);
			const isActive = activeId === item.id;

			return (
				<GridItem
					key={item.id}
					item={item}
					isSelected={isSelected}
					isActive={isActive}
					shouldLoad={true}
					thumbnail={item.thumbnail}
					onClick={handleItemClick}
					onDoubleClick={onItemDoubleClick}
					onContextAction={onContextAction}
				/>
			);
		},
		[selectedIds, activeId, handleItemClick, onItemDoubleClick, onContextAction]
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
			/>
		</AnimatePresence>
	);
});

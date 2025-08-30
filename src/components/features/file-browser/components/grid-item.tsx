import React, { useCallback, useRef } from 'react';
import { useSelectionStore } from '@/store/ui/selection.slice';
import type { ClickModifiers } from '../types/file-browser.types';
import type { MediaItem } from './media-thumbnail';
import { MediaThumbnail } from './media-thumbnail';

interface GridItemProps {
	item: MediaItem;
	size?: number;
	selected?: boolean;
	onClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onDoubleClick?: (item: MediaItem) => void;
}

function GridItemInner({ item, onClick, onDoubleClick, size = 150, selected }: GridItemProps) {
	const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isSelected = useSelectionStore((s) => s.isSelected(item.id));
	const selectedState = typeof selected === 'boolean' ? selected : isSelected;

	const handleClick = useCallback(
		(e?: React.MouseEvent) => {
			// Si hay un handler de doble-click, necesitamos distinguir entre click y doble-click
			if (onDoubleClick) {
				if (clickTimeoutRef.current) {
					// Es parte de un doble-click, cancelar el click simple
					clearTimeout(clickTimeoutRef.current);
					clickTimeoutRef.current = null;
					return;
				}

				// Delay para determinar si es un click simple o parte de un doble-click
				clickTimeoutRef.current = setTimeout(() => {
					clickTimeoutRef.current = null;
					onClick?.(item, {
						ctrlKey: Boolean(e?.ctrlKey),
						metaKey: Boolean(e?.metaKey),
						shiftKey: Boolean(e?.shiftKey),
					});
				}, 50); // Reducido a 50ms para mejor responsividad
			} else {
				// No hay doble-click handler, ejecutar click inmediatamente
				onClick?.(item, { ctrlKey: Boolean(e?.ctrlKey), metaKey: Boolean(e?.metaKey), shiftKey: Boolean(e?.shiftKey) });
			}
		},
		[onClick, onDoubleClick, item]
	);

	const handleDoubleClick = useCallback(() => {
		// Cancelar cualquier click simple pendiente
		if (clickTimeoutRef.current) {
			clearTimeout(clickTimeoutRef.current);
			clickTimeoutRef.current = null;
		}

		onDoubleClick?.(item);
	}, [onDoubleClick, item]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLButtonElement>) => {
			if (e.key === 'Enter' || e.key === ' ') {
				onClick?.(item);
			}
		},
		[onClick, item]
	);

	return (
		<button
			aria-pressed={selectedState}
			className={`group relative overflow-hidden rounded-md border bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${selectedState ? 'ring-2 ring-primary ring-offset-2' : ''}`}
			data-entity-card
			data-entity-type={item.entityType}
			data-selected={selectedState}
			onClick={(e) => handleClick(e)}
			onDoubleClick={handleDoubleClick}
			onKeyDown={handleKeyDown}
			style={{ aspectRatio: '1 / 1', width: '100%', minWidth: size, minHeight: size }}
			type="button"
		>
			<MediaThumbnail className="h-full w-full" item={item} preloadMargin="800px" style={{ objectFit: 'cover' }} />
			<div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent p-2">
				<p className="truncate font-medium text-white text-xs">{item.name}</p>
			</div>
			{/* Overlay visual innecesario: el anillo de selección ya se aplica en el botón */}
		</button>
	);
}

export const GridItem = React.memo(GridItemInner, (prev, next) => {
	return (
		prev.item.id === next.item.id &&
		prev.size === next.size &&
		prev.selected === next.selected &&
		prev.onClick === next.onClick &&
		prev.onDoubleClick === next.onDoubleClick
	);
});

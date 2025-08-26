import { useRef } from 'react';
import type { MediaItem } from './media-thumbnail';
import { MediaThumbnail } from './media-thumbnail';

interface GridItemProps {
	item: MediaItem;
	size?: number;
	selected?: boolean;
	onClick?: (item: MediaItem) => void;
	onDoubleClick?: (item: MediaItem) => void;
}

export function GridItem({ item, onClick, onDoubleClick, size = 150, selected = false }: GridItemProps) {
	const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const handleClick = () => {
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
				onClick?.(item);
			}, 200); // 200ms es el tiempo estándar para distinguir
		} else {
			// No hay doble-click handler, ejecutar click inmediatamente
			onClick?.(item);
		}
	};

	const handleDoubleClick = () => {
		// Cancelar cualquier click simple pendiente
		if (clickTimeoutRef.current) {
			clearTimeout(clickTimeoutRef.current);
			clickTimeoutRef.current = null;
		}

		onDoubleClick?.(item);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
		if (e.key === 'Enter' || e.key === ' ') {
			onClick?.(item);
		}
	};

	return (
		<button
			aria-pressed={selected}
			className="group relative overflow-hidden rounded-md border bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
			data-selected={selected}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
			onKeyDown={handleKeyDown}
			style={{ aspectRatio: '1 / 1', width: '100%', minWidth: size, minHeight: size }}
			type="button"
		>
			<MediaThumbnail className="h-full w-full" item={item} style={{ objectFit: 'cover' }} />
			<div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent p-2">
				<p className="truncate font-medium text-white text-xs">{item.name}</p>
			</div>
			{selected && <div aria-hidden="true" className="absolute inset-0 ring-2 ring-primary ring-offset-2" />}
		</button>
	);
}

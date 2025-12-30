import React from 'react';
import type { MediaItem } from '../../../components/media-thumbnail';
import type { ClickModifiers } from '../../../types/file-browser.types';

/**
 * Props base para todos los componentes de items
 */
export interface BaseItemProps {
	item: MediaItem;
	size: number;
	isSelected?: boolean;
	isHovered?: boolean;
	isActive?: boolean;
	onClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onDoubleClick?: (item: MediaItem) => void;
	onContextMenu?: (event: React.MouseEvent, item: MediaItem) => void;
}

/**
 * Componente base que proporciona funcionalidades comunes a todos los items
 */
export function BaseItem({
	item,
	size,
	isSelected = false,
	isHovered = false,
	isActive = false,
	onClick,
	onDoubleClick,
	onContextMenu,
	children,
}: BaseItemProps & { children: React.ReactNode }) {
	const btnRef = React.useRef<HTMLButtonElement | null>(null);

	const handleClick = (event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();

		const modifiers: ClickModifiers = {
			ctrlKey: event.ctrlKey,
			shiftKey: event.shiftKey,
			metaKey: event.metaKey,
		};

		onClick?.(item, modifiers);
	};

	const handleDoubleClick = (event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		onDoubleClick?.(item);
	};

	const handleContextMenu = (event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		onContextMenu?.(event, item);
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			const modifiers: ClickModifiers = {
				ctrlKey: event.ctrlKey,
				shiftKey: event.shiftKey,
				metaKey: event.metaKey,
			};
			onClick?.(item, modifiers);
			// Enfatizar foco visual tras activar con teclado
			btnRef.current?.classList.add('focus:ring-2');
		}
	};

	return (
		<button
			aria-label={`${item.entityType} ${item.name}`}
			className={`relative flex cursor-pointer flex-col items-center transition-all duration-200 ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
				${isHovered ? 'scale-105 shadow-lg' : ''}
				${isActive ? 'ring-2 ring-ring ring-offset-2' : ''}
			`}
			data-entity-card
			data-entity-type={item.entityType}
			data-testid={`item-${item.id}`}
			onClick={handleClick}
			onContextMenu={handleContextMenu}
			onDoubleClick={handleDoubleClick}
			onKeyDown={handleKeyDown}
			ref={btnRef}
			style={{ width: size, height: size }}
			type="button"
		>
			{children}
		</button>
	);
}

/**
 * Utilidades para manejar thumbnails y fallbacks
 */
export function getThumbnailUrl(item: MediaItem, size: number): string | null {
	if (item.thumbnailUrl) {
		return item.thumbnailUrl;
	}
	return null;
}

export function getFallbackContent(item: MediaItem): { icon: string; bgColor: string } {
	const entityType = item.entityType;

	switch (entityType) {
		case 'image':
			return { icon: '🖼️', bgColor: 'bg-blue-100' };
		case 'video':
			return { icon: '🎬', bgColor: 'bg-red-100' };
		case 'audio':
			return { icon: '🎵', bgColor: 'bg-green-100' };
		case 'document':
			return { icon: '📄', bgColor: 'bg-yellow-100' };
		case 'jsonFile':
			return { icon: '📋', bgColor: 'bg-purple-100' };
		case 'file3d':
			return { icon: '🧊', bgColor: 'bg-cyan-100' };
		case 'folder':
			return { icon: '📁', bgColor: 'bg-amber-100' };
		default:
			return { icon: '📎', bgColor: 'bg-gray-100' };
	}
}

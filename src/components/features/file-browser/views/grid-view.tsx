'use client';

import { cn } from '@/lib/utils';
import type { FileItem } from '@/types/file-item';
import { Meh, Star } from 'lucide-react';
import type * as React from 'react';
import { memo, useCallback, useMemo, useRef } from 'react';
import type { ContextMenuAction } from '../context-menu/context-menu';
import { FileContextMenu } from '../context-menu/context-menu';
import { ImageRenderer } from '../image-renderer';

interface GridViewProps {
	item: FileItem;
	itemSize: number;
	isSelected?: boolean;
	isScrolling?: boolean;
	shouldLoad?: boolean;
	thumbnail?: string | null;
	onClick?: (item: FileItem) => void;
	onDoubleClick?: (item: FileItem) => void;
	onContextAction?: (action: ContextMenuAction, item: FileItem, data?: Record<string, unknown>) => void;
	style?: React.CSSProperties;
}

export const GridView = memo(function GridView({
	item,
	// itemSize no se está utilizando actualmente
	isSelected,
	isScrolling,
	shouldLoad,
	thumbnail,
	onClick,
	onDoubleClick,
	onContextAction,
	style,
}: GridViewProps) {
	// Eliminamos el estado que no es necesario
	// const [_mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

	// Usamos un ref para capturar el botón
	const buttonRef = useRef<HTMLButtonElement>(null);

	// Memoizamos los handlers para evitar recreaciones
	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onClick?.(item);
		}
	}, [onClick, item]);

	// Simplificamos la función de manejo de mouse
	const handleClick = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onClick?.(item);
	}, [onClick, item]);

	const handleDoubleClick = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onDoubleClick?.(item);
	}, [onDoubleClick, item]);

	// Memoizamos la clase para evitar recálculos
	const buttonClassName = useMemo(() => {
		return cn(
			'relative w-full h-full overflow-hidden group text-left',
			isSelected && 'ring-2 ring-primary ring-offset-2',
			isScrolling && 'opacity-50'
		);
	}, [isSelected, isScrolling]);

	// Calculamos si debemos mostrar el contenido real
	const shouldShowContent = shouldLoad && thumbnail;

	return (
		<FileContextMenu file={item} onAction={onContextAction || (() => { })}>
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
				</div>
				{item.isFavorite && (
					<div className="absolute top-2 right-2">
						<Star className="h-4 w-4 text-yellow-500 fill-current drop-shadow-lg shadow-black" />
					</div>
				)}
			</button>
		</FileContextMenu>
	);
});

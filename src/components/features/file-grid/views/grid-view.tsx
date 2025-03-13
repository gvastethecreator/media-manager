'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FileItem } from '@/types/file-item';
import { ImageIcon, Meh, Star } from 'lucide-react';
import type * as React from 'react';
import { memo, useState } from 'react';
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
	const [_mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onClick?.(item);
		}
	};

	const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
		const { currentTarget } = e;
		const rect = currentTarget.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
		const y = ((e.clientY - rect.top) / rect.height - 0.5) * -20;
		setMousePosition({ x, y });
	};

	const handleMouseLeave = () => {
		setMousePosition({ x: 0, y: 0 });
	};

	return (
		<FileContextMenu file={item} onAction={onContextAction || (() => {})}>
			<button
				type="button"
				className={cn(
					'relative w-full h-full overflow-hidden group text-left',
					isSelected && 'ring-2 ring-primary ring-offset-2',
					isScrolling && 'opacity-50'
				)}
				style={style}
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onClick?.(item);
				}}
				onDoubleClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onDoubleClick?.(item);
				}}
				onKeyDown={handleKeyDown}
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseLeave}
				aria-pressed={isSelected}
			>
				<div className="w-full h-full bg-muted/30 cursor-pointer">
					{shouldLoad && thumbnail ? (
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
									className={cn('h-full w-full rounded-sm transition-all duration-200 ease-out')}
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

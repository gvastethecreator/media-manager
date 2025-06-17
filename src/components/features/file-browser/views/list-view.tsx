'use client';

import { cn } from '@/lib/utils';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import type { FileItem } from '@/types/file-item';
import {
	Calendar,
	File,
	FileText,
	Heart,
	Image,
	Video
} from 'lucide-react';
import { motion } from 'motion/react';
import type * as React from 'react';
import { memo, useCallback, useMemo, useRef } from 'react';
import { VirtualizerWrapper } from './virtualizer-wrapper';

interface ListItemProps {
	item: FileItem;
	isSelected?: boolean;
	isActive?: boolean;
	onClick?: (item: FileItem, e: React.MouseEvent) => void;
	onDoubleClick?: (item: FileItem) => void;
	onContextMenu?: (item: FileItem, e: React.MouseEvent) => void;
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

export const ListItem = memo(function ListItem({
	item,
	isSelected,
	isActive,
	onClick,
	onDoubleClick,
	onContextMenu,
}: ListItemProps) {
	const metadata = getMetadata(item.metadata);
	const buttonRef = useRef<HTMLButtonElement>(null);

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
	const rowClassName = useMemo(() => {
		return cn(
			'flex items-center px-4 py-2 hover:bg-accent/50 cursor-pointer transition-colors',
			isSelected && 'bg-primary/10 dark:bg-primary/20',
			isActive && 'bg-secondary/10 dark:bg-secondary/20'
		);
	}, [isSelected, isActive]);

	// Determinar el icono según el tipo de archivo
	const getFileIcon = () => {
		if (item.type?.startsWith('image/') || item.mimeType?.startsWith('image/')) {
			return <Image className="h-4 w-4 text-blue-500" />;
		}
		if (item.type?.startsWith('video/') || item.mimeType?.startsWith('video/')) {
			return <Video className="h-4 w-4 text-red-500" />;
		}
		if (item.type?.startsWith('text/') || item.mimeType?.startsWith('text/')) {
			return <FileText className="h-4 w-4 text-yellow-500" />;
		}
		return <File className="h-4 w-4 text-gray-500" />;
	};

	// Formatear fecha
	const formatDate = (dateString: string) => {
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString();
		} catch (e) {
			return 'Fecha desconocida';
		}
	};

	return (
		<motion.div
			className={rowClassName}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
			onContextMenu={handleContextMenu}
			whileHover={{ backgroundColor: 'rgba(var(--accent), 0.2)' }}
			whileTap={{ backgroundColor: 'rgba(var(--accent), 0.3)' }}
			layout
		>
			<div className="flex items-center gap-3 flex-1">
				<div className="flex items-center gap-2">
					{getFileIcon()}
					<span className="font-medium">{item.name}</span>
					{item.isFavorite && <Heart className="h-3 w-3 text-yellow-500 fill-current" />}
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-xs text-muted-foreground w-20 text-right">{formatBytes(item.size)}</span>
				<div className="flex items-center gap-1 w-32">
					<Calendar className="h-3 w-3 text-muted-foreground" />
					<span className="text-xs text-muted-foreground">{formatDate(item.modifiedAt || item.createdAt)}</span>
				</div>
			</div>
		</motion.div>
	);
});

export interface ListViewProps {
	items: FileItem[];
	onItemClick?: (item: FileItem, e: React.MouseEvent) => void;
	onItemDoubleClick?: (item: FileItem) => void;
	onContextMenu?: (item: FileItem, e: React.MouseEvent) => void;
	className?: string;
}

export const ListView = memo(function ListView({
	items,
	onItemClick,
	onItemDoubleClick,
	onContextMenu,
	className,
}: ListViewProps) {
	const { selectedIds, activeId } = useSelectionStore();
	const { itemSize } = useViewOptionsStore();

	const renderItem = useCallback(
		(index: number, item: FileItem) => {
			const isSelected = selectedIds.includes(item.id);
			const isActive = activeId === item.id;

			return (
				<ListItem
					key={item.id}
					item={item}
					isSelected={isSelected}
					isActive={isActive}
					onClick={onItemClick}
					onDoubleClick={onItemDoubleClick}
					onContextMenu={onContextMenu}
				/>
			);
		},
		[selectedIds, activeId, onItemClick, onItemDoubleClick, onContextMenu]
	);

	return (
		<VirtualizerWrapper
			type="list"
			data={items}
			itemContent={renderItem}
			listClassName={cn('w-full h-full', className)}
			layoutId="list-view"
		/>
	);
});

import clsx from 'clsx';
import { Star } from 'lucide-react';
import { motion } from 'motion/react';
import React, { memo, useCallback } from 'react';
import type { FileItem } from '@/types/file-browser/file-item';
import { FileContextMenu } from '../context-menu/context-menu';
import type { ContextMenuAction } from '../context-menu/types';
import { ImageRenderer } from '../image-renderer';

// 🛠️ Utilidad para formatear tamaño de archivo
const formatFileSize = (bytes: number): string => {
	if (bytes === 0) {
		return '0 B';
	}
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

interface GridItemProps {
	item: FileItem;
	isSelected: boolean;
	isFavorite: boolean;
	onClick: (e?: React.MouseEvent) => void;
	onDoubleClick: () => void;
	onContextMenu: () => void;
	onContextAction: (action: ContextMenuAction, item: FileItem, data?: Record<string, unknown>) => void;
}

/**
 * 🧩 **GridItem con menú contextual**
 *
 * Componente individual para mostrar un elemento en la vista de cuadrícula.
 * Incluye soporte para:
 * - Miniatura de la imagen
 * - Información básica (nombre, tamaño)
 * - Estados de selección y favorito
 * - Menú contextual integrado
 * - Animaciones hover/tap
 */
export const GridItem = memo<GridItemProps>(function GridItemInner({
	item,
	isSelected,
	isFavorite,
	onClick,
	onDoubleClick,
	onContextMenu,
	onContextAction,
}) {
	// 🎯 Función para manejar las acciones del menú contextual
	const handleAction = useCallback(
		(action: ContextMenuAction, file: FileItem, data?: Record<string, unknown>) => {
			onContextAction(action, file, data);
		},
		[onContextAction]
	);

	// 🖼️ Asegurarse de que thumbnailUrl sea una string válida
	const thumbnailUrl = ('thumbnailUrl' in item ? item.thumbnailUrl : null) || `/api/images/${item.id}/thumbnail`;

	return (
		<FileContextMenu file={item} onAction={handleAction}>
			<motion.div
				className={clsx(
					'relative overflow-hidden rounded-md border transition-colors',
					isSelected
						? 'border-primary bg-primary/10 shadow-sm dark:bg-primary/20'
						: 'border-border/40 bg-card hover:border-border/80'
				)}
				onClick={(e) => {
					e.stopPropagation();
					onClick(e);
				}}
				onContextMenu={(e) => {
					e.stopPropagation();
					onContextMenu();
				}}
				onDoubleClick={(e) => {
					e.stopPropagation();
					onDoubleClick();
				}}
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
			>
				{/* 🖼️ Imagen */}
				<div className="aspect-[3/2] w-full overflow-hidden bg-muted">
					<ImageRenderer
						alt={item.name}
						className="h-full w-full object-cover transition-transform"
						src={thumbnailUrl}
					/>
				</div>

				{/* ℹ️ Información */}
				<div className="p-2 text-xs">
					<div className="truncate font-medium">{item.name}</div>
					<div className="text-muted-foreground">{formatFileSize(('size' in item ? item.size : null) || 0)}</div>
				</div>

				{/* ⭐ Indicadores */}
				{isFavorite && (
					<div className="absolute top-1 right-1 rounded-full bg-primary p-0.5 text-primary-foreground">
						<Star className="h-3 w-3" />
					</div>
				)}
			</motion.div>
		</FileContextMenu>
	);
});

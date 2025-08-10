/**
 * @file Fila de ListView con soporte para columnas configurables
 * @description Componente de fila que renderiza celdas basadas en la configuración de columnas
 */

import React, { memo } from 'react';
import { ImageThumbnail } from '@/components/common/thumbnails/image-thumbnail';
import type { ListColumnConfig } from '@/types/file-browser/list-column-config';
import type { AnyEntityWithStats } from '@/types/migration';

interface ListViewRowProps {
	item: AnyEntityWithStats;
	columns: ListColumnConfig[];
	index: number;
	isSelected?: boolean;
	isEven?: boolean;
	showZebraStripes?: boolean;
	rowHeight: number;
	cellPadding: number;
	showThumbnails?: boolean;
	thumbnailSize?: 'small' | 'medium' | 'large';
	onClick?: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
	onDoubleClick?: (item: AnyEntityWithStats) => void;
	onContextMenu?: (event: React.MouseEvent, item: AnyEntityWithStats) => void;
	className?: string;
}

/**
 * Fila de ListView con columnas configurables
 */
export const ListViewRow = memo<ListViewRowProps>(
	({
		item,
		columns,
		index,
		isSelected = false,
		isEven = false,
		showZebraStripes = true,
		rowHeight,
		cellPadding,
		showThumbnails = true,
		thumbnailSize = 'medium',
		onClick,
		onDoubleClick,
		onContextMenu,
		className = '',
	}) => {
		// Columnas visibles ordenadas
		const visibleColumns = columns.filter((col) => col.visible).sort((a, b) => (a.order || 0) - (b.order || 0));

		// Obtener tamaño de thumbnail
		const getThumbnailSize = () => {
			switch (thumbnailSize) {
				case 'small':
					return 32;
				case 'large':
					return 64;
				default:
					return 48; // medium
			}
		};

		// Obtener ancho de columna
		const getColumnWidth = (column: ListColumnConfig) => {
			if (column.width === 'auto') {
				return 'auto';
			}
			return `${column.width}px`;
		};

		// Renderizar contenido de celda
		const renderCellContent = (column: ListColumnConfig) => {
			// Si es la columna de thumbnail
			if (column.key === 'thumbnail' && showThumbnails) {
				return (
					<div className="flex items-center justify-center">
						<ImageThumbnail
							className="rounded"
							name={item.name}
							path={('path' in item ? item.path : '') || item.id || ''}
							size={getThumbnailSize()}
						/>
					</div>
				);
			}

			// Si hay un renderer personalizado
			if (column.renderer) {
				return column.renderer(item);
			}

			// Fallback por defecto
			return <span className="text-muted-foreground text-sm">—</span>;
		};

		// Manejadores de eventos
		const handleClick = (e: React.MouseEvent) => {
			e.stopPropagation();
			onClick?.(item, e);
		};

		const handleDoubleClick = (e: React.MouseEvent) => {
			e.stopPropagation();
			onDoubleClick?.(item);
		};

		const handleContextMenu = (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			onContextMenu?.(e, item);
		};

		return (
			<tr
				className={`group cursor-pointer transition-colors duration-150${isSelected ? 'bg-accent text-accent-foreground' : ''}
				${showZebraStripes && isEven && !isSelected ? 'bg-muted/30' : ''}hover:bg-accent/50${className}
			`}
				data-path={('path' in item ? item.path : '') || item.id || ''}
				data-testid={`list-row-${index}`}
				onClick={handleClick}
				onContextMenu={handleContextMenu}
				onDoubleClick={handleDoubleClick}
				style={{ height: `${rowHeight}px` }}
			>
				{visibleColumns.map((column) => (
					<td
						className={`border-border/50 border-r last:border-r-0 overflow-hidden${column.key === 'thumbnail' ? 'p-1' : ''}
					`}
						key={column.key}
						style={{
							width: getColumnWidth(column),
							minWidth: column.minWidth ? `${column.minWidth}px` : undefined,
							maxWidth: column.maxWidth ? `${column.maxWidth}px` : undefined,
							textAlign: column.align || 'left',
							padding: column.key === 'thumbnail' ? '4px' : `${cellPadding}px`,
						}}
					>
						<div className="flex h-full min-w-0 items-center">{renderCellContent(column)}</div>
					</td>
				))}
			</tr>
		);
	}
);

ListViewRow.displayName = 'ListViewRow';

export default ListViewRow;

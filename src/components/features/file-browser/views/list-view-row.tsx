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
	// Props de virtualización y atributos adicionales controlados
	virtualStyle?: React.CSSProperties;
	tabIndexOverride?: number;
	ariaRowIndex?: number;
	ariaSetSize?: number;
	dataItemId?: string;
	dataSelectable?: boolean;
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
		virtualStyle,
		tabIndexOverride,
		ariaRowIndex,
		ariaSetSize,
		dataItemId,
		dataSelectable,
	}) => {
		// Extraer timestamps para testeo/a11y (sin afectar UI)
		const getDateISO = (value: unknown): string | undefined => {
			if (!value) {
				return;
			}
			try {
				const d = typeof value === 'string' || typeof value === 'number' ? new Date(value) : (value as Date);
				if (Number.isNaN(d.getTime())) {
					return;
				}
				return d.toISOString();
			} catch {
				return;
			}
		};

		const modifiedISO = getDateISO((item as any).updatedAt ?? (item as any).modifiedAt ?? undefined);
		const createdISO = getDateISO((item as any).createdAt ?? undefined);
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
							id={item.id}
							name={item.name}
							path={('path' in item ? (item as any).path : '') || item.id || ''}
							size={getThumbnailSize()}
							thumbnailUrl={(item as any).thumbnailUrl}
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
				aria-rowindex={ariaRowIndex}
				aria-setsize={ariaSetSize}
				className={`group cursor-pointer transition-colors duration-150 ${
					isSelected ? 'bg-accent text-accent-foreground' : ''
				} ${showZebraStripes && isEven && !isSelected ? 'bg-muted/30' : ''} hover:bg-accent/50 ${className}`}
				data-created={createdISO}
				data-item-id={dataItemId}
				data-modified={modifiedISO}
				data-path={('path' in item ? item.path : '') || item.id || ''}
				data-selectable={dataSelectable ? 'true' : undefined}
				data-testid={`list-row-${index}`}
				onClick={handleClick}
				// Altura fija por configuración + permitir virtualización con props extra
				onContextMenu={handleContextMenu}
				onDoubleClick={handleDoubleClick}
				style={{ height: `${rowHeight}px`, ...(virtualStyle || {}) }}
				tabIndex={tabIndexOverride ?? (index === 0 ? 0 : -1)}
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

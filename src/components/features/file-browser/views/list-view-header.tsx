/**
 * @file Header de ListView con soporte para columnas configurables
 * @description Componente de encabezado que maneja ordenamiento, redimensionado y reordenado de columnas
 */

import { ChevronDown, ChevronUp, Eye, EyeOff, Grip, Settings2 } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ListColumnConfig } from '@/types/file-browser/list-column-config';

function HeaderSortContent({
	column,
	isSorted,
	sortDirection,
	onSort,
}: {
	column: ListColumnConfig;
	isSorted: boolean;
	sortDirection: 'asc' | 'desc';
	onSort?: (columnKey: string) => void;
}) {
	if (column.sortable && onSort) {
			return (
				<button
					className="flex min-w-0 flex-1 cursor-pointer items-center gap-1 hover:text-foreground"
					onClick={() => onSort(column.key)}
					type="button"
				>
					<span className="truncate font-medium text-sm">{column.label}</span>
					{isSorted ? (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
				</button>
			);
	}
			return (
				<div className="flex min-w-0 flex-1 items-center gap-1">
					<span className="truncate font-medium text-sm">{column.label}</span>
				</div>
			);
}

function HeaderResizeHandle({
	column,
	currentWidth,
	min,
	max,
	onColumnResize,
	onMouseDown,
}: {
	column: ListColumnConfig;
	currentWidth: number;
	min: number;
	max: number;
	onColumnResize?: (columnKey: string, width: number) => void;
	onMouseDown: (e: React.MouseEvent, columnKey: string) => void;
}) {
		if (column.resizable === false || !onColumnResize) {
			return null;
		}
	return (
		<div
			aria-label={`Ajustar ancho de la columna ${column.label}`}
			aria-orientation="vertical"
			aria-valuemax={max}
			aria-valuemin={min}
			aria-valuenow={currentWidth}
					className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize opacity-0 transition-opacity hover:bg-border group-hover:opacity-100"
			onKeyDown={(ev) => {
				if (ev.key === 'ArrowLeft') {
					ev.preventDefault();
					onColumnResize(column.key, Math.max(min, currentWidth - 10));
				}
				if (ev.key === 'ArrowRight') {
					ev.preventDefault();
					onColumnResize(column.key, Math.min(max, currentWidth + 10));
				}
			}}
			onMouseDown={(e) => onMouseDown(e, column.key)}
			role="separator"
			tabIndex={0}
		/>
	);
}

// Helper puro para renderizar la celda de cabecera y reducir complejidad en el componente principal
function renderHeaderCell(
	params: {
		column: ListColumnConfig;
		index: number;
		isResizing: boolean;
		isDragging: boolean;
		isDragTarget: boolean;
		isSorted: boolean;
		sortDirection: 'asc' | 'desc';
		getColumnWidth: (column: ListColumnConfig) => string;
		handleDragOver: (e: React.DragEvent, index: number) => void;
		handleDragStart: (e: React.DragEvent, index: number) => void;
		handleDrop: (e: React.DragEvent, index: number) => void;
		handleMouseDown: (e: React.MouseEvent, columnKey: string) => void;
		onColumnReorder?: (fromIndex: number, toIndex: number) => void;
		onSort?: (columnKey: string) => void;
		onColumnResize?: (columnKey: string, width: number) => void;
	}
) {
	const {
		column,
		index,
		isResizing,
		isDragging,
		isDragTarget,
		isSorted,
		sortDirection,
		getColumnWidth,
		handleDragOver,
		handleDragStart,
		handleDrop,
		handleMouseDown,
		onColumnReorder,
		onSort,
		onColumnResize,
	} = params;

			let ariaSort: React.AriaAttributes['aria-sort'];
			if (isSorted) {
				ariaSort = sortDirection === 'asc' ? 'ascending' : 'descending';
			} else {
				ariaSort = undefined;
			}

		const currentWidth = typeof column.width === 'number' ? column.width : 150;
		const min = column.minWidth ?? 50;
		const max = column.maxWidth ?? 1000;

			const content = (
				<HeaderSortContent column={column} isSorted={isSorted} onSort={onSort} sortDirection={sortDirection} />
			);

			const resizeHandle = (
				<HeaderResizeHandle
					column={column}
					currentWidth={currentWidth}
					max={max}
					min={min}
					onColumnResize={onColumnResize}
					onMouseDown={handleMouseDown}
				/>
			);

		return (
			<th
				aria-sort={ariaSort}
				className={`group relative select-none border-border/50 border-r last:border-r-0${isDragging ? ' opacity-50' : ''}${
					isDragTarget ? ' bg-accent' : ''
				}${isResizing ? ' cursor-col-resize' : ''}`}
				draggable={!!onColumnReorder}
				key={column.key}
				onDragOver={(e) => handleDragOver(e, index)}
				onDragStart={(e) => handleDragStart(e, index)}
				onDrop={(e) => handleDrop(e, index)}
				scope="col"
				style={{
					width: getColumnWidth(column),
					minWidth: column.minWidth ? `${column.minWidth}px` : undefined,
					maxWidth: column.maxWidth ? `${column.maxWidth}px` : undefined,
					textAlign: column.align || 'left',
				}}
			>
				  <div className="flex min-h-[40px] items-center gap-2 px-3 py-2">
					{onColumnReorder && (
					  <div className="cursor-grab opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-100">
							<Grip className="h-3 w-3 text-muted-foreground" />
						</div>
					)}
					{content}
					{resizeHandle}
				</div>
			</th>
		);
}

interface ListViewHeaderProps {
	columns: ListColumnConfig[];
	sortBy?: string;
	sortDirection?: 'asc' | 'desc';
	onSort?: (columnKey: string, direction: 'asc' | 'desc') => void;
	onColumnResize?: (columnKey: string, width: number) => void;
	onColumnReorder?: (fromIndex: number, toIndex: number) => void;
	onColumnToggle?: (columnKey: string) => void;
	onSettingsClick?: () => void;
	showSettings?: boolean;
	className?: string;
}

/**
 * Header de ListView con funcionalidades avanzadas
 */
export function ListViewHeader({
	columns,
	sortBy,
	sortDirection = 'asc',
	onSort,
	onColumnResize,
	onColumnReorder,
	onColumnToggle,
	onSettingsClick,
	showSettings = true,
	className = '',
}: ListViewHeaderProps) {
	const [resizingColumn, setResizingColumn] = useState<string | null>(null);
	const [draggedColumn, setDraggedColumn] = useState<number | null>(null);
	const [dragTarget, setDragTarget] = useState<number | null>(null);

	// Columnas visibles ordenadas
	const visibleColumns = useMemo(() => {
		return columns.filter((col) => col.visible).sort((a, b) => (a.order || 0) - (b.order || 0));
	}, [columns]);

	// Manejo de ordenamiento
	const handleSort = useCallback(
		(columnKey: string) => {
			if (!onSort) {
				return;
			}

			if (sortBy === columnKey) {
				// Cambiar dirección si es la misma columna
				onSort(columnKey, sortDirection === 'asc' ? 'desc' : 'asc');
			} else {
				// Nueva columna, empezar con ascendente
				onSort(columnKey, 'asc');
			}
		},
		[sortBy, sortDirection, onSort]
	);

	// Manejo de redimensionado
	const handleMouseDown = useCallback(
		(mouseEvent: React.MouseEvent, columnKey: string) => {
			mouseEvent.preventDefault();
			setResizingColumn(columnKey);

			const startX = mouseEvent.clientX;
			const startWidth = mouseEvent.currentTarget.closest('th')?.offsetWidth || 0;

			const handleMouseMove = (moveEvent: MouseEvent) => {
				const newWidth = startWidth + (moveEvent.clientX - startX);
				if (newWidth >= 50 && onColumnResize) {
					// Ancho mínimo
					onColumnResize(columnKey, newWidth);
				}
			};

			const handleMouseUp = () => {
				setResizingColumn(null);
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};

			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		},
		[onColumnResize]
	);

	// Manejo de drag and drop para reordenar
	const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
		setDraggedColumn(index);
		e.dataTransfer.effectAllowed = 'move';
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
		e.preventDefault();
		setDragTarget(index);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent, index: number) => {
			e.preventDefault();

			if (draggedColumn !== null && draggedColumn !== index && onColumnReorder) {
				onColumnReorder(draggedColumn, index);
			}

			setDraggedColumn(null);
			setDragTarget(null);
		},
		[draggedColumn, onColumnReorder]
	);

	// Renderizar icono de ordenamiento
	const renderSortIcon = (columnKey: string) => {
		if (sortBy !== columnKey) {
			return null;
		}

		return sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
	};

	// Obtener ancho de columna
	const getColumnWidth = (column: ListColumnConfig) => {
		if (column.width === 'auto') {
			return 'auto';
		}
		return `${column.width}px`;
	};

	return (
		<thead className={`bg-muted/50 ${className}`}>
			<tr className="border-b">
				{visibleColumns.map((column, index) => {
					const isResizing = resizingColumn === column.key;
					const isDragging = draggedColumn === index;
					const isDragTarget = dragTarget === index;
					const isSorted = sortBy === column.key;
					return renderHeaderCell({
						column,
						index,
						isResizing,
						isDragging,
						isDragTarget,
						isSorted,
						sortDirection,
						getColumnWidth,
						handleDragOver,
						handleDragStart,
						handleDrop,
						handleMouseDown,
						onColumnReorder,
						onSort: handleSort,
						onColumnResize,
					});
				})}

				{/* Configuración */}
				{showSettings && (
					<th className="w-10 px-2">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button className="h-8 w-8 p-0 opacity-50 hover:opacity-100" size="sm" variant="ghost">
									<Settings2 className="h-3 w-3" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<div className="px-2 py-1 font-medium text-muted-foreground text-xs">Columnas</div>
								{columns.map((column) => (
									<DropdownMenuItem
										className="flex items-center gap-2"
										key={column.key}
										onClick={() => onColumnToggle?.(column.key)}
									>
										{column.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
										<span className="flex-1">{column.label}</span>
									</DropdownMenuItem>
								))}

								{onSettingsClick && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem onClick={onSettingsClick}>
											<Settings2 className="mr-2 h-3 w-3" />
											Configurar vista
										</DropdownMenuItem>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</th>
				)}
			</tr>
		</thead>
	);
}

export default ListViewHeader;

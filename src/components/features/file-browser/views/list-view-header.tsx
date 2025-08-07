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
			if (!onSort) return;

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
		(e: React.MouseEvent, columnKey: string) => {
			e.preventDefault();
			setResizingColumn(columnKey);

			const startX = e.clientX;
			const startWidth = e.currentTarget.closest('th')?.offsetWidth || 0;

			const handleMouseMove = (e: MouseEvent) => {
				const newWidth = startWidth + (e.clientX - startX);
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
		if (sortBy !== columnKey) return null;

		return sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
	};

	// Obtener ancho de columna
	const getColumnWidth = (column: ListColumnConfig) => {
		if (column.width === 'auto') return 'auto';
		return `${column.width}px`;
	};

	return (
		<thead className={`bg-muted/50 ${className}`}>
			<tr className="border-b">
				{visibleColumns.map((column, index) => {
					const isResizing = resizingColumn === column.key;
					const isDragging = draggedColumn === index;
					const isDragTarget = dragTarget === index;

					return (
						<th
							className={`group relative select-none border-border/50 border-r last:border-r-0${isDragging ? 'opacity-50' : ''}
								${isDragTarget ? 'bg-accent' : ''}
								${isResizing ? 'cursor-col-resize' : ''}
							`}
							draggable={onColumnReorder ? true : false}
							key={column.key}
							onDragOver={(e) => handleDragOver(e, index)}
							onDragStart={(e) => handleDragStart(e, index)}
							onDrop={(e) => handleDrop(e, index)}
							style={{
								width: getColumnWidth(column),
								minWidth: column.minWidth ? `${column.minWidth}px` : undefined,
								maxWidth: column.maxWidth ? `${column.maxWidth}px` : undefined,
								textAlign: column.align || 'left',
							}}
						>
							<div className="flex min-h-[40px] items-center gap-2 px-3 py-2">
								{/* Grip para drag and drop */}
								{onColumnReorder && (
									<div className="cursor-grab opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-100">
										<Grip className="h-3 w-3 text-muted-foreground" />
									</div>
								)}

								{/* Contenido de la columna */}
								<div
									className={`flex min-w-0 items-center gap-1 flex-1${column.sortable && onSort ? 'cursor-pointer hover:text-foreground' : ''}
									`}
									onClick={column.sortable ? () => handleSort(column.key) : undefined}
								>
									<span className="truncate font-medium text-sm">{column.label}</span>
									{renderSortIcon(column.key)}
								</div>

								{/* Resize handle */}
								{column.resizable !== false && onColumnResize && (
									<div
										className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize opacity-0 transition-opacity hover:bg-border group-hover:opacity-100"
										onMouseDown={(e) => handleMouseDown(e, column.key)}
									/>
								)}
							</div>
						</th>
					);
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

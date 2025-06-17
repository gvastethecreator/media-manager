'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import {
	ArrowDown,
	ArrowUp,
	Calendar,
	Clock,
	Copy,
	Download,
	FileText,
	GalleryHorizontal,
	Grid,
	Info,
	LayoutGrid,
	List,
	Trash2,
	X
} from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useCallback } from 'react';
import { FilterDefinition, FilterPanel } from '../filters/filter-panel';
import { SearchBar } from '../filters/search-bar';

export interface FileBrowserToolbarProps {
	className?: string;
	allItemIds?: string[];
	showSearch?: boolean;
	showFilters?: boolean;
	showDetailsToggle?: boolean;
	filters?: FilterDefinition[];
}

/**
 * Barra de herramientas para el FileBrowser
 * Integra búsqueda, filtros, selección y acciones sobre archivos
 */
export const FileBrowserToolbar = memo<FileBrowserToolbarProps>(function FileBrowserToolbar({
	className,
	allItemIds = [],
	showSearch = true,
	showFilters = true,
	showDetailsToggle = true,
	filters = []
}) {
	// Stores
	const {
		viewMode,
		setViewMode,
		itemSize,
		setItemSize,
		sortOptions,
		addSortOption
	} = useViewOptionsStore();

	const {
		selectedIds,
		clearSelection,
		selectAll,
		invertSelection
	} = useSelectionStore();

	const {
		isVisible,
		toggleVisibility
	} = useDetailsPanel();

	// Manejadores de eventos
	const handleSort = useCallback(
		(field: string) => {
			const currentSortOption = sortOptions.find(option => option.field === field);
			if (currentSortOption) {
				// Cambiar dirección si ya existe
				addSortOption({
					field,
					direction: currentSortOption.direction === 'asc' ? 'desc' : 'asc'
				});
			} else {
				// Añadir nueva opción de ordenación
				addSortOption({ field, direction: 'asc' });
			}
		},
		[sortOptions, addSortOption]
	);

	const handleSizeChange = useCallback((delta: number) => {
		setItemSize(Math.max(50, Math.min(300, itemSize + delta)));
	}, [itemSize, setItemSize]);

	const handleSelectAll = useCallback(() => {
		selectAll(allItemIds);
	}, [selectAll, allItemIds]);

	const handleInvertSelection = useCallback(() => {
		invertSelection(allItemIds);
	}, [invertSelection, allItemIds]);

	const handleDeleteSelected = useCallback(() => {
		// Implementar acción de eliminación
		console.log('Eliminar seleccionados:', selectedIds);
	}, [selectedIds]);

	const handleDownloadSelected = useCallback(() => {
		// Implementar acción de descarga
		console.log('Descargar seleccionados:', selectedIds);
	}, [selectedIds]);

	const handleCopySelected = useCallback(() => {
		// Implementar acción de copia
		console.log('Copiar seleccionados:', selectedIds);
	}, [selectedIds]);

	// Renderizar botones de ordenación
	const renderSortButtons = () => (
		<div className="flex items-center gap-0.5">
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 hover:bg-accent"
				title="Ordenar por nombre"
				onClick={() => handleSort('name')}
				data-active={sortOptions.some(opt => opt.field === 'name')}
			>
				<FileText className={cn('h-3.5 w-3.5', sortOptions.some(opt => opt.field === 'name') && 'text-primary')} />
				{sortOptions.some(opt => opt.field === 'name') && (
					<span className="ml-0.5">
						{sortOptions.find(opt => opt.field === 'name')?.direction === 'asc' ? (
							<ArrowUp className="h-2.5 w-2.5 text-primary" />
						) : (
							<ArrowDown className="h-2.5 w-2.5 text-primary" />
						)}
					</span>
				)}
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 hover:bg-accent"
				title="Ordenar por fecha de modificación"
				onClick={() => handleSort('modifiedAt')}
				data-active={sortOptions.some(opt => opt.field === 'modifiedAt')}
			>
				<Clock className={cn('h-3.5 w-3.5', sortOptions.some(opt => opt.field === 'modifiedAt') && 'text-primary')} />
				{sortOptions.some(opt => opt.field === 'modifiedAt') && (
					<span className="ml-0.5">
						{sortOptions.find(opt => opt.field === 'modifiedAt')?.direction === 'asc' ? (
							<ArrowUp className="h-2.5 w-2.5 text-primary" />
						) : (
							<ArrowDown className="h-2.5 w-2.5 text-primary" />
						)}
					</span>
				)}
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 hover:bg-accent"
				title="Ordenar por fecha de creación"
				onClick={() => handleSort('createdAt')}
				data-active={sortOptions.some(opt => opt.field === 'createdAt')}
			>
				<Calendar className={cn('h-3.5 w-3.5', sortOptions.some(opt => opt.field === 'createdAt') && 'text-primary')} />
				{sortOptions.some(opt => opt.field === 'createdAt') && (
					<span className="ml-0.5">
						{sortOptions.find(opt => opt.field === 'createdAt')?.direction === 'asc' ? (
							<ArrowUp className="h-2.5 w-2.5 text-primary" />
						) : (
							<ArrowDown className="h-2.5 w-2.5 text-primary" />
						)}
					</span>
				)}
			</Button>
		</div>
	);

	// Renderizar botones de vista
	const renderViewButtons = () => (
		<div className="flex items-center gap-0.5 bg-accent/10 rounded-md p-0.5">
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 hover:bg-accent"
				onClick={() => setViewMode('grid')}
				title="Vista de cuadrícula"
				data-active={viewMode === 'grid'}
			>
				<Grid className={cn('h-3.5 w-3.5', viewMode === 'grid' && 'text-primary font-bold')} />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 hover:bg-accent"
				onClick={() => setViewMode('cards')}
				title="Vista de tarjetas"
				data-active={viewMode === 'cards'}
			>
				<LayoutGrid className={cn('h-3.5 w-3.5', viewMode === 'cards' && 'text-primary font-bold')} />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 hover:bg-accent"
				onClick={() => setViewMode('masonry')}
				title="Vista de mosaico"
				data-active={viewMode === 'masonry'}
			>
				<GalleryHorizontal className={cn('h-3.5 w-3.5', viewMode === 'masonry' && 'text-primary font-bold')} />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 hover:bg-accent"
				onClick={() => setViewMode('list')}
				title="Vista de lista"
				data-active={viewMode === 'list'}
			>
				<List className={cn('h-3.5 w-3.5', viewMode === 'list' && 'text-primary font-bold')} />
			</Button>
		</div>
	);

	// Renderizar controles de tamaño
	const renderSizeControls = () => (
		<div className="flex items-center gap-0.5">
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 hover:bg-accent"
				onClick={() => handleSizeChange(-10)}
				title="Reducir tamaño"
			>
				<ArrowDown className="h-3.5 w-3.5" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 hover:bg-accent"
				onClick={() => handleSizeChange(10)}
				title="Aumentar tamaño"
			>
				<ArrowUp className="h-3.5 w-3.5" />
			</Button>
		</div>
	);

	// Renderizar acciones de selección
	const renderSelectionActions = () => {
		if (selectedIds.length === 0) return null;

		return (
			<motion.div
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -10 }}
				className="flex items-center gap-1 ml-2"
			>
				<Badge variant="secondary" className="h-5 px-1.5">
					{selectedIds.length} {selectedIds.length === 1 ? 'seleccionado' : 'seleccionados'}
				</Badge>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 hover:bg-accent"
					onClick={clearSelection}
					title="Limpiar selección"
				>
					<X className="h-3.5 w-3.5" />
				</Button>
				<Separator orientation="vertical" className="h-4 mx-1" />
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 hover:bg-accent"
					onClick={handleSelectAll}
					title="Seleccionar todo"
				>
					<span className="text-xs font-medium">Todo</span>
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 hover:bg-accent"
					onClick={handleInvertSelection}
					title="Invertir selección"
				>
					<span className="text-xs font-medium">Inv</span>
				</Button>
				<Separator orientation="vertical" className="h-4 mx-1" />
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 hover:bg-accent"
					onClick={handleDeleteSelected}
					title="Eliminar seleccionados"
				>
					<Trash2 className="h-3.5 w-3.5 text-destructive" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 hover:bg-accent"
					onClick={handleDownloadSelected}
					title="Descargar seleccionados"
				>
					<Download className="h-3.5 w-3.5" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 hover:bg-accent"
					onClick={handleCopySelected}
					title="Copiar seleccionados"
				>
					<Copy className="h-3.5 w-3.5" />
				</Button>
			</motion.div>
		);
	};

	return (
		<div className={cn('flex items-center justify-between h-10 px-2 border-b', className)}>
			<div className="flex items-center gap-2">
				{showSearch && (
					<div className="w-64">
						<SearchBar />
					</div>
				)}

				{renderSelectionActions()}
			</div>

			<div className="flex items-center gap-2">
				{showFilters && filters.length > 0 && (
					<FilterPanel filters={filters} />
				)}

				{renderSortButtons()}
				{renderViewButtons()}
				{renderSizeControls()}

				{showDetailsToggle && (
					<Button
						variant="ghost"
						size="icon"
						className={cn('h-7 w-7 hover:bg-accent', isVisible && 'bg-accent')}
						onClick={toggleVisibility}
						title={isVisible ? 'Ocultar detalles' : 'Mostrar detalles'}
					>
						<Info className="h-3.5 w-3.5" />
					</Button>
				)}
			</div>
		</div>
	);
});
'use client';

import {
	Archive,
	ArrowDown,
	ArrowLeft,
	ArrowRight,
	ArrowUp,
	BookImage,
	Box,
	Calendar,
	Camera,
	Clock,
	Copy,
	Download,
	Edit,
	FileText,
	FolderIcon,
	GalleryHorizontal,
	Grid,
	ImageIcon,
	Info,
	LayoutGrid,
	List,
	MapPin,
	Plus,
	Search,
	Share2,
	Star,
	TagIcon,
	Trash2,
	User2,
	X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback } from 'react';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { ViewBreadcrumbs } from '../navigation/breadcrumbs';

export interface ViewToolbarProps {
	isRightPanelCollapsed?: boolean;
	toggleRightPanelCollapse?: () => void;
	isRightPanelVisible?: boolean;
	allItemIds?: string[]; // IDs de todos los elementos disponibles para selección
}

export function ViewToolbar({
	isRightPanelCollapsed,
	toggleRightPanelCollapse,
	isRightPanelVisible,
	allItemIds = [],
}: ViewToolbarProps) {
	const { currentView, getCurrentItem } = useNavigationStore();

	// 🔄 Usar los nuevos stores de Zustand
	const viewMode = useViewOptionsStore((state) => state.viewMode);
	const setViewMode = useViewOptionsStore((state) => state.setViewMode);
	const sortOptions = useViewOptionsStore((state) => state.sortOptions);
	const addSortOption = useViewOptionsStore((state) => state.addSortOption);
	const searchQuery = useViewOptionsStore((state) => state.searchQuery);
	const setSearchQuery = useViewOptionsStore((state) => state.setSearchQuery);
	const itemSize = useViewOptionsStore((state) => state.itemSize);
	const setItemSize = useViewOptionsStore((state) => state.setItemSize);

	// 🔄 Store de selección
	const selectedIds = useSelectionStore((state) => state.selectedIds);
	const clearSelection = useSelectionStore((state) => state.clearSelection);
	const selectAll = useSelectionStore((state) => state.selectAll);
	const invertSelection = useSelectionStore((state) => state.invertSelection);

	const { isVisible, toggleVisibility } = useDetailsPanel();

	// Lista de vistas que requieren el panel de detalles
	const viewsWithDetails = [
		'all-images',
		'favorites',
		'search',
		'collection-content',
		'folder-content',
		'tag-content',
		'album-content',
		'character-content',
		'place-content',
		'world-item-content',
	];

	const showDetailsButton = viewsWithDetails.includes(currentView);

	// 🔄 Acciones para archivos seleccionados
	const handleDeleteSelected = useCallback(() => {
		if (selectedIds.length === 0) {
			return;
		}
		if (window.confirm(`¿Estás seguro de que quieres eliminar ${selectedIds.length} archivo(s)?`)) {
			// Implementar la eliminación de archivos usando server actions
			// TODO: Implementar server action para eliminar archivos
			clearSelection();
		}
	}, [selectedIds, clearSelection]);

	const handleDownloadSelected = useCallback(() => {
		if (selectedIds.length === 0) {
			return;
		}
		// TODO: Implementar server action para descargar archivos
	}, [selectedIds]);

	const handleCompressFiles = useCallback(() => {
		if (selectedIds.length === 0) {
			return;
		}
		// TODO: Implementar server action para comprimir archivos
		console.warn('La funcionalidad de compresión no está implementada en esta versión');
		alert('La funcionalidad de compresión de archivos estará disponible en una próxima actualización.');
	}, [selectedIds]);

	const handleCopySelected = useCallback(() => {
		if (selectedIds.length === 0) {
			return;
		}
		// TODO: Implementar server action para copiar archivos
	}, [selectedIds]);

	// 🔄 Manejador de ordenación
	const handleSort = useCallback(
		(field: string) => {
			const currentSortOption = sortOptions.find((option) => option.field === field);
			if (currentSortOption) {
				// Cambiar dirección si ya existe
				addSortOption({
					field,
					direction: currentSortOption.direction === 'asc' ? 'desc' : 'asc',
				});
			} else {
				// Añadir nueva opción de ordenación
				addSortOption({ field, direction: 'asc' });
			}
		},
		[sortOptions, addSortOption]
	);

	// 🔄 Manejador de selección
	const handleSelectAll = useCallback(() => {
		selectAll(allItemIds);
	}, [selectAll, allItemIds]);

	const handleInvertSelection = useCallback(() => {
		invertSelection(allItemIds);
	}, [invertSelection, allItemIds]);

	// 🔄 Manejador de cambio de tamaño
	const handleSizeChange = useCallback(
		(delta: number) => {
			setItemSize(Math.max(50, Math.min(300, itemSize + delta)));
		},
		[itemSize, setItemSize]
	);

	const renderSortButtons = () => (
		<div className="flex items-center gap-0.5">
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 hover:bg-accent"
				title="Ordenar por nombre"
				onClick={() => handleSort('name')}
				data-active={sortOptions.some((opt) => opt.field === 'name')}
			>
				<FileText className={cn('h-3.5 w-3.5', sortOptions.some((opt) => opt.field === 'name') && 'text-primary')} />
				{sortOptions.some((opt) => opt.field === 'name') && (
					<span className="ml-0.5">
						{sortOptions.find((opt) => opt.field === 'name')?.direction === 'asc' ? (
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
				data-active={sortOptions.some((opt) => opt.field === 'modifiedAt')}
			>
				<Clock className={cn('h-3.5 w-3.5', sortOptions.some((opt) => opt.field === 'modifiedAt') && 'text-primary')} />
				{sortOptions.some((opt) => opt.field === 'modifiedAt') && (
					<span className="ml-0.5">
						{sortOptions.find((opt) => opt.field === 'modifiedAt')?.direction === 'asc' ? (
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
				data-active={sortOptions.some((opt) => opt.field === 'createdAt')}
			>
				<Calendar
					className={cn('h-3.5 w-3.5', sortOptions.some((opt) => opt.field === 'createdAt') && 'text-primary')}
				/>
				{sortOptions.some((opt) => opt.field === 'createdAt') && (
					<span className="ml-0.5">
						{sortOptions.find((opt) => opt.field === 'createdAt')?.direction === 'asc' ? (
							<ArrowUp className="h-2.5 w-2.5 text-primary" />
						) : (
							<ArrowDown className="h-2.5 w-2.5 text-primary" />
						)}
					</span>
				)}
			</Button>
		</div>
	);

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
					<Plus className="h-3.5 w-3.5" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 hover:bg-accent"
					onClick={handleInvertSelection}
					title="Invertir selección"
				>
					<ArrowRight className="h-3.5 w-3.5" />
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
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 hover:bg-accent"
					onClick={handleCompressFiles}
					title="Comprimir seleccionados"
				>
					<Archive className="h-3.5 w-3.5" />
				</Button>
			</motion.div>
		);
	};

	// 🔄 Añadir controles de tamaño
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

	// 🔄 Añadir campo de búsqueda
	const renderSearchInput = () => (
		<div className="flex items-center gap-1 ml-2">
			<div className="relative">
				<Search className="h-3.5 w-3.5 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
				<input
					type="text"
					placeholder="Buscar..."
					className="h-7 pl-7 pr-2 rounded-md bg-accent/10 border-none focus:ring-1 focus:ring-primary text-sm"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
				{searchQuery && (
					<Button
						variant="ghost"
						size="icon"
						className="h-5 w-5 absolute right-1 top-1/2 transform -translate-y-1/2 hover:bg-accent"
						onClick={() => setSearchQuery('')}
						title="Limpiar búsqueda"
					>
						<X className="h-2.5 w-2.5" />
					</Button>
				)}
			</div>
		</div>
	);

	const renderContextActions = () => {
		switch (currentView) {
			case 'collection-content':
				return (
					<div className="flex items-center gap-0.5">
						<Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-accent">
							<Plus className="h-3.5 w-3.5 mr-1" />
							<span className="text-xs">Añadir imágenes</span>
						</Button>
						<Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-accent">
							<Edit className="h-3.5 w-3.5 mr-1" />
							<span className="text-xs">Editar colección</span>
						</Button>
						<Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-accent">
							<Share2 className="h-3.5 w-3.5 mr-1" />
							<span className="text-xs">Compartir</span>
						</Button>
					</div>
				);
			case 'folder-content':
				return (
					<div className="flex items-center gap-0.5">
						<Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-accent">
							<Plus className="h-3.5 w-3.5 mr-1" />
							<span className="text-xs">Nueva carpeta</span>
						</Button>
						<Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-accent">
							<ImageIcon className="h-3.5 w-3.5 mr-1" />
							<span className="text-xs">Subir imágenes</span>
						</Button>
					</div>
				);
			default:
				return null;
		}
	};

	const _renderIcon = () => {
		switch (currentView) {
			case 'all-images':
				return <ImageIcon className="h-4 w-4 mr-2 text-primary" />;
			case 'favorites':
				return <Star className="h-4 w-4 mr-2 text-yellow-500" />;
			case 'collection-content':
				return <BookImage className="h-4 w-4 mr-2 text-blue-500" />;
			case 'folder-content':
				return <FolderIcon className="h-4 w-4 mr-2 text-yellow-500" />;
			case 'tag-content':
				return <TagIcon className="h-4 w-4 mr-2 text-green-500" />;
			case 'album-content':
				return <Camera className="h-4 w-4 mr-2 text-purple-500" />;
			case 'character-content':
				return <User2 className="h-4 w-4 mr-2 text-red-500" />;
			case 'place-content':
				return <MapPin className="h-4 w-4 mr-2 text-cyan-500" />;
			case 'world-item-content':
				return <Box className="h-4 w-4 mr-2 text-orange-500" />;
			default:
				return null;
		}
	};

	const _item = getCurrentItem();

	return (
		<div className="flex items-center justify-between h-10 px-2 border-b">
			<div className="flex items-center">
				<ViewBreadcrumbs />
				{renderSelectionActions()}
			</div>

			<div className="flex items-center gap-2">
				{renderSearchInput()}
				{renderSortButtons()}
				{renderViewButtons()}
				{renderSizeControls()}
				{renderContextActions()}

				{showDetailsButton && (
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

				{isRightPanelVisible && (
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 hover:bg-accent"
						onClick={toggleRightPanelCollapse}
						title={isRightPanelCollapsed ? 'Expandir panel' : 'Colapsar panel'}
					>
						{isRightPanelCollapsed ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
					</Button>
				)}
			</div>
		</div>
	);
}
